import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { subDays, startOfMonth, subMonths, isBefore } from 'date-fns';

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
  sessionTime: string | null;
  status: string;
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

export interface PortalLoginStats {
  clientsLoggedIn: number;
  totalClients: number;
  lastLogin: { name: string; timestamp: string } | null;
}

export function useDashboard() {
  const { coachData } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ activeClients: 0, activeEngagements: 0, sessionsThisWeek: 0 });
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [attentionClients, setAttentionClients] = useState<AttentionClient[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [portalLoginStats, setPortalLoginStats] = useState<PortalLoginStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    console.log('=== DASHBOARD DEBUG START ===');
    console.log('1. Auth Data:', {
      coachId: coachData?.id,
      coachEmail: coachData?.email,
      coachName: coachData?.name,
      isAdmin: coachData?.is_admin,
      fullCoachData: coachData
    });

    if (!coachData?.id) {
      console.log('❌ No coach ID - exiting early');
      return;
    }

    setLoading(true);
    const isAdmin = coachData.is_admin === true;

    try {
      const today = new Date();
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);

      // Fetch clients - for admin show all, for coach filter by coach_id
      console.log('2. Fetching clients, isAdmin:', isAdmin);
      let clientsQuery = supabase
        .from('clients')
        .select('email, name, status, coach_id, last_login_at');
      
      if (!isAdmin) {
        clientsQuery = clientsQuery.eq('coach_id', coachData.id);
      }

      const { data: clients, error: clientsError } = await clientsQuery;

      console.log('3. Clients Query Result:', {
        isAdmin,
        error: clientsError,
        count: clients?.length || 0,
        clients: clients
      });

      const clientEmails = clients?.map(c => c.email) || [];
      const clientMap = new Map(clients?.map(c => [c.email, c.name || c.email]) || []);
      
      console.log('4. Client Emails to filter by:', clientEmails);

      // Count active clients and engagements
      console.log('5. Fetching engagements, isAdmin:', isAdmin);
      let engagementsQuery = supabase
        .from('coaching_engagements')
        .select('*');
      
      if (!isAdmin) {
        engagementsQuery = engagementsQuery.eq('coach_id', coachData.id);
      }

      const { data: engagements, error: engError } = await engagementsQuery;

      console.log('6. Engagements Query Result:', {
        isAdmin,
        error: engError,
        count: engagements?.length || 0,
        engagements: engagements
      });

      const activeEngagements = engagements?.filter(e => e.status === 'active') || [];
      const activeClientEmails = new Set(activeEngagements.map(e => e.client_email));
      console.log('7. Active Engagements:', { count: activeEngagements.length, clientEmails: Array.from(activeClientEmails) });

      // Fetch scheduled sessions this week from scheduled_sessions table
      console.log('8. Fetching scheduled sessions for next 7 days...');
      let scheduledQuery = supabase
        .from('scheduled_sessions')
        .select('id, client_email, session_date, session_time, status')
        .gte('session_date', today.toISOString().split('T')[0])
        .lte('session_date', sevenDaysFromNow.toISOString().split('T')[0])
        .eq('status', 'scheduled');
      
      if (!isAdmin) {
        scheduledQuery = scheduledQuery.eq('coach_id', coachData.id);
      }

      const { data: weekSessions, error: sessError } = await scheduledQuery;

      console.log('9. Week Sessions Query Result:', {
        isAdmin,
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

      // Fetch upcoming sessions (next 7 days) from scheduled_sessions table
      console.log('11. Fetching upcoming sessions from scheduled_sessions...');
      let upcomingQuery = supabase
        .from('scheduled_sessions')
        .select('id, client_email, session_date, session_time, status')
        .gte('session_date', today.toISOString().split('T')[0])
        .lte('session_date', sevenDaysFromNow.toISOString().split('T')[0])
        .eq('status', 'scheduled')
        .order('session_date', { ascending: true })
        .limit(5);
      
      if (!isAdmin) {
        upcomingQuery = upcomingQuery.eq('coach_id', coachData.id);
      }

      const { data: upcoming, error: upcomingError } = await upcomingQuery;

      console.log('12. Upcoming Sessions Result:', { error: upcomingError, count: upcoming?.length || 0, upcoming });

      // Map client names for upcoming sessions
      const upcomingWithNames: UpcomingSession[] = [];
      for (const session of upcoming || []) {
        const clientName = clientMap.get(session.client_email);
        if (clientName) {
          upcomingWithNames.push({
            id: session.id,
            clientEmail: session.client_email,
            clientName,
            sessionDate: session.session_date,
            sessionTime: session.session_time,
            status: session.status,
          });
        } else {
          // Fetch client name if not in map (for admin viewing other coaches' clients)
          const { data: clientData } = await supabase
            .from('clients')
            .select('name, email')
            .eq('email', session.client_email)
            .maybeSingle();
          
          upcomingWithNames.push({
            id: session.id,
            clientEmail: session.client_email,
            clientName: clientData?.name || session.client_email,
            sessionDate: session.session_date,
            sessionTime: session.session_time,
            status: session.status,
          });
        }
      }

      setUpcomingSessions(upcomingWithNames);

      // Build activity feed from snapshots and impact_verifications
      // JOIN through clients table to filter by coach assignment
      console.log('13. Fetching recent snapshots...');
      
      // For snapshots, we need to join with clients to filter by coach
      const { data: recentSnapshots, error: snapError } = await supabase
        .from('snapshots')
        .select('id, client_email, created_at, overall_zone, goal')
        .in('client_email', clientEmails.length > 0 ? clientEmails : ['_no_match_'])
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('14. Recent Snapshots Result:', { error: snapError, count: recentSnapshots?.length || 0, snapshots: recentSnapshots });

      // For impact verifications
      console.log('15. Fetching recent impact verifications...');
      const { data: recentImpacts, error: impactError } = await supabase
        .from('impact_verifications')
        .select('id, client_email, created_at, integrity_line')
        .in('client_email', clientEmails.length > 0 ? clientEmails : ['_no_match_'])
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('16. Recent Impacts Result:', { error: impactError, count: recentImpacts?.length || 0, impacts: recentImpacts });

      // Build combined activity feed
      const activities: ActivityItem[] = [];

      recentSnapshots?.forEach(s => {
        const zone = s.overall_zone ? ` (${s.overall_zone})` : '';
        activities.push({
          id: `snapshot-${s.id}`,
          type: 'snapshot',
          description: `Completed a snapshot${zone}`,
          clientEmail: s.client_email,
          clientName: clientMap.get(s.client_email) || s.client_email,
          timestamp: s.created_at,
        });
      });

      recentImpacts?.forEach(i => {
        const line = i.integrity_line ? `: "${i.integrity_line.substring(0, 30)}${i.integrity_line.length > 30 ? '...' : ''}"` : '';
        activities.push({
          id: `impact-${i.id}`,
          type: 'impact',
          description: `Submitted impact verification${line}`,
          clientEmail: i.client_email,
          clientName: clientMap.get(i.client_email) || i.client_email,
          timestamp: i.created_at,
        });
      });

      // Sort by timestamp and take top 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityFeed(activities.slice(0, 10));
      console.log('17. Activity Feed:', activities.slice(0, 10));

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
      
      setAnalytics(analyticsResult);

      // Calculate portal login stats
      const approvedClients = clients?.filter(c => c.status === 'approved') || [];
      const clientsWithLogins = approvedClients.filter(c => c.last_login_at);
      const sortedByLogin = [...clientsWithLogins].sort(
        (a, b) => new Date(b.last_login_at!).getTime() - new Date(a.last_login_at!).getTime()
      );
      
      const loginStats: PortalLoginStats = {
        clientsLoggedIn: clientsWithLogins.length,
        totalClients: approvedClients.length,
        lastLogin: sortedByLogin[0] 
          ? { name: sortedByLogin[0].name || sortedByLogin[0].email, timestamp: sortedByLogin[0].last_login_at! }
          : null,
      };
      
      console.log('22. Portal Login Stats:', loginStats);
      setPortalLoginStats(loginStats);
      
      console.log('=== DASHBOARD DEBUG END ===');

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
    portalLoginStats,
    loading,
    refetch: fetchDashboardData,
  };
}
