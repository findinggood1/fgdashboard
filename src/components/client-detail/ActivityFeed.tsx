import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Loader2, ExternalLink } from 'lucide-react';
import { useClientActivity } from '@/hooks/useClientActivity';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  clientEmail: string;
  limit?: number;
  onViewAll?: () => void;
}

// FIRES badge colors matching the brand
const FIRES_COLORS: Record<string, { bg: string; text: string }> = {
  feelings: { bg: 'bg-fires-feelings/20', text: 'text-fires-feelings' },
  influence: { bg: 'bg-fires-influence/20', text: 'text-fires-influence' },
  resilience: { bg: 'bg-fires-resilience/20', text: 'text-fires-resilience' },
  ethics: { bg: 'bg-fires-ethics/20', text: 'text-fires-ethics' },
  strengths: { bg: 'bg-fires-strengths/20', text: 'text-fires-strengths' },
};

export function ActivityFeed({ clientEmail, limit = 5, onViewAll }: ActivityFeedProps) {
  const { data: activities, isLoading, error } = useClientActivity(clientEmail, limit);

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        {onViewAll && activities && activities.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground italic">
              No recent activity
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Activity will appear as your client uses the tools
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  activity: {
    id: string;
    proof_line: string | null;
    fires_extracted: Record<string, unknown> | null;
    created_at: string;
    prediction_id: string | null;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  // Extract FIRES elements from the fires_extracted field
  const firesElements = extractFiresElements(activity.fires_extracted);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {activity.proof_line || 'Priority/proof added'}
        </p>

        {firesElements.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {firesElements.map((element) => {
              const colors = FIRES_COLORS[element] || { bg: 'bg-muted', text: 'text-muted-foreground' };
              return (
                <span
                  key={element}
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                    colors.bg,
                    colors.text
                  )}
                >
                  {element}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </span>
          {activity.prediction_id && (
            <span className="inline-flex items-center text-xs text-primary gap-0.5">
              <ExternalLink className="h-3 w-3" />
              Linked to prediction
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to extract FIRES elements from the fires_extracted JSONB field
function extractFiresElements(firesExtracted: Record<string, unknown> | null): string[] {
  if (!firesExtracted) return [];

  const elements: string[] = [];
  const validElements = ['feelings', 'influence', 'resilience', 'ethics', 'strengths'];

  // Handle various possible structures of fires_extracted
  if (Array.isArray(firesExtracted)) {
    // If it's an array of strings
    return firesExtracted.filter((el): el is string =>
      typeof el === 'string' && validElements.includes(el.toLowerCase())
    ).map(el => el.toLowerCase());
  }

  // If it's an object with boolean flags or nested data
  for (const key of validElements) {
    if (firesExtracted[key]) {
      elements.push(key);
    }
  }

  return elements;
}
