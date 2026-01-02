import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { clientEmail, message, conversationHistory } = await req.json();
    console.log('Received request:', { clientEmail, message, historyLength: conversationHistory?.length });

    // Create Supabase client for fetching client data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build context about the client if one is selected
    let clientContext = '';
    if (clientEmail) {
      console.log('Fetching client data for:', clientEmail);
      
      // Fetch client details
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('email', clientEmail)
        .single();

      if (client) {
        clientContext = `
## Current Client: ${client.name}

**Personal Info:**
- Email: ${client.email}
- Status: ${client.status || 'active'}
- Start Date: ${client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Unknown'}

**Story:** ${client.story || 'No story recorded yet.'}

**Goals & Challenges:**
- Goals: ${client.goals || 'Not specified'}
- Challenges: ${client.challenges || 'Not specified'}

**FIRES Assessment:**
- Focus: ${client.fires_focus || 'Not assessed'}
- Ideation: ${client.fires_ideation || 'Not assessed'}
- Relationships: ${client.fires_relationships || 'Not assessed'}
- Energy: ${client.fires_energy || 'Not assessed'}
- Stress: ${client.fires_stress || 'Not assessed'}

**More/Less Preferences:**
- More of: ${client.more_of || 'Not specified'}
- Less of: ${client.less_of || 'Not specified'}
`;

        // Fetch recent sessions
        const { data: sessions } = await supabase
          .from('sessions')
          .select('*')
          .eq('client_email', clientEmail)
          .order('session_date', { ascending: false })
          .limit(5);

        if (sessions && sessions.length > 0) {
          clientContext += `\n**Recent Sessions:**\n`;
          sessions.forEach(session => {
            clientContext += `- ${session.session_date}: ${session.summary || session.title || 'No summary'}\n`;
          });
        }
      }
    }

    // Build the system prompt
    const systemPrompt = `You are an AI coaching assistant for executive coaches using the FIRES framework. 
Your role is to help coaches prepare for sessions, understand client history, and brainstorm coaching strategies.

## The FIRES Framework
FIRES stands for:
- **Focus**: The client's ability to concentrate on what matters most
- **Ideation**: Creative thinking, innovation, and generating new ideas
- **Relationships**: Connection with others, communication, and interpersonal dynamics
- **Energy**: Physical and mental vitality, motivation, and drive
- **Stress**: Managing pressure, anxiety, and maintaining balance

Each element is rated on a scale:
- 🔴 Red (1-3): Needs significant attention
- 🟡 Yellow (4-6): Moderate, room for improvement
- 🟢 Green (7-10): Strong area

## Your Guidelines
1. Be supportive, insightful, and professional
2. Reference specific client data when available
3. Suggest practical coaching questions and approaches
4. Connect observations to the FIRES framework when relevant
5. Help identify patterns and themes across sessions
6. Keep responses concise but actionable

${clientContext ? `## Client Context\n${clientContext}` : 'No client is currently selected. You can answer general questions about coaching strategies and the FIRES framework.'}`;

    // Format messages for the AI
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('Calling Lovable AI with', formattedMessages.length, 'messages');

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `AI Gateway error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No response generated';
    
    console.log('AI response received, length:', aiResponse.length);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in coaching-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
