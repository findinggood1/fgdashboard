import { MoreLessMarker } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface MoreLessSummaryProps {
  markers: MoreLessMarker[];
  onViewAll: () => void;
}

export function MoreLessSummary({ markers, onViewAll }: MoreLessSummaryProps) {
  if (markers.length === 0) {
    return null;
  }

  const topMarkers = markers.slice(0, 3);

  const getProgress = (marker: MoreLessMarker) => {
    if (marker.baseline_score === null || marker.target_score === null || marker.current_score === null) {
      return 0;
    }
    const range = marker.target_score - marker.baseline_score;
    if (range === 0) return 100;
    const progress = ((marker.current_score - marker.baseline_score) / range) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif text-lg">More / Less Progress</CardTitle>
        <Button variant="link" size="sm" onClick={onViewAll} className="text-primary">
          See all markers
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topMarkers.map((marker) => (
            <div key={marker.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {marker.marker_type === 'more' ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                  )}
                  <span className="text-sm font-medium">
                    {marker.marker_type.toUpperCase()}: {marker.marker_text}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {marker.current_score ?? '—'} / {marker.target_score ?? '—'}
                </span>
              </div>
              <Progress value={getProgress(marker)} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
