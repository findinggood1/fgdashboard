import { useState, useEffect, useCallback } from 'react';
import { supabase, Client, CoachingEngagement } from '@/lib/supabase';

export interface Snapshot {
  id: string;
  client_email: string;
  goal: string | null;
  success: string | null;
  overall_zone: string;
  growth_opportunity_category: string | null;
  zone_breakdown: Record<string, any> | null;
  confidence_scores: Record<string, any> | null;
  alignment_scores: Record<string, any> | null;
  fs_answers: Record<string, any> | null;
  ps_answers: Record<string, any> | null;
  created_at: string;
}

export interface ImpactVerification {
  id: string;
  client_email: string;
  type: string;
  responses: Record<string, any>;
  integrity_line: string | null;
  created_at: string;
}

export interface SessionTranscript {
  id: string;
  client_email: string;
  engagement_id: string | null;
  session_date: string;
  session_number: number | null;
  session_type: string | null;
  duration_minutes: number | null;
  transcript_text: string | null;
  summary: string | null;
  key_themes: string[] | null;
  key_quotes: string[] | null;
  action_items: string[] | null;
  coach_observations: string | null;
  client_breakthroughs: string | null;
  next_session_focus: string | null;
  source: string | null;
  is_processed: boolean;
  created_at: string;
}

export interface ClientAssessment {
  id: string;
  client_email: string;
  assessment_type: string;
  assessment_name: string;
  assessment_date: string;
  responses: Record<string, any> | null;
  summary: string | null;
  scores: Record<string, any> | null;
  status: string;
  created_at: string;
}

export interface MoreLessUpdate {
  id: string;
  marker_id: string;
  update_date: string;
  score: number;
  source: string | null;
  note: string | null;
  created_at: string;
}

export interface MoreLessMarker {
  id: string;
  client_email: string;
  engagement_id: string | null;
  marker_text: string;
  marker_type: 'more' | 'less';
  baseline_score: number | null;
  target_score: number | null;
  current_score: number | null;
  fires_connection: string | null;
  exchange_insight: string | null;
  is_active: boolean;
  created_at: string;
  updates?: MoreLessUpdate[];
}

export interface CoachingNote {
  id: string;
  client_email: string;
  note_date: string;
  content: string;
  session_type: string | null;
  coach_curiosity: string | null;
  coach_next: string | null;
  coach_trap: string | null;
  related_session_id: string | null;
  created_at: string;
}

export interface VoiceMemo {
  id: string;
  client_email: string;
  coach_id: string | null;
  audio_storage_path: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  transcription: string | null;
  is_transcribed: boolean;
  title: string | null;
  context: string | null;
  tags: string[] | null;
  recorded_at: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  client_email: string;
  practice_type: string;
  status: string;
  coach_note: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ClientFile {
  id: string;
  client_email: string;
  engagement_id: string | null;
  file_name: string;
  file_type: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  storage_path: string | null;
  storage_url: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  uploaded_by_coach_id: string | null;
  created_at: string;
}

export interface ClientDetailData {
  client: Client | null;
  engagement: CoachingEngagement | null;
  snapshots: Snapshot[];
  impactVerifications: ImpactVerification[];
  sessions: SessionTranscript[];
  assessments: ClientAssessment[];
  markers: MoreLessMarker[];
  notes: CoachingNote[];
  memos: VoiceMemo[];
  assignments: Assignment[];
  files: ClientFile[];
}

export function useClientDetail(email: string | undefined) {
  const [data, setData] = useState<ClientDetailData>({
    client: null,
    engagement: null,
    snapshots: [],
    impactVerifications: [],
    sessions: [],
    assessments: [],
    markers: [],
    notes: [],
    memos: [],
    assignments: [],
    files: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientData = useCallback(async () => {
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const decodedEmail = decodeURIComponent(email);

      // Fetch all data in parallel
      const [
        clientResult,
        engagementResult,
        snapshotsResult,
        impactsResult,
        sessionsResult,
        assessmentsResult,
        markersResult,
        notesResult,
        memosResult,
        assignmentsResult,
        filesResult,
      ] = await Promise.all([
        supabase.from('clients').select('*').eq('email', decodedEmail).maybeSingle(),
        supabase.from('coaching_engagements').select('*').eq('client_email', decodedEmail).eq('status', 'active').maybeSingle(),
        supabase.from('snapshots').select('*').eq('client_email', decodedEmail).order('created_at', { ascending: false }),
        supabase.from('impact_verifications').select('*').eq('client_email', decodedEmail).order('created_at', { ascending: false }),
        supabase.from('session_transcripts').select('*').eq('client_email', decodedEmail).order('session_date', { ascending: false }),
        supabase.from('client_assessments').select('*').eq('client_email', decodedEmail).order('assessment_date', { ascending: false }),
        supabase.from('more_less_markers').select('*').eq('client_email', decodedEmail).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('coaching_notes').select('*').eq('client_email', decodedEmail).order('note_date', { ascending: false }),
        supabase.from('voice_memos').select('*').eq('client_email', decodedEmail).order('recorded_at', { ascending: false }),
        supabase.from('assignments').select('*').eq('client_email', decodedEmail).order('created_at', { ascending: false }),
        supabase.from('client_files').select('*').eq('client_email', decodedEmail).order('created_at', { ascending: false }),
      ]);

      // Check for errors
      if (clientResult.error) throw clientResult.error;

      // Fetch updates for all markers
      const markersData = markersResult.data || [];
      let markersWithUpdates: MoreLessMarker[] = markersData;

      if (markersData.length > 0) {
        const markerIds = markersData.map((m) => m.id);
        const { data: updatesData } = await supabase
          .from('more_less_updates')
          .select('*')
          .in('marker_id', markerIds)
          .order('update_date', { ascending: false });

        const updatesByMarker = (updatesData || []).reduce((acc, update) => {
          if (!acc[update.marker_id]) acc[update.marker_id] = [];
          acc[update.marker_id].push(update);
          return acc;
        }, {} as Record<string, MoreLessUpdate[]>);

        markersWithUpdates = markersData.map((marker) => ({
          ...marker,
          updates: updatesByMarker[marker.id] || [],
        }));
      }

      setData({
        client: clientResult.data,
        engagement: engagementResult.data,
        snapshots: snapshotsResult.data || [],
        impactVerifications: impactsResult.data || [],
        sessions: sessionsResult.data || [],
        assessments: assessmentsResult.data || [],
        markers: markersWithUpdates,
        notes: notesResult.data || [],
        memos: memosResult.data || [],
        assignments: assignmentsResult.data || [],
        files: filesResult.data || [],
      });
    } catch (err) {
      console.error('Error fetching client data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch client data');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const updateEngagement = async (updates: Partial<CoachingEngagement>) => {
    if (!data.engagement?.id) return;
    
    const { error } = await supabase
      .from('coaching_engagements')
      .update(updates)
      .eq('id', data.engagement.id);

    if (error) throw error;
    await fetchClientData();
  };

  return {
    ...data,
    loading,
    error,
    refetch: fetchClientData,
    updateEngagement,
  };
}
