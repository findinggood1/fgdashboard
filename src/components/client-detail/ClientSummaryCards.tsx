import { formatDistanceToNow, format } from 'date-fns';
import { Snapshot, ScheduledSession } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ZoneBadge } from '@/components/clients/ZoneBadge';
import { Target, TrendingUp, Award, CalendarClock, Clock } from 'lucide-react';

interface ClientSummaryCardsProps {
  latestSnapshot: Snapshot | null;
  lastActivity: { date: string; type: string } | null;
  nextScheduledSession: ScheduledSession | null;
}

export function ClientSummaryCards({ latestSnapshot, lastActivity, nextScheduledSession }: ClientSummaryCardsProps) {
  const formatDate = (date: string) => format(new Date(date), 'MMM d, yyyy');
  const formatDateTime = (date: string) => format(new Date(date), 'MMM d @ h:mm a');

  // Get zone breakdown to find owning highlight
  const getOwningHighlight = () => {
    if (!latestSnapshot?.zone_breakdown) return null;
    const breakdown = latestSnapshot.zone_breakdown as Record<string, string>;
    const owningCategories = Object.entries(breakdown)
      .filter(([_, zone]) => zone?.toLowerCase() === 'owning')
      .map(([category]) => category);
    return owningCategories[0] || null;
  };

  const owningHighlight = getOwningHighlight();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Current Zone */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Zone
          </CardTitle>
          <Target className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <ZoneBadge zone={latestSnapshot?.overall_zone || null} />
          </div>
          {latestSnapshot && (
            <p className="text-xs text-muted-foreground mt-1">
              from {formatDate(latestSnapshot.created_at)} snapshot
            </p>
          )}
        </CardContent>
      </Card>

      {/* Growth Opportunity */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Growth Opportunity
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {latestSnapshot?.growth_opportunity_category ? (
            <>
              <div className="text-lg font-semibold capitalize">
                {latestSnapshot.growth_opportunity_category}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Biggest opportunity for growth
              </p>
            </>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>

      {/* Owning Highlight */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Owning Highlight
          </CardTitle>
          <Award className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {owningHighlight ? (
            <>
              <div className="text-lg font-semibold capitalize">
                {owningHighlight}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Strong area of ownership
              </p>
            </>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>

      {/* Next Meeting */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Next Meeting
          </CardTitle>
          <CalendarClock className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {nextScheduledSession ? (
            <>
              <div className="text-lg font-semibold">
                {formatDateTime(nextScheduledSession.session_date)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 capitalize flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {nextScheduledSession.session_type || 'Coaching'} session
              </p>
            </>
          ) : (
            <>
              <div className="text-muted-foreground">No sessions scheduled</div>
              <p className="text-xs text-muted-foreground mt-1">
                {lastActivity && (
                  <span>Last active {formatDistanceToNow(new Date(lastActivity.date), { addSuffix: true })}</span>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
