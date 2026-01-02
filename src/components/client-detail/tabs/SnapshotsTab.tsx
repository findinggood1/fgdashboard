import { format } from 'date-fns';
import { Snapshot } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ZoneBadge } from '@/components/clients/ZoneBadge';
import { Badge } from '@/components/ui/badge';
import { Camera } from 'lucide-react';

interface SnapshotsTabProps {
  snapshots: Snapshot[];
}

export function SnapshotsTab({ snapshots }: SnapshotsTabProps) {
  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Camera className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No snapshots yet</p>
        <p className="text-sm mt-1">Completed snapshots will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {snapshots.map((snapshot, idx) => (
        <Card key={snapshot.id} className="shadow-soft hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-medium">
                  Snapshot #{snapshots.length - idx}
                </CardTitle>
                <ZoneBadge zone={snapshot.overall_zone} />
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(snapshot.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              {snapshot.growth_opportunity_category && (
                <div>
                  <span className="text-muted-foreground">Growth Area: </span>
                  <Badge variant="outline" className="capitalize">
                    {snapshot.growth_opportunity_category}
                  </Badge>
                </div>
              )}
              {snapshot.goal && (
                <div className="flex-1">
                  <span className="text-muted-foreground">Goal: </span>
                  <span className="line-clamp-1">{snapshot.goal}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
