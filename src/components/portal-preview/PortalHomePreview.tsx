import { useQuery } from '@tanstack/react-query';
import { supabase, Client } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Flame, 
  Heart, 
  Users, 
  Shield, 
  Compass, 
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  Camera,
  FileText,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface PortalHomePreviewProps {
  clientEmail: string;
  clientData: Client;
}

const FIRES_CONFIG = {
  feelings: { label: 'Feelings', icon: Heart, color: 'text-rose-500' },
  influence: { label: 'Influence', icon: Users, color: 'text-blue-500' },
  resilience: { label: 'Resilience', icon: Shield, color: 'text-emerald-500' },
  ethics: { label: 'Ethics', icon: Compass, color: 'text-purple-500' },
  strengths: { label: 'Strengths', icon: Sparkles, color: 'text-amber-500' },
};

const PHASE_LABELS: Record<string, string> = {
  name: 'NAME',
  validate: 'VALIDATE',
  communicate: 'COMMUNICATE',
};

const FOCUS_LABELS: Record<string, string> = {
  feelings: 'Understanding Your Feelings',
  influence: 'Expanding Your Influence',
  resilience: 'Building Resilience',
  ethics: 'Clarifying Your Ethics',
  strengths: 'Discovering Your Strengths',
  story: 'Crafting Your Story',
  impact: 'Measuring Your Impact',
  relationships: 'Strengthening Relationships',
  purpose: 'Finding Your Purpose',
  growth: 'Accelerating Growth',
};

const ZONE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  green: { label: 'Thriving', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  yellow: { label: 'Growing', color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  orange: { label: 'Stretching', color: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  red: { label: 'Challenged', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export default function PortalHomePreview({ clientEmail, clientData }: PortalHomePreviewProps) {
  // Fetch engagement
  const { data: engagement, isLoading: engagementLoading } = useQuery({
    queryKey: ['portal-preview-engagement', clientEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaching_engagements')
        .select('*')
        .eq('client_email', clientEmail)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientEmail,
  });

  // Fetch snapshots
  const { data: snapshots = [] } = useQuery({
    queryKey: ['portal-preview-snapshots', clientEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_snapshots')
        .select('*')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientEmail,
  });

  // Fetch impact entries
  const { data: impactEntries = [] } = useQuery({
    queryKey: ['portal-preview-impact', clientEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('impact_entries')
        .select('*')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientEmail,
  });

  // Fetch sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['portal-preview-sessions', clientEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('client_email', clientEmail)
        .order('session_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientEmail,
  });

  // Fetch more/less entries
  const { data: moreLessEntries = [] } = useQuery({
    queryKey: ['portal-preview-moreless', clientEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('more_less_entries')
        .select('*')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientEmail,
  });

  const firstName = clientData?.name?.split(' ')[0] || 'Client';
  const latestSnapshot = snapshots[0];
  const weekProgress = engagement ? Math.min((engagement.current_week / 12) * 100, 100) : 0;
  const firesFocus = engagement?.fires_focus || [];
  const goals = engagement?.goals || [];
  const latestMoreLess = moreLessEntries[0];

  // Get recent activity
  const recentActivity = [
    ...snapshots.slice(0, 2).map(s => ({ 
      type: 'snapshot' as const, 
      date: s.created_at, 
      title: `FIRES Snapshot - ${s.zone || 'Completed'}`,
      icon: Camera 
    })),
    ...impactEntries.slice(0, 2).map(i => ({ 
      type: 'impact' as const, 
      date: i.created_at, 
      title: `Impact Entry - ${i.impact_type === 'self' ? 'Self' : 'Others'}`,
      icon: FileText 
    })),
    ...sessions.slice(0, 2).map(s => ({ 
      type: 'session' as const, 
      date: s.session_date, 
      title: `Session ${s.session_number}${s.topic ? ` - ${s.topic}` : ''}`,
      icon: Calendar 
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (engagementLoading) {
    return <PortalPreviewSkeleton />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section 1: Welcome */}
      <section className="space-y-2">
        <h1 className="text-3xl font-serif font-semibold text-foreground">
          Welcome, {firstName}
        </h1>
        {engagement ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-muted-foreground">
              Week {engagement.current_week} of 12
            </span>
            <Badge variant="secondary" className="font-medium">
              {PHASE_LABELS[engagement.current_phase] || engagement.current_phase} Phase
            </Badge>
            {engagement.focus && (
              <span className="text-sm text-muted-foreground">
                • Focus: {FOCUS_LABELS[engagement.focus] || engagement.focus}
              </span>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No active engagement found
          </p>
        )}
        {engagement && (
          <div className="max-w-md pt-2">
            <Progress value={weekProgress} className="h-2" />
          </div>
        )}
      </section>

      {/* Section 2: The Story We're Strengthening */}
      <section>
        <h2 className="text-xl font-serif font-medium text-foreground mb-4">
          The Story We're Strengthening
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StoryCard
            title="Present"
            content={engagement?.story_present}
            placeholder="To be discovered..."
          />
          <StoryCard
            title="Past"
            content={engagement?.story_past}
            placeholder="To be discovered..."
          />
          <StoryCard
            title="Potential"
            content={engagement?.story_potential}
            placeholder="To be discovered..."
          />
        </div>
      </section>

      {/* Section 3: Current Focus */}
      {firesFocus.length > 0 && (
        <section>
          <h2 className="text-xl font-serif font-medium text-foreground mb-4">
            Current Focus
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                {firesFocus.map((focus: string) => {
                  const config = FIRES_CONFIG[focus as keyof typeof FIRES_CONFIG];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <Badge
                      key={focus}
                      variant="outline"
                      className={cn('gap-2 py-2 px-4 text-sm', config.color)}
                    >
                      <Icon className="h-4 w-4" />
                      {config.label}
                    </Badge>
                  );
                })}
              </div>
              {engagement?.weekly_actions && engagement.weekly_actions.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">This Week's Actions</h3>
                  <ul className="space-y-2">
                    {engagement.weekly_actions
                      .filter((a: any) => a.status === 'active')
                      .slice(0, 3)
                      .map((action: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Target className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <span>{action.action}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Section 4: Goals & Progress */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        {goals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.slice(0, 4).map((goal: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{goal.text || goal}</p>
                    {goal.fires_elements && (
                      <div className="flex gap-1 mt-1">
                        {goal.fires_elements.map((el: string) => {
                          const config = FIRES_CONFIG[el as keyof typeof FIRES_CONFIG];
                          if (!config) return null;
                          const Icon = config.icon;
                          return (
                            <Icon key={el} className={cn('h-3.5 w-3.5', config.color)} />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* More/Less Progress */}
        {latestMoreLess && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">More / Less</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  More of
                </div>
                {latestMoreLess.more_of?.slice(0, 2).map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm flex-1 truncate">{item}</span>
                    <Progress value={65 + idx * 15} className="w-24 h-2" />
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm font-medium text-rose-600">
                  <TrendingDown className="h-4 w-4" />
                  Less of
                </div>
                {latestMoreLess.less_of?.slice(0, 2).map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm flex-1 truncate">{item}</span>
                    <Progress value={35 - idx * 10} className="w-24 h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Section 5: FIRES Snapshot */}
      {latestSnapshot && (
        <section>
          <h2 className="text-xl font-serif font-medium text-foreground mb-4">
            FIRES Snapshot
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Zone Badge */}
                {latestSnapshot.zone && (
                  <div
                    className={cn(
                      'px-6 py-4 rounded-xl text-center',
                      ZONE_CONFIG[latestSnapshot.zone]?.bg || 'bg-muted'
                    )}
                  >
                    <Flame className={cn('h-8 w-8 mx-auto mb-2', ZONE_CONFIG[latestSnapshot.zone]?.color)} />
                    <p className={cn('text-lg font-serif font-medium', ZONE_CONFIG[latestSnapshot.zone]?.color)}>
                      {ZONE_CONFIG[latestSnapshot.zone]?.label || latestSnapshot.zone}
                    </p>
                  </div>
                )}

                {/* Mini FIRES breakdown */}
                <div className="flex-1 space-y-3">
                  {latestSnapshot.scores && Object.entries(latestSnapshot.scores).map(([key, value]) => {
                    const config = FIRES_CONFIG[key as keyof typeof FIRES_CONFIG];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <Icon className={cn('h-4 w-4 shrink-0', config.color)} />
                        <span className="text-sm w-20">{config.label}</span>
                        <Progress value={(value as number) * 10} className="flex-1 h-2" />
                        <span className="text-sm text-muted-foreground w-8">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  From {format(parseISO(latestSnapshot.created_at), 'MMMM d, yyyy')} snapshot
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Section 6: Recent Activity */}
      {recentActivity.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-medium text-foreground">
              Recent Activity
            </h2>
            <Button variant="ghost" size="sm" disabled>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {recentActivity.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(item.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function StoryCard({ title, content, placeholder }: { title: string; content?: string | null; placeholder: string }) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn(
          'text-sm leading-relaxed',
          content ? 'text-foreground' : 'text-muted-foreground italic'
        )}>
          {content ?? placeholder}
        </p>
      </CardContent>
    </Card>
  );
}

function PortalPreviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-2 w-64 mt-4" />
      </div>
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
      <Skeleton className="h-48" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
