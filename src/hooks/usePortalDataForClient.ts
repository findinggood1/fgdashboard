import { useQuery } from '@tanstack/react-query';
import { supabase, CoachingEngagement } from '@/lib/supabase';

export interface PortalSnapshot {
  id: string;
  created_at: string;
  zone: string | null;
  scores: Record<string, number> | null;
}

export interface PortalImpactEntry {
  id: string;
  created_at: string;
  impact_type: string;
  entry_text: string;
  fires_elements: string[] | null;
}

export interface PortalSession {
  id: string;
  session_date: string;
  session_number: number;
  summary: string | null;
  topic: string | null;
}

export interface PortalMoreLess {
  id: string;
  week_number: number;
  more_of: string[];
  less_of: string[];
  created_at: string;
}

/**
 * Same as usePortalData but takes an explicit clientEmail parameter.
 * Used for coach preview mode where we want to view a specific client's data.
 */
export function usePortalDataForClient(clientEmail: string | undefined) {
  // Fetch engagement
  const engagementQuery = useQuery({
    queryKey: ['portal-engagement', clientEmail],
    queryFn: async () => {
      if (!clientEmail) return null;
      const { data, error } = await supabase
        .from('coaching_engagements')
        .select('*')
        .eq('client_email', clientEmail)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CoachingEngagement | null;
    },
    enabled: !!clientEmail,
  });

  // Fetch snapshots
  const snapshotsQuery = useQuery({
    queryKey: ['portal-snapshots', clientEmail],
    queryFn: async () => {
      if (!clientEmail) return [];
      const { data, error } = await supabase
        .from('client_snapshots')
        .select('id, created_at, zone, scores')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PortalSnapshot[];
    },
    enabled: !!clientEmail,
  });

  // Fetch impact entries
  const impactQuery = useQuery({
    queryKey: ['portal-impact', clientEmail],
    queryFn: async () => {
      if (!clientEmail) return [];
      const { data, error } = await supabase
        .from('client_impact_entries')
        .select('id, created_at, impact_type, entry_text, fires_elements')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PortalImpactEntry[];
    },
    enabled: !!clientEmail,
  });

  // Fetch sessions
  const sessionsQuery = useQuery({
    queryKey: ['portal-sessions', clientEmail],
    queryFn: async () => {
      if (!clientEmail) return [];
      const { data, error } = await supabase
        .from('coaching_sessions')
        .select('id, session_date, session_number, summary, topic')
        .eq('client_email', clientEmail)
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data as PortalSession[];
    },
    enabled: !!clientEmail,
  });

  // Fetch more/less entries
  const moreLessQuery = useQuery({
    queryKey: ['portal-moreless', clientEmail],
    queryFn: async () => {
      if (!clientEmail) return [];
      const { data, error } = await supabase
        .from('client_more_less')
        .select('id, week_number, more_of, less_of, created_at')
        .eq('client_email', clientEmail)
        .order('week_number', { ascending: false });

      if (error) throw error;
      return data as PortalMoreLess[];
    },
    enabled: !!clientEmail,
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
