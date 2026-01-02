import { MoreLessMarker } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoreLessTabProps {
  markers: MoreLessMarker[];
}

export function MoreLessTab({ markers }: MoreLessTabProps) {
  if (markers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <BarChart2 className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No More/Less markers yet</p>
        <p className="text-sm mt-1">Progress markers will appear here</p>
      </div>
    );
  }

  const moreMarkers = markers.filter((m) => m.marker_type === 'more');
  const lessMarkers = markers.filter((m) => m.marker_type === 'less');

  const getProgress = (marker: MoreLessMarker) => {
    if (marker.baseline_score === null || marker.target_score === null || marker.current_score === null) {
      return 0;
    }
    const range = marker.target_score - marker.baseline_score;
    if (range === 0) return 100;
    const progress = ((marker.current_score - marker.baseline_score) / range) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const MarkerCard = ({ marker }: { marker: MoreLessMarker }) => {
    const isMore = marker.marker_type === 'more';
    const progress = getProgress(marker);

    return (
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn('mt-1', isMore ? 'text-emerald-500' : 'text-rose-500')}>
              {isMore ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{marker.marker_text}</h4>
                {marker.fires_connection && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {marker.fires_connection}
                  </Badge>
                )}
              </div>
              <Progress value={progress} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Baseline: {marker.baseline_score ?? '—'}</span>
                <span>Current: {marker.current_score ?? '—'}</span>
                <span>Target: {marker.target_score ?? '—'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <h3 className="text-lg font-serif font-medium flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          More Of
        </h3>
        {moreMarkers.length > 0 ? (
          moreMarkers.map((marker) => <MarkerCard key={marker.id} marker={marker} />)
        ) : (
          <p className="text-sm text-muted-foreground italic">No "more" markers</p>
        )}
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-serif font-medium flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-rose-500" />
          Less Of
        </h3>
        {lessMarkers.length > 0 ? (
          lessMarkers.map((marker) => <MarkerCard key={marker.id} marker={marker} />)
        ) : (
          <p className="text-sm text-muted-foreground italic">No "less" markers</p>
        )}
      </div>
    </div>
  );
}
