// Supabase Edge Function: generate-narrative-map
// Purpose: Analyzes all client data and generates Narrative Integrity Map content
// - Superpowers (Claimed, Emerging, Hidden)
// - Zone interpretation
// - What the World Is Asking
// - Suggested weekly actions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WEEKLY_MAP_SYSTEM_PROMPT = `You are generating a Weekly Narrative Map for a coaching client in the Finding Good system.

CONTEXT:
- This client is in a 12-week Narrative Integrity coaching engagement
- The three phases are: NAME (weeks 1-4), VALIDATE (weeks 5-8), ALIGN (weeks 9-12)
- NAME = building clarity about their story
- VALIDATE = gathering evidence that acting on it works  
- ALIGN = holding it under pressure and helping others
- FIRES framework: Feelings, Influence, Resilience, Ethics, Strengths
- The Four Zones: Exploring, Discovering, Performing, Owning

YOUR TASK:
Generate TWO separate outputs from the client data provided:

1. CLIENT_MAP (shown to the client in their portal - warm, celebratory, grounded in their words):
- story_summary: 2-3 sentences about what's emerging in their story this week. Reference specific things they said or did.
- zone_insight: 1-2 sentences about what their current zone means for them right now.
- wins_this_week: Array of 2-4 specific wins from the data. Quote their actual words when possible. Be concrete.
- focus_next_week: 1 sentence about where to put attention. Make it actionable but not prescriptive.
- reflection_prompt: 1 powerful question for them to sit with. Should provoke useful thinking.

2. COACH_MAP (only the coach sees this - direct, analytical, useful for session prep):
- patterns_noticed: Array of 2-4 patterns across the data the coach should notice. Connect dots they might miss.
- potential_blindspots: Array of 1-3 things the client may not be seeing about themselves or their situation.
- conversation_starters: Array of 2-3 curiosity-based questions for the next session. No SOFA (Suggestions, Opinions, Feedback, Advice).
- markers_to_watch: Array of specific More/Less markers showing movement or stuck. Note direction of change.
- phase_alignment: 1-2 sentences about how they're progressing in their current phase (NAME/VALIDATE/ALIGN).

IMPORTANT GUIDELINES:
- Ground everything in the actual data provided - don't make things up
- For client_map: Use "you" language, celebrate what's working, be warm
- For coach_map: Be direct and analytical, surface what's useful for coaching
- If data is sparse, acknowledge that rather than fabricating insights
- Quote the client's own words whenever possible (they're more powerful than your paraphrases)

OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "client_map": {
    "story_summary": "string",
    "zone_insight": "string",
    "wins_this_week": ["string", "string"],
    "focus_next_week": "string",
    "reflection_prompt": "string"
  },
  "coach_map": {
    "patterns_noticed": ["string", "string"],
    "potential_blindspots": ["string"],
    "conversation_starters": ["string", "string"],
    "markers_to_watch": ["string"],
    "phase_alignment": "string"
  }
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clientEmail, engagementId, regenerateAll = false, dataFrom, dataTo } = await req.json()

    // Default to last 7 days if not specified
    const fromDate = dataFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const toDate = dataTo || new Date().toISOString()

    console.log(`Generating narrative map for ${clientEmail} from ${fromDate} to ${toDate}`)

    if (!clientEmail) {
      return new Response(
        JSON.stringify({ error: 'Client email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all client data with date range filtering
    const [
      clientRes,
      engagementRes,
      markersRes,
      snapshotsRes,
      impactsRes,
      sessionsRes,
      notesRes,
      zoneDefaultsRes,
      voiceMemosRes,
      clientFilesRes
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('email', clientEmail).single(),
      engagementId 
        ? supabase.from('coaching_engagements').select('*').eq('id', engagementId).single()
        : supabase.from('coaching_engagements').select('*').eq('client_email', clientEmail).eq('status', 'active').single(),
      supabase.from('more_less_markers').select('*').eq('client_email', clientEmail).eq('is_active', true),
      // Snapshots in date range
      supabase.from('snapshots').select('*').eq('client_email', clientEmail).gte('created_at', fromDate).lte('created_at', toDate).order('created_at', { ascending: false }).limit(10),
      // Impact verifications in date range
      supabase.from('impact_verifications').select('*').eq('client_email', clientEmail).gte('created_at', fromDate).lte('created_at', toDate).order('created_at', { ascending: false }).limit(30),
      // Session transcripts in date range
      supabase.from('session_transcripts').select('*').eq('client_email', clientEmail).gte('created_at', fromDate).lte('created_at', toDate).order('created_at', { ascending: false }).limit(10),
      // Coaching notes in date range
      supabase.from('coaching_notes').select('*').eq('client_email', clientEmail).gte('created_at', fromDate).lte('created_at', toDate).order('created_at', { ascending: false }).limit(20),
      supabase.from('zone_defaults').select('*'),
      // Voice memos in date range
      supabase.from('voice_memos').select('id, title, transcription, created_at').eq('client_email', clientEmail).gte('created_at', fromDate).lte('created_at', toDate).order('created_at', { ascending: false }).limit(10),
      // Client files in date range
      supabase.from('client_files').select('id, file_name, file_type, description, created_at').eq('client_email', clientEmail).gte('created_at', fromDate).lte('created_at', toDate).order('created_at', { ascending: false }).limit(10)
    ])

    const client = clientRes.data
    const engagement = engagementRes.data
    const markers = markersRes.data || []
    const snapshots = snapshotsRes.data || []
    const impacts = impactsRes.data || []
    const sessions = sessionsRes.data || []
    const notes = notesRes.data || []
    const zoneDefaults = zoneDefaultsRes.data || []
    const voiceMemos = voiceMemosRes.data || []
    const clientFiles = clientFilesRes.data || []

    // Fetch marker updates for this client's markers in date range
    let markerUpdates: any[] = []
    if (markers.length > 0) {
      const markerIds = markers.map((m: any) => m.id)
      const { data: updatesData } = await supabase
        .from('more_less_updates')
        .select('*')
        .in('marker_id', markerIds)
        .gte('created_at', fromDate)
        .lte('created_at', toDate)
        .order('created_at', { ascending: false })
        .limit(30)
      markerUpdates = updatesData || []
    }

    if (!engagement) {
      return new Response(
        JSON.stringify({ error: 'No active engagement found for this client' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build comprehensive context
    const context = buildAnalysisContext(client, engagement, markers, snapshots, impacts, sessions, notes, markerUpdates, voiceMemos, clientFiles)

    // Call Claude for analysis with new weekly map prompt
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: WEEKLY_MAP_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Generate a Weekly Narrative Map for this client based on the following data from ${fromDate.split('T')[0]} to ${toDate.split('T')[0]}.

CLIENT DATA:
${context}

---

Generate the client_map and coach_map as specified. Return ONLY valid JSON.`
        }]
      })
    })

    const aiData = await response.json()
    
    if (aiData.error) {
      console.error('Claude API error:', aiData.error)
      throw new Error(aiData.error.message)
    }

    // Parse the AI response
    let parsedMaps
    try {
      // Handle potential markdown code blocks in response
      let content = aiData.content[0].text
      if (content.startsWith('```')) {
        content = content.replace(/```json?\n?/g, '').replace(/```$/g, '')
      }
      parsedMaps = JSON.parse(content.trim())
    } catch (e) {
      console.error('Failed to parse AI response:', aiData.content[0].text)
      throw new Error('AI returned invalid JSON')
    }

    console.log('Generated maps successfully:', {
      has_client_map: !!parsedMaps.client_map,
      has_coach_map: !!parsedMaps.coach_map
    })

    // Return both maps in the response (don't save to coaching_engagements yet)
    return new Response(
      JSON.stringify({
        success: true,
        client_map: parsedMaps.client_map,
        coach_map: parsedMaps.coach_map,
        date_range: {
          from: fromDate,
          to: toDate
        },
        data_summary: {
          snapshots_count: snapshots?.length || 0,
          impacts_count: impacts?.length || 0,
          sessions_count: sessions?.length || 0,
          notes_count: notes?.length || 0,
          memos_count: voiceMemos?.length || 0,
          files_count: clientFiles?.length || 0,
          marker_updates_count: markerUpdates?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildAnalysisContext(
  client: any,
  engagement: any,
  markers: any[],
  snapshots: any[],
  impacts: any[],
  sessions: any[],
  notes: any[],
  markerUpdates: any[] = [],
  voiceMemos: any[] = [],
  clientFiles: any[] = []
): string {
  const lines: string[] = []

  // Client basics
  lines.push(`CLIENT: ${client?.name || client?.email}`)
  lines.push('')

  // Engagement context
  lines.push('=== ENGAGEMENT CONTEXT ===')
  lines.push(`Phase: ${engagement.current_phase?.toUpperCase()} - Week ${engagement.current_week} of 12`)
  lines.push(`Primary Arena: ${engagement.primary_arena || 'Not set'}`)
  lines.push('')

  // The Story (3Ps)
  if (engagement.story_present || engagement.story_past || engagement.story_potential) {
    lines.push('=== THE STORY WE\'RE STRENGTHENING ===')
    lines.push(`PRESENT (Where they are now): ${engagement.story_present || 'Not captured'}`)
    lines.push(`PAST (What brought them here): ${engagement.story_past || 'Not captured'}`)
    lines.push(`POTENTIAL (Where they're going): ${engagement.story_potential || 'Not captured'}`)
    lines.push('')
  }

  // Goals & Challenges
  if (engagement.goals?.length || engagement.challenges?.length) {
    lines.push('=== GOALS & CHALLENGES ===')
    if (engagement.goals?.length) {
      lines.push('Goals:')
      engagement.goals.forEach((g: any) => lines.push(`  • ${g.goal} (FIRES: ${g.fires_lever})`))
    }
    if (engagement.challenges?.length) {
      lines.push('Challenges:')
      engagement.challenges.forEach((c: any) => lines.push(`  • ${c.challenge} (FIRES: ${c.fires_lever})`))
    }
    lines.push('')
  }

  // FIRES Focus
  if (engagement.fires_focus?.length) {
    lines.push(`FIRES FOCUS: ${engagement.fires_focus.join(', ')}`)
    lines.push('')
  }

  // More/Less Markers with progress
  if (markers.length) {
    lines.push('=== MORE/LESS MARKERS ===')
    markers.forEach((m: any) => {
      const progress = m.marker_type === 'more' 
        ? m.current_score - m.baseline_score
        : m.baseline_score - m.current_score
      const progressText = progress > 0 ? `(+${progress} progress)` : progress < 0 ? `(${progress} regression)` : '(no change)'
      lines.push(`${m.marker_type.toUpperCase()}: "${m.marker_text}"`)
      lines.push(`  Baseline: ${m.baseline_score} → Current: ${m.current_score} → Target: ${m.target_score} ${progressText}`)
      if (m.fires_connection) lines.push(`  FIRES: ${m.fires_connection}`)
      if (m.exchange_insight) lines.push(`  Exchange: ${m.exchange_insight}`)
    })
    lines.push('')
  }

  // Snapshots with FIRES scores
  if (snapshots.length) {
    lines.push('=== FIRES SNAPSHOTS ===')
    snapshots.forEach((s: any, i: number) => {
      lines.push(`Snapshot ${i + 1} (${s.created_at?.split('T')[0]}):`)
      lines.push(`  Goal: ${s.goal}`)
      lines.push(`  Overall Zone: ${s.overall_zone}`)
      lines.push(`  Growth Opportunity: ${s.growth_opportunity_category} (${s.growth_opportunity_zone})`)
      lines.push(`  Owning Highlight: ${s.owning_highlight_category} (${s.owning_highlight_zone})`)
      
      // Zone breakdown if available
      if (s.zone_breakdown) {
        lines.push('  Zone Breakdown:')
        Object.entries(s.zone_breakdown).forEach(([element, zone]) => {
          lines.push(`    ${element}: ${zone}`)
        })
      }
      
      // Key answers
      if (s.fs_answers || s.ps_answers) {
        lines.push('  Key Answers:')
        if (s.fs_answers?.fs1) lines.push(`    Future goal: ${s.fs_answers.fs1}`)
        if (s.fs_answers?.fs3) lines.push(`    Emotion needed: ${s.fs_answers.fs3}`)
        if (s.fs_answers?.fs4) lines.push(`    Staying in difficulty: ${s.fs_answers.fs4}`)
        if (s.fs_answers?.fs5) lines.push(`    Values alignment: ${s.fs_answers.fs5}`)
        if (s.fs_answers?.fs6) lines.push(`    Strengths needed: ${s.fs_answers.fs6}`)
        if (s.ps_answers?.ps1) lines.push(`    Past success: ${s.ps_answers.ps1}`)
        if (s.ps_answers?.ps3) lines.push(`    What worked: ${s.ps_answers.ps3}`)
        if (s.ps_answers?.ps4) lines.push(`    How stayed in difficulty: ${s.ps_answers.ps4}`)
        if (s.past_support) lines.push(`    Who helped: ${s.past_support}`)
        if (s.future_support) lines.push(`    Who they'll rely on: ${s.future_support}`)
      }
      
      // AI narrative if available
      if (s.narrative?.summary) {
        lines.push(`  AI Narrative: ${s.narrative.summary}`)
      }
      lines.push('')
    })
  }

  // Impact entries
  if (impacts.length) {
    lines.push('=== RECENT IMPACT ENTRIES ===')
    impacts.forEach((i: any) => {
      const date = i.created_at?.split('T')[0]
      lines.push(`${date}:`)
      if (i.responses?.what_did || i.responses?.moment) {
        lines.push(`  What they did: ${i.responses.what_did || i.responses.moment}`)
      }
      if (i.responses?.how_did || i.responses?.role) {
        lines.push(`  How they did it: ${i.responses.how_did || i.responses.role}`)
      }
      if (i.responses?.what_impact || i.responses?.impact) {
        lines.push(`  Impact created: ${i.responses.what_impact || i.responses.impact}`)
      }
      if (i.integrity_line) {
        lines.push(`  Integrity Line: "${i.integrity_line}"`)
      }
      if (i.fires_focus?.length) {
        lines.push(`  FIRES Focus: ${i.fires_focus.join(', ')}`)
      }
    })
    lines.push('')
  }

  // Session summaries and transcripts
  if (sessions.length) {
    lines.push('=== COACHING SESSIONS ===')
    sessions.forEach((s: any) => {
      lines.push(`Session ${s.session_number} (${s.session_date}):`)
      if (s.summary) lines.push(`  Summary: ${s.summary}`)
      if (s.key_themes?.length) lines.push(`  Themes: ${s.key_themes.join(', ')}`)
      if (s.client_breakthroughs) lines.push(`  Breakthroughs: ${s.client_breakthroughs}`)
      if (s.coach_observations) lines.push(`  Coach Observations: ${s.coach_observations}`)
      if (s.next_session_focus) lines.push(`  Next Focus: ${s.next_session_focus}`)
      
      // Include key quotes
      if (s.key_quotes?.length) {
        lines.push('  Key Quotes:')
        s.key_quotes.forEach((q: any) => {
          lines.push(`    "${q.quote}" - ${q.context || ''}`)
        })
      }
      
      // Include relevant transcript excerpts if available
      if (s.transcript_text && s.transcript_text.length < 5000) {
        lines.push('  Transcript Excerpt:')
        lines.push(`    ${s.transcript_text.substring(0, 2000)}...`)
      }
      lines.push('')
    })
  }

  // Coaching notes
  if (notes.length) {
    lines.push('=== COACH NOTES ===')
    notes.forEach((n: any) => {
      lines.push(`${n.note_date}: ${n.content}`)
      if (n.coach_curiosity) lines.push(`  [Coach Curiosity: ${n.coach_curiosity}]`)
    })
    lines.push('')
  }

  // More/Less Updates (progress over time)
  if (markerUpdates.length) {
    lines.push('=== MORE/LESS PROGRESS UPDATES ===')
    markerUpdates.forEach((u: any) => {
      lines.push(`${u.update_date}: Score ${u.score}`)
      if (u.note) lines.push(`  Note: ${u.note}`)
      if (u.exchange_note) lines.push(`  Exchange: ${u.exchange_note}`)
    })
    lines.push('')
  }

  // Voice Memos (transcriptions)
  if (voiceMemos.length) {
    lines.push('=== VOICE MEMOS ===')
    voiceMemos.forEach((v: any) => {
      const date = v.created_at?.split('T')[0]
      lines.push(`${date}: ${v.title || 'Untitled'}`)
      if (v.transcription) {
        lines.push(`  Transcription: ${v.transcription.substring(0, 1000)}${v.transcription.length > 1000 ? '...' : ''}`)
      }
    })
    lines.push('')
  }

  // Client Files (descriptions/notes)
  if (clientFiles.length) {
    lines.push('=== CLIENT FILES ===')
    clientFiles.forEach((f: any) => {
      const date = f.created_at?.split('T')[0]
      lines.push(`${date}: ${f.file_name} (${f.file_type})`)
      if (f.description) lines.push(`  Description: ${f.description}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}
