import { useState } from 'react';
import { MoreLessMarker, MoreLessUpdate, SessionTranscript } from '@/hooks/useClientDetail';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TrendingUp, TrendingDown, BarChart2, Plus, Pencil, Loader2, ChevronDown, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MoreLessTabProps {
  markers: MoreLessMarker[];
  clientEmail: string;
  engagementId?: string;
  onRefresh?: () => void;
}

const FIRES_OPTIONS = [
  { value: 'feelings', label: 'Feelings' },
  { value: 'influence', label: 'Influence' },
  { value: 'resilience', label: 'Resilience' },
  { value: 'ethics', label: 'Ethics' },
  { value: 'strengths', label: 'Strengths' },
];

const SOURCE_OPTIONS = [
  { value: 'session', label: 'Session' },
  { value: 'weekly_check', label: 'Weekly Check' },
  { value: 'self_report', label: 'Self-Report' },
  { value: 'coach_observation', label: 'Coach Observation' },
];

const FIRES_COLORS: Record<string, string> = {
  feelings: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  influence: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  resilience: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ethics: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  strengths: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export function MoreLessTab({ markers, clientEmail, engagementId, onRefresh }: MoreLessTabProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MoreLessMarker | null>(null);
  const [saving, setSaving] = useState(false);

  // Add marker form state
  const [newMarkerText, setNewMarkerText] = useState('');
  const [newMarkerType, setNewMarkerType] = useState<'more' | 'less'>('more');
  const [newBaseline, setNewBaseline] = useState([5]);
  const [newTarget, setNewTarget] = useState([8]);
  const [newFiresConnection, setNewFiresConnection] = useState<string>('');

  // Update score form state
  const [updateScore, setUpdateScore] = useState([5]);
  const [updateSource, setUpdateSource] = useState('session');
  const [updateNote, setUpdateNote] = useState('');

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

  const resetAddForm = () => {
    setNewMarkerText('');
    setNewMarkerType('more');
    setNewBaseline([5]);
    setNewTarget([8]);
    setNewFiresConnection('');
  };

  const handleAddMarker = async () => {
    if (!newMarkerText.trim()) {
      toast.error('Please enter marker text');
      return;
    }

    setSaving(true);
    try {
      // Insert marker
      const { data: markerData, error: markerError } = await supabase
        .from('more_less_markers')
        .insert({
          client_email: clientEmail,
          engagement_id: engagementId || null,
          marker_text: newMarkerText.trim(),
          marker_type: newMarkerType,
          baseline_score: newBaseline[0],
          target_score: newTarget[0],
          current_score: newBaseline[0],
          fires_connection: newFiresConnection || null,
          is_active: true,
        })
        .select()
        .single();

      if (markerError) throw markerError;

      // Insert initial update record
      const { error: updateError } = await supabase
        .from('more_less_updates')
        .insert({
          marker_id: markerData.id,
          update_date: new Date().toISOString().split('T')[0],
          score: newBaseline[0],
          source: 'baseline',
          note: 'Initial baseline score',
        });

      if (updateError) throw updateError;

      toast.success('Marker added successfully');
      setAddModalOpen(false);
      resetAddForm();
      onRefresh?.();
    } catch (err) {
      console.error('Error adding marker:', err);
      toast.error('Failed to add marker');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenUpdateModal = (marker: MoreLessMarker) => {
    setSelectedMarker(marker);
    setUpdateScore([marker.current_score || 5]);
    setUpdateSource('session');
    setUpdateNote('');
    setUpdateModalOpen(true);
  };

  const handleUpdateScore = async () => {
    if (!selectedMarker) return;

    setSaving(true);
    try {
      // Insert update record
      const { error: updateError } = await supabase
        .from('more_less_updates')
        .insert({
          marker_id: selectedMarker.id,
          update_date: new Date().toISOString().split('T')[0],
          score: updateScore[0],
          source: updateSource,
          note: updateNote.trim() || null,
        });

      if (updateError) throw updateError;

      // Update marker's current score
      const { error: markerError } = await supabase
        .from('more_less_markers')
        .update({ current_score: updateScore[0] })
        .eq('id', selectedMarker.id);

      if (markerError) throw markerError;

      toast.success('Score updated successfully');
      setUpdateModalOpen(false);
      setSelectedMarker(null);
      onRefresh?.();
    } catch (err) {
      console.error('Error updating score:', err);
      toast.error('Failed to update score');
    } finally {
      setSaving(false);
    }
  };

  const MarkerCard = ({ marker }: { marker: MoreLessMarker }) => {
    const [historyOpen, setHistoryOpen] = useState(false);
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
              <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="font-medium">{marker.marker_text}</h4>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {marker.fires_connection && (
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs capitalize', FIRES_COLORS[marker.fires_connection])}
                    >
                      {marker.fires_connection}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleOpenUpdateModal(marker)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Update Score
                  </Button>
                </div>
              </div>

              {/* Progress bar with labels */}
              <div className="space-y-1">
                <div className="relative">
                  <Progress value={progress} className="h-3" />
                  {/* Current score indicator */}
                  {marker.current_score !== null && marker.baseline_score !== null && marker.target_score !== null && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md"
                      style={{ left: `calc(${progress}% - 8px)` }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{marker.baseline_score ?? '—'}</span>
                  <span className="font-semibold text-foreground">{marker.current_score ?? '—'}</span>
                  <span className="font-medium">{marker.target_score ?? '—'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Baseline</span>
                  <span>Current</span>
                  <span>Target</span>
                </div>
              </div>

              {/* History collapsible */}
              {marker.updates && marker.updates.length > 0 && (
                <Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className="mt-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs w-full justify-between">
                      <span className="flex items-center gap-1">
                        <History className="h-3 w-3" />
                        History ({marker.updates.length})
                      </span>
                      <ChevronDown className={cn('h-3 w-3 transition-transform', historyOpen && 'rotate-180')} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="space-y-2 border-l-2 border-muted pl-3 ml-1">
                      {marker.updates.map((update) => (
                        <div key={update.id} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{format(new Date(update.update_date), 'MMM d, yyyy')}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {update.score}
                            </Badge>
                            {update.source && (
                              <span className="text-muted-foreground capitalize">{update.source.replace('_', ' ')}</span>
                            )}
                          </div>
                          {update.note && (
                            <p className="text-muted-foreground mt-0.5">{update.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Marker
          </Button>
        </div>

        {markers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart2 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No More/Less markers yet</p>
            <p className="text-sm mt-1">Add markers to track behavioral changes</p>
          </div>
        ) : (
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
        )}
      </div>

      {/* Add Marker Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add More/Less Marker</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="marker-text">Marker Text</Label>
              <Textarea
                id="marker-text"
                value={newMarkerText}
                onChange={(e) => setNewMarkerText(e.target.value)}
                placeholder="e.g., Speaking up in meetings, Checking email after hours"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup value={newMarkerType} onValueChange={(v) => setNewMarkerType(v as 'more' | 'less')} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more" id="type-more" />
                  <Label htmlFor="type-more" className="flex items-center gap-1 cursor-pointer">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> More
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less" id="type-less" />
                  <Label htmlFor="type-less" className="flex items-center gap-1 cursor-pointer">
                    <TrendingDown className="h-4 w-4 text-rose-500" /> Less
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Baseline Score: {newBaseline[0]}</Label>
              <Slider value={newBaseline} onValueChange={setNewBaseline} min={1} max={10} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Score: {newTarget[0]}</Label>
              <Slider value={newTarget} onValueChange={setNewTarget} min={1} max={10} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>FIRES Connection</Label>
              <Select value={newFiresConnection} onValueChange={setNewFiresConnection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select connection (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {FIRES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMarker} disabled={saving || !newMarkerText.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Marker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Score Modal */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Score</DialogTitle>
          </DialogHeader>
          {selectedMarker && (
            <div className="space-y-5 py-4">
              <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                {selectedMarker.marker_type === 'more' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
                <span className="font-medium">{selectedMarker.marker_text}</span>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Current Score: <span className="font-semibold text-foreground">{selectedMarker.current_score}</span>
              </div>

              <div className="space-y-2">
                <Label>New Score: {updateScore[0]}</Label>
                <Slider 
                  value={updateScore} 
                  onValueChange={setUpdateScore} 
                  min={1} 
                  max={10} 
                  step={1} 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={updateSource} onValueChange={setUpdateSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-note">Note (optional)</Label>
                <Textarea
                  id="update-note"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="What happened? Any context for this change?"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateScore} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
