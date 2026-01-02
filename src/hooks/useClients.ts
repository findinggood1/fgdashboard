import { useState, useEffect, useCallback } from 'react';
import { supabase, Client } from '@/lib/supabase';

export interface ClientWithDetails extends Client {
  last_activity: string | null;
  engagement_phase: string | null;
  engagement_week: number | null;
  engagement_status: string | null;
  overall_zone: string | null;
  growth_opportunity_category: string | null;
  snapshot_count: number;
  impact_count: number;
}

export function useClients() {
  const [clients, setClients] = useState<ClientWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      if (!clientsData || clientsData.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      const clientEmails = clientsData.map((c) => c.email);

      // Fetch snapshots for all clients
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('snapshots')
        .select('client_email, overall_zone, growth_opportunity_category, created_at')
        .in('client_email', clientEmails)
        .order('created_at', { ascending: false });

      if (snapshotsError) throw snapshotsError;

      // Fetch impact verifications
      const { data: impacts, error: impactsError } = await supabase
        .from('impact_verifications')
        .select('client_email, created_at')
        .in('client_email', clientEmails)
        .order('created_at', { ascending: false });

      if (impactsError) throw impactsError;

      // Fetch session transcripts for last activity
      const { data: sessions, error: sessionsError } = await supabase
        .from('session_transcripts')
        .select('client_email, created_at')
        .in('client_email', clientEmails)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Fetch active engagements
      const { data: engagements, error: engagementsError } = await supabase
        .from('coaching_engagements')
        .select('client_email, current_phase, current_week, status')
        .in('client_email', clientEmails);

      if (engagementsError) throw engagementsError;

      // Group data by client email
      const snapshotsByEmail = new Map<string, typeof snapshots>();
      const impactsByEmail = new Map<string, typeof impacts>();
      const sessionsByEmail = new Map<string, typeof sessions>();
      const engagementsByEmail = new Map<string, (typeof engagements)[0]>();

      snapshots?.forEach((s) => {
        if (!snapshotsByEmail.has(s.client_email)) {
          snapshotsByEmail.set(s.client_email, []);
        }
        snapshotsByEmail.get(s.client_email)!.push(s);
      });

      impacts?.forEach((i) => {
        if (!impactsByEmail.has(i.client_email)) {
          impactsByEmail.set(i.client_email, []);
        }
        impactsByEmail.get(i.client_email)!.push(i);
      });

      sessions?.forEach((s) => {
        if (!sessionsByEmail.has(s.client_email)) {
          sessionsByEmail.set(s.client_email, []);
        }
        sessionsByEmail.get(s.client_email)!.push(s);
      });

      engagements?.forEach((e) => {
        // Keep the most recent/active engagement
        if (!engagementsByEmail.has(e.client_email) || e.status === 'active') {
          engagementsByEmail.set(e.client_email, e);
        }
      });

      // Build enriched client data
      const enrichedClients: ClientWithDetails[] = clientsData.map((client) => {
        const clientSnapshots = snapshotsByEmail.get(client.email) || [];
        const clientImpacts = impactsByEmail.get(client.email) || [];
        const clientSessions = sessionsByEmail.get(client.email) || [];
        const engagement = engagementsByEmail.get(client.email);

        // Get most recent snapshot
        const latestSnapshot = clientSnapshots[0];

        // Calculate last activity
        const activities = [
          ...clientSnapshots.map((s) => s.created_at),
          ...clientImpacts.map((i) => i.created_at),
          ...clientSessions.map((s) => s.created_at),
        ].filter(Boolean);
        const lastActivity = activities.length > 0
          ? activities.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
          : null;

        return {
          ...client,
          last_activity: lastActivity,
          engagement_phase: engagement?.current_phase || null,
          engagement_week: engagement?.current_week || null,
          engagement_status: engagement?.status || null,
          overall_zone: latestSnapshot?.overall_zone || null,
          growth_opportunity_category: latestSnapshot?.growth_opportunity_category || null,
          snapshot_count: clientSnapshots.length,
          impact_count: clientImpacts.length,
        };
      });

      setClients(enrichedClients);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (email: string, name?: string) => {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ email, name: name || null, status: 'pending' }])
      .select()
      .single();

    if (error) throw error;
    await fetchClients();
    return data;
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    addClient,
  };
}
