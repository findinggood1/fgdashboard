import { useState } from 'react';
import { MoreLessMarker } from '@/hooks/useClientDetail';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, BarChart2, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface MoreLessTabProps {
  markers: MoreLessMarker[];
  onRefresh?: () => void;
}

export function MoreLessTab({ markers, onRefresh }: MoreLessTabProps) {
  const [editingMarker, setEditingMarker] = useState<MoreLessMarker | null>(null);
  const [editScore, setEditScore] = useState<string>('');
  const [editExchangeInsight, setEditExchangeInsight] = useState<string>('');
  const [saving, setSaving] = useState(false);

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

  const handleOpenEdit = (marker: MoreLessMarker) => {
    setEditingMarker(marker);
    setEditScore(marker.current_score?.toString() ?? '');
    setEditExchangeInsight(marker.exchange_insight ?? '');
  };

  const handleSave = async () => {
    if (!editingMarker) return;
    
    const newScore = parseFloat(editScore);
    if (isNaN(newScore)) {
      toast.error('Please enter a valid score');
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<MoreLessMarker> = {
        current_score: newScore,
      };

      // Only include exchange_insight if it's provided
      if (editExchangeInsight.trim()) {
        updates.exchange_insight = editExchangeInsight.trim();
      }

      const { error } = await supabase
        .from('more_less_markers')
        .update(updates)
        .eq('id', editingMarker.id);

      if (error) throw error;

      toast.success('Marker updated');
      setEditingMarker(null);
      onRefresh?.();
    } catch (err) {
      console.error('Error updating marker:', err);
      toast.error('Failed to update marker');
    } finally {
      setSaving(false);
    }
  };

  const getExchangeLabel = (markerType: 'more' | 'less') => {
    if (markerType === 'more') {
      return 'What did more of this give you less of?';
    }
    return 'What did less of this give you more of?';
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
                <div className="flex items-center gap-2">
                  {marker.fires_connection && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {marker.fires_connection}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenEdit(marker)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Update
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Baseline: {marker.baseline_score ?? '—'}</span>
                <span>Current: {marker.current_score ?? '—'}</span>
                <span>Target: {marker.target_score ?? '—'}</span>
              </div>
              {marker.exchange_insight && (
                <p className="text-sm italic text-muted-foreground mt-3 pt-3 border-t">
                  "{marker.exchange_insight}"
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
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

      {/* Update Modal */}
      <Dialog open={!!editingMarker} onOpenChange={(open) => !open && setEditingMarker(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Marker Score</DialogTitle>
          </DialogHeader>
          {editingMarker && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-sm">
                {editingMarker.marker_type === 'more' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
                <span className="font-medium">
                  {editingMarker.marker_type.toUpperCase()}: {editingMarker.marker_text}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-score">Current Score</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {editingMarker.baseline_score ?? 0}
                  </span>
                  <Input
                    id="current-score"
                    type="number"
                    value={editScore}
                    onChange={(e) => setEditScore(e.target.value)}
                    className="flex-1"
                    min={editingMarker.baseline_score ?? 0}
                    max={editingMarker.target_score ?? 10}
                  />
                  <span className="text-sm text-muted-foreground">
                    {editingMarker.target_score ?? 10}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchange-insight">{getExchangeLabel(editingMarker.marker_type)}</Label>
                <p className="text-xs text-muted-foreground">(The exchange insight)</p>
                <Textarea
                  id="exchange-insight"
                  value={editExchangeInsight}
                  onChange={(e) => setEditExchangeInsight(e.target.value)}
                  placeholder="e.g., More clarity meant less anxiety about decisions"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMarker(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !editScore.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
