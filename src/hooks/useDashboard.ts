import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay, startOfMonth, subMonths, isAfter, isBefore } from 'date-fns';

export interface DashboardStats {
  activeClients: number;
  activeEngagements: number;
  sessionsThisWeek: number;
}

export interface UpcomingSession {
  id: string;
  clientEmail: string;
  clientName: string;
  sessionDate: string;
  sessionNumber: number;
}

export interface ActivityItem {
  id: string;
  type: 'snapshot' | 'impact' | 'session' | 'engagement_started' | 'engagement_completed' | 'assessment';
  description: string;
  clientEmail: string;
  clientName: string;
  timestamp: string;
}

export interface AttentionClient {
  email: string;
  name: string;
  reason: 'inactive' | 'final_week' | 'overdue_assignment';
  lastActivity: string | null;
  engagementWeek?: number;
}

export interface AnalyticsData {
  snapshotsThisMonth: number;
  snapshotsLastMonth: number;
  engagementsByPhase: { name: string; validate: string; communicate: string };
  zoneDistribution: { zone: string; count: number }[];
}

export function useDashboard() {
  const { coachData } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ activeClients: 0, activeEngagements: 0, sessionsThisWeek: 0 });
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [attentionClients, setAttentionClients] = useState<AttentionClient[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!coachData?.id) return;

    setLoading(true);

    try {
      const today = new Date();
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);
      const startOfWeek = subDays(today, today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // Fetch clients for this coach
      const { data: clients } = await supabase
        .from('clients')
        .select('email, name, status, coach_id')
        .eq('coach_id', coachData.id);

      const clientEmails = clients?.map(c => c.email) || [];
      const clientMap = new Map(clients?.map(c => [c.email, c.name || c.email]) || []);

      // Count active clients and engagements
      const { data: engagements } = await supabase
        .from('coaching_engagements')
        .select('*')
        .eq('coach_id', coachData.id);

      const activeEngagements = engagements?.filter(e => e.status === 'active') || [];
      const activeClientEmails = new Set(activeEngagements.map(e => e.client_email));

      // Fetch sessions this week
      const { data: weekSessions } = await supabase
        .from('session_transcripts')
        .select('id, client_email, session_date')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .gte('session_date', format(startOfWeek, 'yyyy-MM-dd'))
        .lte('session_date', format(endOfWeek, 'yyyy-MM-dd'));

      setStats({
        activeClients: activeClientEmails.size,
        activeEngagements: activeEngagements.length,
        sessionsThisWeek: weekSessions?.length || 0,
      });

      // Fetch upcoming sessions (next 7 days)
      const { data: upcoming } = await supabase
        .from('session_transcripts')
        .select('id, client_email, session_date, session_number')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .gte('session_date', format(today, 'yyyy-MM-dd'))
        .lte('session_date', format(sevenDaysFromNow, 'yyyy-MM-dd'))
        .order('session_date', { ascending: true })
        .limit(10);

      setUpcomingSessions(
        (upcoming || []).map(s => ({
          id: s.id,
          clientEmail: s.client_email,
          clientName: clientMap.get(s.client_email) || s.client_email,
          sessionDate: s.session_date,
          sessionNumber: s.session_number,
        }))
      );

      // Build activity feed from multiple sources
      const activities: ActivityItem[] = [];

      // Snapshots
      const { data: recentSnapshots } = await supabase
        .from('snapshots')
        .select('id, client_email, created_at')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .order('created_at', { ascending: false })
        .limit(10);

      recentSnapshots?.forEach(s => {
        activities.push({
          id: `snapshot-${s.id}`,
          type: 'snapshot',
          description: 'Completed a snapshot',
          clientEmail: s.client_email,
          clientName: clientMap.get(s.client_email) || s.client_email,
          timestamp: s.created_at,
        });
      });

      // Impact entries
      const { data: recentImpacts } = await supabase
        .from('impact_verifications')
        .select('id, client_email, created_at')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .order('created_at', { ascending: false })
        .limit(10);

      recentImpacts?.forEach(i => {
        activities.push({
          id: `impact-${i.id}`,
          type: 'impact',
          description: 'Submitted impact verification',
          clientEmail: i.client_email,
          clientName: clientMap.get(i.client_email) || i.client_email,
          timestamp: i.created_at,
        });
      });

      // Sessions
      const { data: recentSessions } = await supabase
        .from('session_transcripts')
        .select('id, client_email, created_at, session_number')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .order('created_at', { ascending: false })
        .limit(10);

      recentSessions?.forEach(s => {
        activities.push({
          id: `session-${s.id}`,
          type: 'session',
          description: `Session ${s.session_number} added`,
          clientEmail: s.client_email,
          clientName: clientMap.get(s.client_email) || s.client_email,
          timestamp: s.created_at,
        });
      });

      // Sort by timestamp and take top 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityFeed(activities.slice(0, 10));

      // Clients needing attention
      const attention: AttentionClient[] = [];
      const fourteenDaysAgo = subDays(today, 14);

      // Get last activity for each client
      for (const client of clients || []) {
        const engagement = activeEngagements.find(e => e.client_email === client.email);
        
        // Check if in final week
        if (engagement && engagement.current_week >= 11) {
          attention.push({
            email: client.email,
            name: client.name || client.email,
            reason: 'final_week',
            lastActivity: null,
            engagementWeek: engagement.current_week,
          });
          continue;
        }

        // Check for inactivity
        const { data: lastActivity } = await supabase
          .from('snapshots')
          .select('created_at')
          .eq('client_email', client.email)
          .order('created_at', { ascending: false })
          .limit(1);

        const { data: lastSession } = await supabase
          .from('session_transcripts')
          .select('created_at')
          .eq('client_email', client.email)
          .order('created_at', { ascending: false })
          .limit(1);

        const latestDate = [lastActivity?.[0]?.created_at, lastSession?.[0]?.created_at]
          .filter(Boolean)
          .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

        if (latestDate && isBefore(new Date(latestDate), fourteenDaysAgo)) {
          attention.push({
            email: client.email,
            name: client.name || client.email,
            reason: 'inactive',
            lastActivity: latestDate,
          });
        }
      }

      setAttentionClients(attention.slice(0, 5));

      // Analytics data
      const thisMonthStart = startOfMonth(today);
      const lastMonthStart = startOfMonth(subMonths(today, 1));
      const lastMonthEnd = subDays(thisMonthStart, 1);

      const { data: thisMonthSnapshots } = await supabase
        .from('snapshots')
        .select('id')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .gte('created_at', format(thisMonthStart, 'yyyy-MM-dd'));

      const { data: lastMonthSnapshots } = await supabase
        .from('snapshots')
        .select('id')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .gte('created_at', format(lastMonthStart, 'yyyy-MM-dd'))
        .lte('created_at', format(lastMonthEnd, 'yyyy-MM-dd'));

      // Engagements by phase
      const phaseCount = { name: 0, validate: 0, communicate: 0 };
      activeEngagements.forEach(e => {
        if (e.current_phase === 'name') phaseCount.name++;
        else if (e.current_phase === 'validate') phaseCount.validate++;
        else if (e.current_phase === 'communicate') phaseCount.communicate++;
      });

      // Zone distribution from recent snapshots
      const { data: zoneSnapshots } = await supabase
        .from('snapshots')
        .select('overall_zone')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .order('created_at', { ascending: false })
        .limit(50);

      const zoneCounts: Record<string, number> = {};
      zoneSnapshots?.forEach(s => {
        if (s.overall_zone) {
          zoneCounts[s.overall_zone] = (zoneCounts[s.overall_zone] || 0) + 1;
        }
      });

      setAnalytics({
        snapshotsThisMonth: thisMonthSnapshots?.length || 0,
        snapshotsLastMonth: lastMonthSnapshots?.length || 0,
        engagementsByPhase: {
          name: String(phaseCount.name),
          validate: String(phaseCount.validate),
          communicate: String(phaseCount.communicate),
        },
        zoneDistribution: Object.entries(zoneCounts).map(([zone, count]) => ({ zone, count })),
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [coachData?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    upcomingSessions,
    activityFeed,
    attentionClients,
    analytics,
    loading,
    refetch: fetchDashboardData,
  };
}
