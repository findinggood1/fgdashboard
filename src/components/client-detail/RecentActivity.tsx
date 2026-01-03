import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  FileText, 
  Target, 
  MessageSquare, 
  Mic, 
  CheckCircle,
  Camera,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'snapshot' | 'impact' | 'session' | 'note' | 'memo' | 'assignment' | 'file';
  description: string;
  date: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  defaultLimit?: number;
}

const activityConfig: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  snapshot: { icon: Camera, color: 'text-blue-500', label: 'Snapshot' },
  impact: { icon: Target, color: 'text-purple-500', label: 'Impact Entry' },
  session: { icon: FileText, color: 'text-emerald-500', label: 'Session' },
  note: { icon: MessageSquare, color: 'text-amber-500', label: 'Note' },
  memo: { icon: Mic, color: 'text-rose-500', label: 'Voice Memo' },
  assignment: { icon: CheckCircle, color: 'text-primary', label: 'Assignment' },
  file: { icon: FileText, color: 'text-muted-foreground', label: 'File' },
};

export function RecentActivity({ activities, defaultLimit = 5 }: RecentActivityProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayedActivities = isExpanded ? activities : activities.slice(0, defaultLimit);
  const hasMore = activities.length > defaultLimit;

  if (activities.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic text-center py-4">
            No activity yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedActivities.map((activity) => {
            const config = activityConfig[activity.type] || activityConfig.file;
            const Icon = config.icon;

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={cn('mt-0.5', config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
        
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                See more ({activities.length - defaultLimit} more)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
