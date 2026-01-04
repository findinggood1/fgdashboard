import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COACH_SYSTEM_PROMPT = `You are a coaching prep assistant for Finding Good, supporting the Narrative Integrity coaching framework.

THE FRAMEWORK:
Narrative Integrity = the ability to clarify, act on, and communicate the most honest version of your story, and help others do the same.

The 12-week engagement has three phases:
- NAME (weeks 1-4): See the story clearly - confront what's actually true
- VALIDATE (weeks 5-8): Act on it confidently - gather evidence it works  
- COMMUNICATE (weeks 9-12): Communicate it and help others do the same

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

FOCUS AREAS:
The client's primary coaching focus can be: Career, Relationships, Health & Wellness, Leadership, Sales, Entrepreneurship, or Life Transition.

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

const CLIENT_SYSTEM_PROMPT = `You are a supportive AI companion for Finding Good coaching clients. Your role is to help clients reflect on and understand their coaching journey.

YOUR APPROACH:
- Be warm, encouraging, and supportive
- Ask reflective questions rather than giving direct advice
- Reference the client's specific data (goals, snapshots, progress) when relevant
- Help them see patterns and connections in their journey
- Celebrate their progress and growth

THE FIRES FRAMEWORK (help them understand):
- Feelings: Emotional awareness and how they process experiences
- Influence: Sense of agency and control over their life
- Resilience: How they grow through challenges
- Ethics: Alignment with their values and purpose
- Strengths: Confidence in their capabilities

THE FOUR ZONES (explain when asked):
- Exploring (Low confidence, Low alignment): A time for curiosity and trying new directions
- Discovering (Low confidence, High alignment): Reconnecting with past wins and strengths
- Performing (High confidence, Low alignment): Returning to core identity and values
- Owning (High confidence, High alignment): Leading and extending influence to others

THE THREE PHASES:
- NAME (weeks 1-4): Seeing the story clearly
- VALIDATE (weeks 5-8): Acting on it with confidence
- COMMUNICATE (weeks 9-12): Sharing it and helping others

IMPORTANT GUIDELINES:
- You are NOT their coach - you support reflection between sessions
- Encourage them to bring insights to their next coaching session
- Don't give prescriptive advice; ask questions that help them discover answers
- Reference their specific goals, markers, and progress when available
- If they're struggling, acknowledge it and remind them their coach is there to help

If you don't have much context about their journey, acknowledge this warmly and offer to explain the FIRES framework or what to expect from coaching.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clientEmail, message, conversationHistory = [], mode = 'coach' } = await req.json()
    
    console.log(`Chat request - mode: ${mode}, clientEmail: ${clientEmail}`)

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: 'API key not configured. Please add ANTHROPIC_API_KEY to Supabase secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let clientContext = ''
    const isClientMode = mode === 'client'
    
    // Fetch client data
    if (clientEmail) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      if (isClientMode) {
        // Client mode: fetch only client-visible data (no coach notes/observations)
        const [clientRes, engagementRes, markersRes, snapshotsRes, impactsRes, sessionsRes] = await Promise.all([
          supabase.from('clients').select('name, email').eq('email', clientEmail).single(),
          supabase.from('coaching_engagements').select('*').eq('client_email', clientEmail).eq('status', 'active').single(),
          supabase.from('more_less_markers').select('*').eq('client_email', clientEmail).eq('is_active', true),
          supabase.from('snapshots').select('id, created_at, overall_zone, goal, growth_opportunity_category, total_confidence, total_alignment, zone_breakdown').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(5),
          supabase.from('impact_verifications').select('id, created_at, type, responses, integrity_line, fires_focus').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(10),
          supabase.from('session_transcripts').select('id, created_at, session_number, summary, key_themes, action_items').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(5)
        ])

        clientContext = buildClientPortalContext(
          clientRes.data,
          engagementRes.data,
          markersRes.data || [],
          snapshotsRes.data || [],
          impactsRes.data || [],
          sessionsRes.data || []
        )
      } else {
        // Coach mode: fetch all data including coach notes
        const [clientRes, engagementRes, markersRes, snapshotsRes, impactsRes, notesRes] = await Promise.all([
          supabase.from('clients').select('*').eq('email', clientEmail).single(),
          supabase.from('coaching_engagements').select('*').eq('client_email', clientEmail).eq('status', 'active').single(),
          supabase.from('more_less_markers').select('*').eq('client_email', clientEmail).eq('is_active', true),
          supabase.from('snapshots').select('*').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(3),
          supabase.from('impact_verifications').select('*').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(10),
          supabase.from('coaching_notes').select('*').eq('client_email', clientEmail).order('note_date', { ascending: false }).limit(5)
        ])

        clientContext = buildCoachContext(
          clientRes.data,
          engagementRes.data,
          markersRes.data || [],
          snapshotsRes.data || [],
          impactsRes.data || [],
          notesRes.data || []
        )
      }
    }

    // Select appropriate system prompt
    const systemPrompt = isClientMode ? CLIENT_SYSTEM_PROMPT : COACH_SYSTEM_PROMPT

    // Build messages array for Claude
    const messages = [
      ...conversationHistory.map((m: any) => ({
        role: m.role,
        content: m.content
      })),
      {
        role: 'user',
        content: clientContext 
          ? `${message}\n\n---\nYOUR JOURNEY DATA:\n${clientContext}`
          : message
      }
    ]

    console.log(`Calling Claude API with ${messages.length} messages, context length: ${clientContext.length}`)

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
        system: systemPrompt,
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

    console.log('Claude response received successfully')

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

// Context builder for COACH mode (includes coach notes)
function buildCoachContext(client: any, engagement: any, markers: any[], snapshots: any[], impacts: any[], notes: any[]): string {
  const lines: string[] = []
  
  lines.push(`CLIENT: ${client?.name || client?.email || 'Unknown'}`)
  lines.push('')
  
  if (engagement) {
    const focusLabels: Record<string, string> = {
      career: 'Career',
      relationships: 'Relationships',
      health: 'Health & Wellness',
      leadership: 'Leadership',
      sales: 'Sales',
      entrepreneurship: 'Entrepreneurship',
      transition: 'Life Transition',
    };
    
    lines.push('=== ENGAGEMENT ===')
    lines.push(`Phase: ${engagement.current_phase?.toUpperCase()} - Week ${engagement.current_week} of 12`)
    lines.push(`Status: ${engagement.status}`)
    if (engagement.focus) lines.push(`Focus: ${focusLabels[engagement.focus] || engagement.focus}`)
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

// Context builder for CLIENT mode (NO coach-private data)
function buildClientPortalContext(client: any, engagement: any, markers: any[], snapshots: any[], impacts: any[], sessions: any[]): string {
  const lines: string[] = []
  
  const firstName = client?.name?.split(' ')[0] || 'there'
  lines.push(`Hello ${firstName}!`)
  lines.push('')
  
  if (engagement) {
    const focusLabels: Record<string, string> = {
      career: 'Career',
      relationships: 'Relationships',
      health: 'Health & Wellness',
      leadership: 'Leadership',
      sales: 'Sales',
      entrepreneurship: 'Entrepreneurship',
      transition: 'Life Transition',
    };
    
    lines.push('=== YOUR COACHING JOURNEY ===')
    lines.push(`Phase: ${engagement.current_phase?.toUpperCase()} - Week ${engagement.current_week} of 12`)
    if (engagement.focus) lines.push(`Focus Area: ${focusLabels[engagement.focus] || engagement.focus}`)
    
    // Three Stories (3Ps)
    if (engagement.story_present || engagement.story_past || engagement.story_potential) {
      lines.push('')
      lines.push('Your Three Stories:')
      if (engagement.story_present) lines.push(`  Present: ${engagement.story_present}`)
      if (engagement.story_past) lines.push(`  Past: ${engagement.story_past}`)
      if (engagement.story_potential) lines.push(`  Potential: ${engagement.story_potential}`)
    }
    
    // Goals
    if (engagement.goals?.length) {
      lines.push('')
      lines.push('Your Goals:')
      engagement.goals.forEach((g: any) => lines.push(`  • ${g.goal} (${g.fires_lever})`))
    }
    
    // Challenges
    if (engagement.challenges?.length) {
      lines.push('')
      lines.push('Your Challenges:')
      engagement.challenges.forEach((c: any) => lines.push(`  • ${c.challenge}`))
    }
    lines.push('')
  }
  
  if (markers.length) {
    lines.push('=== YOUR MORE/LESS MARKERS ===')
    markers.forEach((m: any) => {
      const progress = m.current_score - m.baseline_score
      const progressStr = progress > 0 ? `+${progress}` : progress.toString()
      lines.push(`${m.marker_type.toUpperCase()}: "${m.marker_text}"`)
      lines.push(`  Progress: ${m.baseline_score} → ${m.current_score} (${progressStr}) | Target: ${m.target_score}`)
    })
    lines.push('')
  }
  
  if (snapshots.length) {
    lines.push('=== YOUR RECENT SNAPSHOTS ===')
    snapshots.forEach((s: any) => {
      const date = new Date(s.created_at).toLocaleDateString()
      lines.push(`${date}:`)
      lines.push(`  Zone: ${s.overall_zone}`)
      if (s.goal) lines.push(`  Goal: ${s.goal}`)
      if (s.growth_opportunity_category) lines.push(`  Growth Area: ${s.growth_opportunity_category}`)
      if (s.total_confidence) lines.push(`  Confidence: ${s.total_confidence}/50`)
      if (s.total_alignment) lines.push(`  Alignment: ${s.total_alignment}/50`)
      if (s.zone_breakdown) {
        lines.push(`  FIRES Zones: F=${s.zone_breakdown.feelings || 'N/A'}, I=${s.zone_breakdown.influence || 'N/A'}, R=${s.zone_breakdown.resilience || 'N/A'}, E=${s.zone_breakdown.ethics || 'N/A'}, S=${s.zone_breakdown.strengths || 'N/A'}`)
      }
    })
    lines.push('')
  }
  
  if (impacts.length) {
    lines.push('=== YOUR RECENT DAILY IMPACTS ===')
    impacts.slice(0, 5).forEach((i: any) => {
      const date = new Date(i.created_at).toLocaleDateString()
      lines.push(`${date} (${i.type || 'Self'}):`)
      if (i.responses?.what_did) lines.push(`  What you did: ${i.responses.what_did}`)
      if (i.responses?.how_feel) lines.push(`  How you felt: ${i.responses.how_feel}`)
      if (i.integrity_line) lines.push(`  Your integrity line: "${i.integrity_line}"`)
      if (i.fires_focus) lines.push(`  FIRES focus: ${i.fires_focus}`)
    })
    lines.push('')
  }
  
  if (sessions.length) {
    lines.push('=== YOUR SESSION SUMMARIES ===')
    sessions.forEach((s: any) => {
      const date = new Date(s.created_at).toLocaleDateString()
      lines.push(`Session ${s.session_number || '?'} (${date}):`)
      if (s.summary) lines.push(`  Summary: ${s.summary}`)
      if (s.key_themes?.length) lines.push(`  Themes: ${s.key_themes.join(', ')}`)
      if (s.action_items?.length) {
        lines.push(`  Action Items:`)
        s.action_items.forEach((a: any) => {
          const status = a.completed ? '✓' : '○'
          lines.push(`    ${status} ${a.item}`)
        })
      }
    })
  }
  
  return lines.join('\n')
}
