import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a coaching prep assistant for Finding Good, supporting the Narrative Integrity coaching framework.

THE FRAMEWORK:
Narrative Integrity = the ability to clarify, act on, and communicate the most honest version of your story, and help others do the same.

The 12-week engagement has three phases:
- NAME (weeks 1-4): See the story clearly - confront what's actually true
- VALIDATE (weeks 5-8): Act on it confidently - gather evidence it works  
- ALIGN (weeks 9-12): Communicate it and help others do the same

THE FIRES FRAMEWORK:
- Feelings: Emotional awareness and regulation
- Influence: Locus of control and agency
- Resilience: Growth through difficulty, cognitive reappraisal
- Ethics: Values alignment and purpose
- Strengths: Capability confidence and self-efficacy

THE FOUR ZONES:
- Exploring (Low confidence, Low alignment): Stay curious, refine direction
- Discovering (Low confidence, High alignment): Bring forward past wins
- Performing (High confidence, Low alignment): Reconnect to identity
- Owning (High confidence, High alignment): Extend influence to others

MORE/LESS MARKERS:
Track what clients want more of and less of. Key insight: Every "more of" has a corresponding "less of" - explore the exchange.

When analyzing client data:
1. Reference their current engagement phase and what that phase is about
2. Look at More/Less marker movement - are they progressing toward targets?
3. Notice FIRES patterns across snapshots and daily impacts
4. Surface specific quotes from their raw answers
5. Connect daily impacts to the larger story (3Ps)
6. For session prep, suggest 1-2 specific things to be curious about
7. Note any coach traps to avoid (giving advice, fixing, insight-stealing)

The coach is preparing for a real session. Be direct and practical.
If no client is selected, help with general coaching questions.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clientEmail, message, conversationHistory = [] } = await req.json()

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: 'API key not configured. Please add ANTHROPIC_API_KEY to Supabase secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let clientContext = ''
    
    // If client selected, fetch their data
    if (clientEmail) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const [clientRes, engagementRes, markersRes, snapshotsRes, impactsRes, notesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('email', clientEmail).single(),
        supabase.from('coaching_engagements').select('*').eq('client_email', clientEmail).eq('status', 'active').single(),
        supabase.from('more_less_markers').select('*').eq('client_email', clientEmail).eq('is_active', true),
        supabase.from('snapshots').select('*').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(3),
        supabase.from('impact_verifications').select('*').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(10),
        supabase.from('coaching_notes').select('*').eq('client_email', clientEmail).order('note_date', { ascending: false }).limit(5)
      ])

      clientContext = buildClientContext(
        clientRes.data,
        engagementRes.data,
        markersRes.data || [],
        snapshotsRes.data || [],
        impactsRes.data || [],
        notesRes.data || []
      )
    }

    // Build messages array for Claude
    const messages = [
      ...conversationHistory.map((m: any) => ({
        role: m.role,
        content: m.content
      })),
      {
        role: 'user',
        content: clientContext 
          ? `${message}\n\n---\nCLIENT CONTEXT:\n${clientContext}`
          : message
      }
    ]

    // Call Claude API directly
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('Claude API error:', data.error)
      return new Response(
        JSON.stringify({ error: data.error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ response: data.content[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildClientContext(client: any, engagement: any, markers: any[], snapshots: any[], impacts: any[], notes: any[]): string {
  const lines: string[] = []
  
  lines.push(`CLIENT: ${client?.name || client?.email || 'Unknown'}`)
  lines.push('')
  
  if (engagement) {
    lines.push('=== ENGAGEMENT ===')
    lines.push(`Phase: ${engagement.current_phase?.toUpperCase()} - Week ${engagement.current_week} of 12`)
    lines.push(`Status: ${engagement.status}`)
    if (engagement.story_present) lines.push(`Present: ${engagement.story_present}`)
    if (engagement.story_past) lines.push(`Past: ${engagement.story_past}`)
    if (engagement.story_potential) lines.push(`Potential: ${engagement.story_potential}`)
    if (engagement.goals?.length) {
      lines.push('Goals:')
      engagement.goals.forEach((g: any) => lines.push(`  • ${g.goal} (${g.fires_lever})`))
    }
    lines.push('')
  }
  
  if (markers.length) {
    lines.push('=== MORE/LESS MARKERS ===')
    markers.forEach((m: any) => {
      lines.push(`${m.marker_type.toUpperCase()}: "${m.marker_text}"`)
      lines.push(`  ${m.baseline_score} → ${m.current_score} → ${m.target_score} (target)`)
    })
    lines.push('')
  }
  
  if (snapshots.length) {
    lines.push('=== RECENT SNAPSHOTS ===')
    snapshots.forEach((s: any) => {
      lines.push(`${s.created_at?.split('T')[0]}: Zone=${s.overall_zone}, Growth=${s.growth_opportunity_category}`)
      if (s.goal) lines.push(`  Goal: ${s.goal}`)
    })
    lines.push('')
  }
  
  if (impacts.length) {
    lines.push('=== RECENT IMPACTS ===')
    impacts.slice(0, 5).forEach((i: any) => {
      lines.push(`${i.created_at?.split('T')[0]}:`)
      if (i.responses?.what_did) lines.push(`  Did: ${i.responses.what_did}`)
      if (i.integrity_line) lines.push(`  "${i.integrity_line}"`)
    })
    lines.push('')
  }
  
  if (notes.length) {
    lines.push('=== COACH NOTES ===')
    notes.forEach((n: any) => {
      lines.push(`${n.note_date}: ${n.content}`)
    })
  }
  
  return lines.join('\n')
}
