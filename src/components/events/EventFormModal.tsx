import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Event } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  onSubmit: (data: Omit<Event, 'id' | 'created_at'>) => Promise<void>;
}

type ToolType = 'snapshot' | 'impact' | 'both';

export function EventFormModal({ open, onOpenChange, event, onSubmit }: EventFormModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [toolType, setToolType] = useState<ToolType>('both');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(addDays(new Date(), 30));
  const [maxEntries, setMaxEntries] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!event;

  useEffect(() => {
    if (event) {
      setCode(event.code);
      setName(event.name);
      setDescription(event.description || '');
      setToolType(event.tool_type as ToolType);
      setExpiresAt(event.expires_at ? new Date(event.expires_at) : undefined);
      setMaxEntries(event.max_entries?.toString() || '');
      setIsActive(event.is_active);
    } else {
      // Reset form for new event
      setCode('');
      setName('');
      setDescription('');
      setToolType('both');
      setExpiresAt(addDays(new Date(), 30));
      setMaxEntries('');
      setIsActive(true);
    }
    setErrors({});
  }, [event, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = 'Event code is required';
    } else if (code.length < 4 || code.length > 20) {
      newErrors.code = 'Code must be 4-20 characters';
    } else if (!/^[A-Z0-9]+$/.test(code)) {
      newErrors.code = 'Code must be uppercase letters and numbers only';
    }

    if (!name.trim()) {
      newErrors.name = 'Event name is required';
    }

    if (maxEntries && (isNaN(Number(maxEntries)) || Number(maxEntries) < 1)) {
      newErrors.maxEntries = 'Must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        code: code.toUpperCase(),
        name,
        description: description || null,
        tool_type: toolType,
        expires_at: expiresAt?.toISOString() || null,
        max_entries: maxEntries ? Number(maxEntries) : null,
        is_active: isActive,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Error submitting event:', err);
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save event' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {isEditing ? 'Edit Event' : 'Create Event'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the event details below.' 
              : 'Set up a new event for workshops or assessments.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Event Code *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="LEAD2025"
              disabled={isEditing}
              className={cn(isEditing && 'bg-muted cursor-not-allowed')}
              maxLength={20}
            />
            {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
            <p className="text-xs text-muted-foreground">4-20 uppercase characters</p>
          </div>

          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leadership Workshop 2025"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of the event..."
              rows={3}
            />
          </div>

          {/* Tool Access */}
          <div className="space-y-3">
            <Label>Tool Access *</Label>
            <RadioGroup value={toolType} onValueChange={(v) => setToolType(v as ToolType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="snapshot" id="snapshot" />
                <Label htmlFor="snapshot" className="font-normal cursor-pointer">
                  Snapshot only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="impact" id="impact" />
                <Label htmlFor="impact" className="font-normal cursor-pointer">
                  Impact Amplifier only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="font-normal cursor-pointer">
                  Both
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label>Expiration Date</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !expiresAt && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiresAt ? format(expiresAt, 'PPP') : 'No expiration'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiresAt}
                    onSelect={setExpiresAt}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {expiresAt && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpiresAt(undefined)}
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Leave blank for no expiration</p>
          </div>

          {/* Max Entries */}
          <div className="space-y-2">
            <Label htmlFor="maxEntries">Max Entries</Label>
            <Input
              id="maxEntries"
              type="number"
              value={maxEntries}
              onChange={(e) => setMaxEntries(e.target.value)}
              placeholder="Unlimited"
              min={1}
            />
            {errors.maxEntries && <p className="text-sm text-destructive">{errors.maxEntries}</p>}
            <p className="text-xs text-muted-foreground">Leave blank for unlimited entries</p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Enable this event for participants
              </p>
            </div>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {errors.submit && (
            <p className="text-sm text-destructive text-center">{errors.submit}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
