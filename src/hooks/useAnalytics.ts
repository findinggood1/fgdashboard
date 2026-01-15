import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface AnalyticsStats {
  totalClients: number;
  activeEngagements: number;
  sessionsThisMonth: number;
  avgClientProgress: number;
}

export interface ClientGrowthData {
  month: string;
  clients: number;
}

export interface SessionDistributionData {
  name: string;
  sessions: number;
}

export interface ToolUsageData {
  name: string;
  count: number;
}

export function useAnalytics() {
  const { coachData } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats>({
    totalClients: 0,
    activeEngagements: 0,
    sessionsThisMonth: 0,
    avgClientProgress: 0,
  });
  const [clientGrowth, setClientGrowth] = useState<ClientGrowthData[]>([]);
  const [sessionDistribution, setSessionDistribution] = useState<SessionDistributionData[]>([]);
  const [toolUsage, setToolUsage] = useState<ToolUsageData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    console.log('=== ANALYTICS PAGE DEBUG ===');
    console.log('Coach Data:', coachData);

    if (!coachData?.id) {
      console.log('No coach ID, skipping analytics fetch');
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      const thisMonthStart = startOfMonth(today);
      const thisMonthEnd = endOfMonth(today);

      // 1. Total Clients for this coach
      console.log('1. Fetching clients for coach_id:', coachData.id);
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, email, created_at')
        .eq('coach_id', coachData.id);

      console.log('Clients result:', { count: clients?.length, error: clientsError, data: clients });

      // 2. Active Engagements for this coach
      console.log('2. Fetching engagements for coach_id:', coachData.id);
      const { data: engagements, error: engError } = await supabase
        .from('coaching_engagements')
        .select('id, status, current_week, client_email')
        .eq('coach_id', coachData.id);

      console.log('Engagements result:', { count: engagements?.length, error: engError, data: engagements });

      const activeEngagements = engagements?.filter(e => e.status === 'active') || [];

      // 3. Sessions This Month for this coach
      console.log('3. Fetching sessions for coach_id:', coachData.id);
      const { data: sessions, error: sessError } = await supabase
        .from('session_transcripts')
        .select('id, session_date, client_email')
        .eq('coach_id', coachData.id)
        .gte('session_date', format(thisMonthStart, 'yyyy-MM-dd'))
        .lte('session_date', format(thisMonthEnd, 'yyyy-MM-dd'));

      console.log('Sessions this month result:', { 
        count: sessions?.length, 
        error: sessError, 
        data: sessions,
        dateRange: `${format(thisMonthStart, 'yyyy-MM-dd')} to ${format(thisMonthEnd, 'yyyy-MM-dd')}`
      });

      // 4. Average Client Progress (avg current_week / 12 for active engagements)
      const avgProgress = activeEngagements.length > 0
        ? Math.round((activeEngagements.reduce((sum, e) => sum + (e.current_week || 1), 0) / activeEngagements.length / 12) * 100)
        : 0;

      console.log('4. Stats calculated:', {
        totalClients: clients?.length || 0,
        activeEngagements: activeEngagements.length,
        sessionsThisMonth: sessions?.length || 0,
        avgClientProgress: avgProgress
      });

      setStats({
        totalClients: clients?.length || 0,
        activeEngagements: activeEngagements.length,
        sessionsThisMonth: sessions?.length || 0,
        avgClientProgress: avgProgress,
      });

      // 5. Client Growth - last 6 months
      console.log('5. Calculating client growth...');
      const growthData: ClientGrowthData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthEnd = endOfMonth(monthDate);
        const monthLabel = format(monthDate, 'MMM');
        
        // Count clients created by end of that month
        const clientsUpToMonth = clients?.filter(c => 
          new Date(c.created_at) <= monthEnd
        ).length || 0;
        
        growthData.push({ month: monthLabel, clients: clientsUpToMonth });
      }
      console.log('Client growth data:', growthData);
      setClientGrowth(growthData);

      // 6. Session Distribution by client
      console.log('6. Fetching all sessions for distribution...');
      const { data: allSessions, error: allSessError } = await supabase
        .from('session_transcripts')
        .select('client_email')
        .eq('coach_id', coachData.id);

      console.log('All sessions result:', { count: allSessions?.length, error: allSessError });

      const sessionsByClient: Record<string, number> = {};
      allSessions?.forEach(s => {
        const email = s.client_email || 'Unknown';
        sessionsByClient[email] = (sessionsByClient[email] || 0) + 1;
      });

      const distributionData = Object.entries(sessionsByClient)
        .map(([email, count]) => ({
          name: email.split('@')[0] || email,
          sessions: count,
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);

      console.log('Session distribution:', distributionData);
      setSessionDistribution(distributionData);

      // 7. Tool Usage - snapshots, impacts, sessions
      console.log('7. Fetching tool usage stats...');
      const clientEmails = clients?.map(c => c.email) || [];

      const { data: snapshots } = await supabase
        .from('snapshots')
        .select('id')
        .in('client_email', clientEmails.length > 0 ? clientEmails : ['']);

      const { data: impacts } = await supabase
        .from('priorities')
        .select('id')
        .in('client_email', clientEmails.length > 0 ? clientEmails : ['']);

      const toolData: ToolUsageData[] = [
        { name: 'Snapshots', count: snapshots?.length || 0 },
        { name: 'Sessions', count: allSessions?.length || 0 },
        { name: 'Impact Checks', count: impacts?.length || 0 },
      ];

      console.log('Tool usage:', toolData);
      setToolUsage(toolData);

      console.log('=== ANALYTICS PAGE DEBUG END ===');

    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [coachData?.id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    stats,
    clientGrowth,
    sessionDistribution,
    toolUsage,
    loading,
    refetch: fetchAnalytics,
  };
}
