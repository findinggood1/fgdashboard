import { useState } from 'react';
import { CoachingEngagement } from '@/lib/supabase';
import { Snapshot } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Flame, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FiresFocusSectionProps {
  engagement: CoachingEngagement | null;
  latestSnapshot: Snapshot | null;
  onUpdate: (updates: Partial<CoachingEngagement>) => Promise<void>;
}

const firesElements = [
  { id: 'feelings', label: 'Feelings', description: 'Emotional awareness and expression' },
  { id: 'influence', label: 'Influence', description: 'Impact and leadership presence' },
  { id: 'resilience', label: 'Resilience', description: 'Adaptability and recovery' },
  { id: 'ethics', label: 'Ethics', description: 'Values alignment and integrity' },
  { id: 'strengths', label: 'Strengths', description: 'Core capabilities and talents' },
];

export function FiresFocusSection({ engagement, latestSnapshot, onUpdate }: FiresFocusSectionProps) {
  const [editing, setEditing] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const activeFires: string[] = Array.isArray(engagement?.fires_focus) 
    ? engagement.fires_focus 
    : [];

  const openEditor = () => {
    setTempSelection([...activeFires]);
    setEditing(true);
  };

  const toggleElement = (elementId: string) => {
    if (tempSelection.includes(elementId)) {
      setTempSelection(tempSelection.filter(e => e !== elementId));
    } else if (tempSelection.length < 3) {
      setTempSelection([...tempSelection, elementId]);
    } else {
      toast.error('Maximum 3 FIRES elements can be selected');
    }
  };

  const saveFires = async () => {
    if (tempSelection.length === 0) {
      toast.error('Select at least 1 FIRES element');
      return;
    }
    setSaving(true);
    try {
      await onUpdate({ fires_focus: tempSelection });
      toast.success('FIRES focus updated');
      setEditing(false);
    } catch (err) {
      toast.error('Failed to save FIRES focus');
    } finally {
      setSaving(false);
    }
  };

  if (!engagement) return null;

  // Get scores from latest snapshot
  const getScore = (element: string) => {
    if (!latestSnapshot?.confidence_scores) return null;
    const scores = latestSnapshot.confidence_scores as Record<string, number>;
    // Try different key formats
    const score = scores[element.toLowerCase()] || scores[element] || null;
    return score;
  };

  const getZone = (element: string) => {
    if (!latestSnapshot?.zone_breakdown) return null;
    const breakdown = latestSnapshot.zone_breakdown as Record<string, string>;
    return breakdown[element.toLowerCase()] || breakdown[element] || null;
  };

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            FIRES Focus
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openEditor}>
            <Pencil className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {firesElements.map((element) => {
              const isActive = activeFires.some(
                (f) => f.toLowerCase() === element.id.toLowerCase()
              );
              const score = getScore(element.label);
              const zone = getZone(element.label);

              return (
                <div
                  key={element.id}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border transition-all cursor-pointer',
                    isActive
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-muted/30 border-muted opacity-50'
                  )}
                  onClick={openEditor}
                >
                  <span
                    className={cn(
                      'font-medium text-sm',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {element.label}
                  </span>
                  {isActive && score !== null && (
                    <span className="text-lg font-bold mt-1">{score.toFixed(1)}</span>
                  )}
                  {isActive && zone && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs mt-1 capitalize',
                        zone.toLowerCase() === 'owning' && 'border-emerald-500 text-emerald-600',
                        zone.toLowerCase() === 'performing' && 'border-amber-500 text-amber-600',
                        zone.toLowerCase() === 'discovering' && 'border-blue-500 text-blue-600',
                        zone.toLowerCase() === 'exploring' && 'border-gray-500 text-gray-600'
                      )}
                    >
                      {zone}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          {activeFires.length === 0 && (
            <Button variant="link" size="sm" className="px-0 mt-2 text-primary" onClick={openEditor}>
              Select FIRES focus areas
            </Button>
          )}
        </CardContent>
      </Card>

      {/* FIRES Editor Modal */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select FIRES Focus Areas</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select 1-3 FIRES elements to focus on during this engagement.
            </p>
            <div className="space-y-3">
              {firesElements.map((element) => {
                const isSelected = tempSelection.includes(element.id);
                return (
                  <div
                    key={element.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      isSelected
                        ? 'bg-primary/5 border-primary/30'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => toggleElement(element.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleElement(element.id)}
                      disabled={!isSelected && tempSelection.length >= 3}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{element.label}</p>
                      <p className="text-xs text-muted-foreground">{element.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {tempSelection.length}/3 selected
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveFires} disabled={saving || tempSelection.length === 0}>
              <Check className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
