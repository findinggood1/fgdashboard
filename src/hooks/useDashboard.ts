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
    console.log('=== DASHBOARD DEBUG START ===');
    console.log('1. Auth Data:', {
      coachId: coachData?.id,
      coachEmail: coachData?.email,
      coachName: coachData?.name,
      fullCoachData: coachData
    });

    if (!coachData?.id) {
      console.log('❌ No coach ID - exiting early');
      return;
    }

    setLoading(true);

    try {
      const today = new Date();
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);
      const startOfWeek = subDays(today, today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      // Fetch clients for this coach
      console.log('2. Fetching clients with coach_id:', coachData.id);
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('email, name, status, coach_id')
        .eq('coach_id', coachData.id);

      console.log('3. Clients Query Result:', {
        query: `SELECT email, name, status, coach_id FROM clients WHERE coach_id = '${coachData.id}'`,
        error: clientsError,
        count: clients?.length || 0,
        clients: clients
      });

      // Also fetch ALL clients to compare
      const { data: allClients } = await supabase
        .from('clients')
        .select('email, name, status, coach_id');
      console.log('3b. ALL Clients (no filter):', allClients);

      const clientEmails = clients?.map(c => c.email) || [];
      const clientMap = new Map(clients?.map(c => [c.email, c.name || c.email]) || []);
      
      console.log('4. Client Emails to filter by:', clientEmails);

      // Count active clients and engagements
      console.log('5. Fetching engagements with coach_id:', coachData.id);
      const { data: engagements, error: engError } = await supabase
        .from('coaching_engagements')
        .select('*')
        .eq('coach_id', coachData.id);

      console.log('6. Engagements Query Result:', {
        query: `SELECT * FROM coaching_engagements WHERE coach_id = '${coachData.id}'`,
        error: engError,
        count: engagements?.length || 0,
        engagements: engagements
      });

      // Also fetch ALL engagements to compare
      const { data: allEngagements } = await supabase
        .from('coaching_engagements')
        .select('*');
      console.log('6b. ALL Engagements (no filter):', allEngagements);

      const activeEngagements = engagements?.filter(e => e.status === 'active') || [];
      const activeClientEmails = new Set(activeEngagements.map(e => e.client_email));
      console.log('7. Active Engagements:', { count: activeEngagements.length, clientEmails: Array.from(activeClientEmails) });

      // Fetch sessions this week
      console.log('8. Fetching sessions for client emails:', clientEmails);
      const { data: weekSessions, error: sessError } = await supabase
        .from('session_transcripts')
        .select('id, client_email, session_date')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .gte('session_date', format(startOfWeek, 'yyyy-MM-dd'))
        .lte('session_date', format(endOfWeek, 'yyyy-MM-dd'));

      console.log('9. Week Sessions Query Result:', {
        query: `SELECT id, client_email, session_date FROM session_transcripts WHERE client_email IN (${clientEmails.join(', ')}) AND session_date >= '${format(startOfWeek, 'yyyy-MM-dd')}' AND session_date <= '${format(endOfWeek, 'yyyy-MM-dd')}'`,
        error: sessError,
        count: weekSessions?.length || 0,
        sessions: weekSessions
      });

      setStats({
        activeClients: activeClientEmails.size,
        activeEngagements: activeEngagements.length,
        sessionsThisWeek: weekSessions?.length || 0,
      });
      console.log('10. Stats set to:', { activeClients: activeClientEmails.size, activeEngagements: activeEngagements.length, sessionsThisWeek: weekSessions?.length || 0 });

      // Fetch upcoming sessions (next 7 days)
      console.log('11. Fetching upcoming sessions...');
      const { data: upcoming, error: upcomingError } = await supabase
        .from('session_transcripts')
        .select('id, client_email, session_date, session_number')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .gte('session_date', format(today, 'yyyy-MM-dd'))
        .lte('session_date', format(sevenDaysFromNow, 'yyyy-MM-dd'))
        .order('session_date', { ascending: true })
        .limit(10);

      console.log('12. Upcoming Sessions Result:', { error: upcomingError, count: upcoming?.length || 0, upcoming });

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
      console.log('13. Fetching recent snapshots for emails:', clientEmails);
      const { data: recentSnapshots, error: snapError } = await supabase
        .from('snapshots')
        .select('id, client_email, created_at')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('14. Recent Snapshots Result:', { error: snapError, count: recentSnapshots?.length || 0, snapshots: recentSnapshots });

      // Fetch ALL snapshots to compare
      const { data: allSnapshots } = await supabase
        .from('snapshots')
        .select('id, client_email, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      console.log('14b. ALL Snapshots (no filter):', allSnapshots);

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
      console.log('16. Attention Clients:', attention);

      // Analytics data
      const thisMonthStart = startOfMonth(today);
      const lastMonthStart = startOfMonth(subMonths(today, 1));
      const lastMonthEnd = subDays(thisMonthStart, 1);

      console.log('=== ANALYTICS DEBUG ===');
      console.log('17. Date ranges:', {
        today: today.toISOString(),
        thisMonthStart: thisMonthStart.toISOString(),
        lastMonthStart: lastMonthStart.toISOString(),
        lastMonthEnd: lastMonthEnd.toISOString(),
        clientEmails
      });

      // Use ISO format for proper timestamp comparison
      const { data: thisMonthSnapshots, error: thisMonthErr } = await supabase
        .from('snapshots')
        .select('id, created_at, client_email')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .gte('created_at', thisMonthStart.toISOString());

      console.log('18a. This Month Snapshots Query:', {
        filter: `created_at >= ${thisMonthStart.toISOString()}`,
        clientEmails,
        error: thisMonthErr,
        count: thisMonthSnapshots?.length || 0,
        data: thisMonthSnapshots
      });

      const { data: lastMonthSnapshots, error: lastMonthErr } = await supabase
        .from('snapshots')
        .select('id, created_at')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', thisMonthStart.toISOString());

      console.log('18b. Last Month Snapshots:', {
        filter: `created_at >= ${lastMonthStart.toISOString()} AND created_at < ${thisMonthStart.toISOString()}`,
        error: lastMonthErr,
        count: lastMonthSnapshots?.length || 0,
        data: lastMonthSnapshots
      });

      // Engagements by phase - use ALL engagements we already fetched
      const phaseCount = { name: 0, validate: 0, communicate: 0 };
      activeEngagements.forEach(e => {
        if (e.current_phase === 'name') phaseCount.name++;
        else if (e.current_phase === 'validate') phaseCount.validate++;
        else if (e.current_phase === 'communicate') phaseCount.communicate++;
      });
      console.log('19. Phase Distribution:', { activeEngagements: activeEngagements.length, phaseCount });

      // Zone distribution from recent snapshots
      const { data: zoneSnapshots, error: zoneErr } = await supabase
        .from('snapshots')
        .select('overall_zone, client_email')
        .in('client_email', clientEmails.length > 0 ? clientEmails : [''])
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('20. Zone Snapshots:', { 
        clientEmails,
        error: zoneErr, 
        count: zoneSnapshots?.length || 0, 
        data: zoneSnapshots 
      });

      const zoneCounts: Record<string, number> = {};
      zoneSnapshots?.forEach(s => {
        if (s.overall_zone) {
          const normalizedZone = s.overall_zone.toLowerCase();
          zoneCounts[normalizedZone] = (zoneCounts[normalizedZone] || 0) + 1;
        }
      });
      console.log('20b. Zone Counts after processing:', zoneCounts);

      const analyticsResult: AnalyticsData = {
        snapshotsThisMonth: thisMonthSnapshots?.length || 0,
        snapshotsLastMonth: lastMonthSnapshots?.length || 0,
        engagementsByPhase: {
          name: String(phaseCount.name),
          validate: String(phaseCount.validate),
          communicate: String(phaseCount.communicate),
        },
        zoneDistribution: Object.entries(zoneCounts).map(([zone, count]) => ({ zone, count })),
      };
      
      console.log('21. FINAL ANALYTICS RESULT:', analyticsResult);
      console.log('=== DASHBOARD DEBUG END ===');
      
      setAnalytics(analyticsResult);

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
