import { useAuth } from '@/contexts/AuthContext';
import { usePortalData, PortalMoreLess } from '@/hooks/usePortalData';
import { useHydrated } from '@/hooks/useHydrated';
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
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

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

export default function PortalHome() {
  const { clientData } = useAuth();
  const { engagement, snapshots, impactEntries, sessions, moreLessEntries, isLoading } = usePortalData();
  const hydrated = useHydrated();

  const firstName = clientData?.name?.split(' ')[0] || 'there';
  const latestSnapshot = snapshots[0];
  // Only compute date-dependent values after hydration to avoid mismatch
  const snapshotAge = hydrated && latestSnapshot 
    ? differenceInDays(new Date(), parseISO(latestSnapshot.created_at)) 
    : null;

  // Calculate week progress
  const weekProgress = engagement ? Math.min((engagement.current_week / 12) * 100, 100) : 0;

  // Get active FIRES focus areas
  const firesFocus = engagement?.fires_focus || [];

  // Get goals with FIRES badges
  const goals = engagement?.goals || [];

  // Get more/less markers grouped by type
  const moreMarkers = moreLessEntries.filter((m: PortalMoreLess) => m.marker_type === 'more' && m.is_active);
  const lessMarkers = moreLessEntries.filter((m: PortalMoreLess) => m.marker_type === 'less' && m.is_active);

  // Get recent activity (last 5 items)
  const recentActivity = [
    ...snapshots.slice(0, 2).map(s => ({ 
      type: 'snapshot' as const, 
      date: s.created_at, 
      title: `FIRES Snapshot - ${s.overall_zone || 'Completed'}`,
      icon: Camera 
    })),
    ...impactEntries.slice(0, 2).map(i => ({ 
      type: 'impact' as const, 
      date: i.created_at, 
      title: `Impact Verification - ${i.type === 'self' ? 'Self' : 'Others'}`,
      icon: FileText 
    })),
    ...sessions.slice(0, 2).map(s => ({ 
      type: 'session' as const, 
      date: s.session_date, 
      title: `Session${s.summary ? ` - ${s.summary.slice(0, 30)}...` : ''}`,
      icon: Calendar 
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return <PortalHomeSkeleton />;
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
            Your journey is being set up...
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
              {goals.slice(0, 4).map((goal: any, idx: number) => {
                const goalText = typeof goal === 'string' ? goal : goal.goal || goal.text;
                const firesLever = goal.fires_lever;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm">{goalText}</p>
                      {firesLever && (
                        <div className="flex gap-1 mt-1">
                          {(() => {
                            const config = FIRES_CONFIG[firesLever as keyof typeof FIRES_CONFIG];
                            if (!config) return null;
                            const Icon = config.icon;
                            return <Icon className={cn('h-3.5 w-3.5', config.color)} />;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* More/Less Progress */}
        {(moreMarkers.length > 0 || lessMarkers.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">More / Less</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {moreMarkers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    More of
                  </div>
                  {moreMarkers.slice(0, 2).map((marker: PortalMoreLess) => {
                    const progress = marker.target_score && marker.baseline_score && marker.current_score
                      ? ((marker.current_score - marker.baseline_score) / (marker.target_score - marker.baseline_score)) * 100
                      : 50;
                    return (
                      <div key={marker.id} className="flex items-center gap-3">
                        <span className="text-sm flex-1 truncate">{marker.marker_text}</span>
                        <Progress value={Math.min(100, Math.max(0, progress))} className="w-24 h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
              {lessMarkers.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-rose-600">
                    <TrendingDown className="h-4 w-4" />
                    Less of
                  </div>
                  {lessMarkers.slice(0, 2).map((marker: PortalMoreLess) => {
                    const progress = marker.target_score && marker.baseline_score && marker.current_score
                      ? ((marker.baseline_score - marker.current_score) / (marker.baseline_score - marker.target_score)) * 100
                      : 50;
                    return (
                      <div key={marker.id} className="flex items-center gap-3">
                        <span className="text-sm flex-1 truncate">{marker.marker_text}</span>
                        <Progress value={Math.min(100, Math.max(0, progress))} className="w-24 h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
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
                {latestSnapshot.overall_zone && (
                  <div
                    className={cn(
                      'px-6 py-4 rounded-xl text-center',
                      ZONE_CONFIG[latestSnapshot.overall_zone]?.bg || 'bg-muted'
                    )}
                  >
                    <Flame className={cn('h-8 w-8 mx-auto mb-2', ZONE_CONFIG[latestSnapshot.overall_zone]?.color)} />
                    <p className={cn('text-lg font-serif font-medium', ZONE_CONFIG[latestSnapshot.overall_zone]?.color)}>
                      {ZONE_CONFIG[latestSnapshot.overall_zone]?.label || latestSnapshot.overall_zone}
                    </p>
                  </div>
                )}

                {/* Snapshot Info */}
                <div className="flex-1 space-y-3">
                  {latestSnapshot.goal && (
                    <div>
                      <p className="text-sm text-muted-foreground">Goal</p>
                      <p className="text-sm font-medium">{latestSnapshot.goal}</p>
                    </div>
                  )}
                  {latestSnapshot.growth_opportunity_category && (
                    <div>
                      <p className="text-sm text-muted-foreground">Growth Opportunity</p>
                      <p className="text-sm font-medium">{latestSnapshot.growth_opportunity_category}</p>
                    </div>
                  )}
                  <div className="flex gap-6">
                    {latestSnapshot.total_confidence !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-lg font-semibold">{latestSnapshot.total_confidence}</p>
                      </div>
                    )}
                    {latestSnapshot.total_alignment !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground">Alignment</p>
                        <p className="text-lg font-semibold">{latestSnapshot.total_alignment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  From your {format(parseISO(latestSnapshot.created_at), 'MMMM d, yyyy')} snapshot
                </p>
                {snapshotAge !== null && snapshotAge > 30 && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/portal/journey">
                      <Camera className="h-4 w-4 mr-2" />
                      Take New Snapshot
                    </Link>
                  </Button>
                )}
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
            <Button variant="ghost" size="sm" asChild>
              <Link to="/portal/journey">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
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
          {content || placeholder}
        </p>
      </CardContent>
    </Card>
  );
}

function PortalHomeSkeleton() {
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
