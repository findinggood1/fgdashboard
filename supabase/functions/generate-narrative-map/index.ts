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

const SYSTEM_PROMPT = `You are a Narrative Integrity analyst for Finding Good coaching. Your job is to synthesize client data into meaningful insights that help them see their own story more clearly.

THE FRAMEWORK:
Narrative Integrity = the ability to clarify, act on, and communicate the most honest version of your story, and help others do the same.

THE FIRES FRAMEWORK:
- Feelings: Emotional awareness and regulation
- Influence: Locus of control and agency  
- Resilience: Growth through difficulty
- Ethics: Values alignment and purpose
- Strengths: Capability confidence and self-efficacy

THE FOUR ZONES (from FIRES Snapshot):
- Exploring (Low confidence, Low alignment): Stay curious, refine direction
- Discovering (Low confidence, High alignment): Bring forward past wins
- Performing (High confidence, Low alignment): Reconnect to identity
- Owning (High confidence, High alignment): Extend influence to others

SUPERPOWERS FRAMEWORK:
1. 🔥 SUPERPOWERS CLAIMED - What they know and own
   - Evidence: High confidence AND high alignment in FIRES elements
   - Patterns they've demonstrated repeatedly
   - Strengths they articulate themselves

2. 🌱 SUPERPOWERS EMERGING - What they're building confidence in
   - Evidence: High alignment but lower confidence (Discovering zone elements)
   - New behaviors they're trying
   - Skills they're developing but haven't fully claimed

3. ✨ SUPERPOWERS HIDDEN - What's in the data but they haven't claimed yet
   - Evidence: Impact they're having that they don't see
   - Patterns across sessions they haven't connected
   - Strengths others would name that they dismiss

WRITING GUIDELINES:
- Use second person ("You've shown..." not "The client has shown...")
- Be specific - reference actual quotes, events, examples from their data
- Be warm but direct - no fluff
- First-person voice for story sections ("I'm ready to..." not "They are ready to...")
- Evidence should be concrete examples, not abstract observations
- Connect insights to the 3Ps story arc when possible`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clientEmail, engagementId, regenerateAll = false } = await req.json()

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

    // Fetch all client data
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
      supabase.from('snapshots').select('*').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(5),
      supabase.from('impact_verifications').select('*').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(20),
      supabase.from('session_transcripts').select('*').eq('client_email', clientEmail).order('session_date', { ascending: false }).limit(5),
      supabase.from('coaching_notes').select('*').eq('client_email', clientEmail).order('note_date', { ascending: false }).limit(10),
      supabase.from('zone_defaults').select('*'),
      // New data sources
      supabase.from('voice_memos').select('id, title, transcription, created_at').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(10),
      supabase.from('client_files').select('id, file_name, file_type, description, created_at').eq('client_email', clientEmail).order('created_at', { ascending: false }).limit(10)
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

    // Fetch marker updates for this client's markers (requires marker IDs first)
    let markerUpdates: any[] = []
    if (markers.length > 0) {
      const markerIds = markers.map((m: any) => m.id)
      const { data: updatesData } = await supabase
        .from('more_less_updates')
        .select('*')
        .in('marker_id', markerIds)
        .order('created_at', { ascending: false })
        .limit(20)
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

    // Call Claude for analysis
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
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Analyze this client's data and generate their Narrative Integrity Map content.

${context}

---

Generate a complete Narrative Integrity Map. Respond in this exact JSON format:

{
  "superpowers_claimed": [
    {
      "superpower": "Name of superpower (usually a FIRES element or related quality)",
      "description": "One sentence about what this means for them",
      "evidence": ["Specific example 1 from their data", "Specific example 2"],
      "fires_element": "feelings|influence|resilience|ethics|strengths"
    }
  ],
  "superpowers_emerging": [
    {
      "superpower": "Name",
      "description": "What they're building",
      "evidence": ["Specific examples of this emerging"],
      "fires_element": "feelings|influence|resilience|ethics|strengths"
    }
  ],
  "superpowers_hidden": [
    {
      "superpower": "Name",
      "description": "What's in their data that they haven't claimed",
      "evidence": ["Examples they might not see themselves"],
      "fires_element": "feelings|influence|resilience|ethics|strengths"
    }
  ],
  "zone_interpretation": {
    "zone": "exploring|discovering|performing|owning",
    "custom_note": "What this zone means specifically for THIS person right now (2-3 sentences)"
  },
  "world_asking": [
    {
      "insight": "Full insight paragraph - what the world/their story is asking of them",
      "fires_element": "feelings|influence|resilience|ethics|strengths"
    }
  ],
  "suggested_weekly_actions": [
    {
      "action": "Specific action they could take this week (one sentence)",
      "fires_element": "feelings|influence|resilience|ethics|strengths"
    }
  ],
  "suggested_anchor_quote": "An inspiring one-liner that captures their journey"
}

IMPORTANT:
- Generate 2-3 items for each superpowers category
- Generate 3-4 "world asking" insights
- Generate exactly 2 weekly actions
- All evidence must be specific examples from their actual data
- Write in second person for descriptions, first person for quotes
- Be warm but direct - no generic coaching speak`
        }]
      })
    })

    const aiData = await response.json()
    
    if (aiData.error) {
      throw new Error(aiData.error.message)
    }

    // Parse the AI response
    let insights
    try {
      const content = aiData.content[0].text
      // Handle potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
      insights = JSON.parse(jsonMatch ? jsonMatch[1] : content)
    } catch (e) {
      console.error('Failed to parse AI response:', aiData.content[0].text)
      throw new Error('Failed to parse AI response as JSON')
    }

    // Get zone defaults for the current zone
    const currentZone = snapshots[0]?.overall_zone?.toLowerCase() || engagement.current_zone || 'exploring'
    const zoneDefault = zoneDefaults.find((z: { zone_name: string }) => z.zone_name === currentZone) || {}

    // Merge zone interpretation with defaults
    const zoneInterpretation = {
      zone: currentZone,
      headline: zoneDefault.headline || '',
      description: zoneDefault.description || '',
      the_work: zoneDefault.the_work || '',
      custom_note: insights.zone_interpretation?.custom_note || '',
      source: 'ai',
      updated_at: new Date().toISOString()
    }

    // Add metadata to superpowers
    const addMetadata = (items: any[]) => items.map(item => ({
      ...item,
      source: 'ai',
      created_at: new Date().toISOString()
    }))

    // Prepare update payload
    const updatePayload = {
      superpowers_claimed: addMetadata(insights.superpowers_claimed || []),
      superpowers_emerging: addMetadata(insights.superpowers_emerging || []),
      superpowers_hidden: addMetadata(insights.superpowers_hidden || []),
      zone_interpretation: zoneInterpretation,
      world_asking: addMetadata(insights.world_asking || []),
      weekly_actions: (insights.suggested_weekly_actions || []).map((a: any) => ({
        ...a,
        assigned_date: new Date().toISOString().split('T')[0],
        status: 'active'
      })),
      anchor_quote: insights.suggested_anchor_quote || null,
      ai_insights_generated_at: new Date().toISOString(),
      ai_insights_version: (engagement.ai_insights_version || 0) + 1,
      updated_at: new Date().toISOString()
    }

    // Update the engagement
    const { error: updateError } = await supabase
      .from('coaching_engagements')
      .update(updatePayload)
      .eq('id', engagement.id)

    if (updateError) {
      throw new Error(`Failed to update engagement: ${updateError.message}`)
    }

    // Log to history
    await supabase.from('narrative_map_history').insert({
      engagement_id: engagement.id,
      field_name: 'ai_generation',
      old_value: null,
      new_value: updatePayload,
      changed_by: 'ai'
    })

    return new Response(
      JSON.stringify({
        success: true,
        engagement_id: engagement.id,
        insights: updatePayload,
        message: 'Narrative Integrity Map generated successfully'
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
