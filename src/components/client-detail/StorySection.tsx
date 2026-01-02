import { useState } from 'react';
import { CoachingEngagement } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Check, X } from 'lucide-react';

interface StorySectionProps {
  engagement: CoachingEngagement | null;
  onUpdate: (updates: Partial<CoachingEngagement>) => Promise<void>;
  onStartEngagement: () => void;
}

type StoryField = 'story_present' | 'story_past' | 'story_potential';

export function StorySection({ engagement, onUpdate, onStartEngagement }: StorySectionProps) {
  const [editing, setEditing] = useState<StoryField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (field: StoryField) => {
    setEditing(field);
    setEditValue(engagement?.[field] || '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await onUpdate({ [editing]: editValue || null });
      setEditing(null);
      setEditValue('');
    } finally {
      setSaving(false);
    }
  };

  const StoryBlock = ({ field, label }: { field: StoryField; label: string }) => {
    const value = engagement?.[field];
    const isEditing = editing === field;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{label}</h4>
          {engagement && !isEditing && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(field)}>
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              placeholder="Capture the story..."
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} disabled={saving}>
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className={value ? 'text-sm' : 'text-sm italic text-muted-foreground'}>
            {value || 'Not captured yet'}
          </p>
        )}
      </div>
    );
  };

  if (!engagement) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-lg">The Story We're Strengthening</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Start an engagement to capture the client's story
            </p>
            <Button onClick={onStartEngagement} className="gradient-primary">
              Start Engagement
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="font-serif text-lg">The Story We're Strengthening</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <StoryBlock field="story_present" label="Present" />
          <StoryBlock field="story_past" label="Past" />
          <StoryBlock field="story_potential" label="Potential" />
        </div>
      </CardContent>
    </Card>
  );
}
