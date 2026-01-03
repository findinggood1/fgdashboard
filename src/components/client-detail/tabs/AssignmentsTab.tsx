import { useState } from 'react';
import { Assignment } from '@/hooks/useClientDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ClipboardList, Plus, Check, X, CalendarIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface AssignmentsTabProps {
  assignments: Assignment[];
  clientEmail: string;
  engagementId?: string;
  onRefresh: () => void;
}

const PRACTICE_TYPE_GROUPS = [
  {
    phase: 'NAME Phase',
    subtitle: 'Builds Clarity',
    practices: [
      { value: 'snapshot', label: 'Take Snapshot', description: 'Complete a self-assessment snapshot' },
      { value: 'impact_self', label: 'Impact - Self', description: 'Self-verification of impact' },
      { value: 'impact_other', label: 'Impact - Other', description: 'Request feedback from others' },
    ],
  },
  {
    phase: 'VALIDATE Phase',
    subtitle: 'Builds Confidence',
    practices: [
      { value: 'validation_self', label: 'Validation - Self', description: 'Self-validation practice' },
      { value: 'validation_other', label: 'Validation - Other', description: 'Request validation from others' },
    ],
  },
  {
    phase: 'COMMUNICATE Phase',
    subtitle: 'Builds Influence',
    practices: [
      { value: 'conversation', label: 'Conversation Practice', description: 'Practice a key conversation' },
    ],
  },
];

const ALL_PRACTICE_TYPES = PRACTICE_TYPE_GROUPS.flatMap(g => g.practices);

export function AssignmentsTab({ assignments, clientEmail, engagementId, onRefresh }: AssignmentsTabProps) {
  const { toast } = useToast();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form state
  const [practiceType, setPracticeType] = useState('snapshot');
  const [coachNote, setCoachNote] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const pastAssignments = assignments.filter(a => ['completed', 'cancelled', 'expired'].includes(a.status));

  const resetForm = () => {
    setPracticeType('snapshot');
    setCoachNote('');
    setDueDate(undefined);
  };

  const handleAssign = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          client_email: clientEmail,
          engagement_id: engagementId || null,
          practice_type: practiceType,
          coach_note: coachNote.trim() || null,
          due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
          status: 'pending',
        });

      if (error) throw error;

      toast({ title: 'Practice assigned', description: 'The assignment has been created.' });
      setAddModalOpen(false);
      resetForm();
      onRefresh();
    } catch (err) {
      console.error('Error assigning practice:', err);
      toast({ title: 'Failed to assign practice', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'completed' | 'cancelled') => {
    setUpdatingId(id);
    try {
      const updates: Record<string, any> = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({ title: newStatus === 'completed' ? 'Marked as complete' : 'Assignment cancelled' });
      onRefresh();
    } catch (err) {
      console.error('Error updating assignment:', err);
      toast({ title: 'Failed to update assignment', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const getPracticeLabel = (type: string) => {
    return ALL_PRACTICE_TYPES.find(p => p.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    return isPast(due) && !isToday(due);
  };

  const renderAssignmentCard = (assignment: Assignment, showActions: boolean) => (
    <Card key={assignment.id} className="bg-card/50">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {getPracticeLabel(assignment.practice_type)}
              </Badge>
              {!showActions && getStatusBadge(assignment.status)}
              {assignment.due_date && (
                <span className={cn(
                  "text-xs flex items-center gap-1",
                  showActions && isOverdue(assignment.due_date) && "text-destructive font-medium"
                )}>
                  {showActions && isOverdue(assignment.due_date) && <AlertCircle className="h-3 w-3" />}
                  Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            {assignment.coach_note && (
              <p className="text-sm text-muted-foreground">{assignment.coach_note}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Assigned: {format(new Date(assignment.created_at), 'MMM d, yyyy')}
              {assignment.status === 'completed' && assignment.completed_at && (
                <> • Completed: {format(new Date(assignment.completed_at), 'MMM d, yyyy')}</>
              )}
            </p>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                onClick={() => handleStatusChange(assignment.id, 'completed')}
                disabled={updatingId === assignment.id}
              >
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleStatusChange(assignment.id, 'cancelled')}
                disabled={updatingId === assignment.id}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Assign Practice
        </Button>
      </div>

      {/* Pending Assignments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pending</h3>
        {pendingAssignments.length === 0 ? (
          <Card className="bg-card/30 border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No pending assignments</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingAssignments.map(a => renderAssignmentCard(a, true))}
          </div>
        )}
      </div>

      {/* Past Assignments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Past</h3>
        {pastAssignments.length === 0 ? (
          <Card className="bg-card/30 border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No past assignments</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pastAssignments.map(a => renderAssignmentCard(a, false))}
          </div>
        )}
      </div>

      {/* Assign Practice Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Practice</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Practice Type</Label>
              <RadioGroup value={practiceType} onValueChange={setPracticeType} className="space-y-4">
                {PRACTICE_TYPE_GROUPS.map(group => (
                  <div key={group.phase} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{group.phase}</span>
                      <span className="text-xs text-muted-foreground">({group.subtitle})</span>
                    </div>
                    <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                      {group.practices.map(type => (
                        <div key={type.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value={type.value} id={type.value} className="mt-0.5" />
                          <label htmlFor={type.value} className="flex-1 cursor-pointer">
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coach-note">Coach Note (optional)</Label>
              <Textarea
                id="coach-note"
                value={coachNote}
                onChange={(e) => setCoachNote(e.target.value)}
                placeholder="Add context or instructions for this assignment..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button variant="ghost" size="sm" onClick={() => setDueDate(undefined)}>
                  Clear date
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={saving}>
              {saving ? 'Assigning...' : 'Assign Practice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
