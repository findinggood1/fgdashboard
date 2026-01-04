import { useQuery } from '@tanstack/react-query';
import { supabase, CoachingEngagement } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface PortalSnapshot {
  id: string;
  created_at: string;
  overall_zone: string | null;
  goal: string | null;
  growth_opportunity_category: string | null;
  total_confidence: number | null;
  total_alignment: number | null;
}

export interface PortalImpactEntry {
  id: string;
  created_at: string;
  type: string;
  responses: Record<string, any> | null;
  integrity_line: number | null;
  fires_focus: string[] | null;
}

export interface PortalSession {
  id: string;
  created_at: string;
  session_date: string;
  transcript_text: string | null;
  summary: string | null;
  key_themes: string[] | null;
}

export interface PortalMoreLess {
  id: string;
  marker_text: string;
  marker_type: 'more' | 'less';
  baseline_score: number | null;
  current_score: number | null;
  target_score: number | null;
  fires_connection: string | null;
  is_active: boolean;
}

export function usePortalData() {
  const { clientData } = useAuth();
  const email = clientData?.email;

  // Fetch engagement
  const engagementQuery = useQuery({
    queryKey: ['portal-engagement', email],
    queryFn: async () => {
      if (!email) return null;
      const { data, error } = await supabase
        .from('coaching_engagements')
        .select('*')
        .eq('client_email', email)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CoachingEngagement | null;
    },
    enabled: !!email,
  });

  // Fetch snapshots from 'snapshots' table
  const snapshotsQuery = useQuery({
    queryKey: ['portal-snapshots', email],
    queryFn: async () => {
      if (!email) return [];
      const { data, error } = await supabase
        .from('snapshots')
        .select('id, created_at, overall_zone, goal, growth_opportunity_category, total_confidence, total_alignment')
        .eq('client_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PortalSnapshot[];
    },
    enabled: !!email,
  });

  // Fetch impact entries from 'impact_verifications' table
  const impactQuery = useQuery({
    queryKey: ['portal-impact', email],
    queryFn: async () => {
      if (!email) return [];
      const { data, error } = await supabase
        .from('impact_verifications')
        .select('id, created_at, type, responses, integrity_line, fires_focus')
        .eq('client_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PortalImpactEntry[];
    },
    enabled: !!email,
  });

  // Fetch sessions from 'session_transcripts' table
  const sessionsQuery = useQuery({
    queryKey: ['portal-sessions', email],
    queryFn: async () => {
      if (!email) return [];
      const { data, error } = await supabase
        .from('session_transcripts')
        .select('id, created_at, session_date, transcript_text, summary, key_themes')
        .eq('client_email', email)
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data as PortalSession[];
    },
    enabled: !!email,
  });

  // Fetch more/less markers from 'more_less_markers' table
  const moreLessQuery = useQuery({
    queryKey: ['portal-moreless', email],
    queryFn: async () => {
      if (!email) return [];
      const { data, error } = await supabase
        .from('more_less_markers')
        .select('id, marker_text, marker_type, baseline_score, current_score, target_score, fires_connection, is_active')
        .eq('client_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PortalMoreLess[];
    },
    enabled: !!email,
  });

  const isLoading =
    engagementQuery.isLoading ||
    snapshotsQuery.isLoading ||
    impactQuery.isLoading ||
    sessionsQuery.isLoading ||
    moreLessQuery.isLoading;

  return {
    engagement: engagementQuery.data,
    snapshots: snapshotsQuery.data || [],
    impactEntries: impactQuery.data || [],
    sessions: sessionsQuery.data || [],
    moreLessEntries: moreLessQuery.data || [],
    isLoading,
    refetchAll: () => {
      engagementQuery.refetch();
      snapshotsQuery.refetch();
      impactQuery.refetch();
      sessionsQuery.refetch();
      moreLessQuery.refetch();
    },
  };
}
