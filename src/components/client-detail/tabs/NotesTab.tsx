import { useState } from 'react';
import { format } from 'date-fns';
import { CoachingNote, VoiceMemo, SessionTranscript } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, Lightbulb, AlertTriangle, ArrowRight, Plus, ChevronDown, Mic, Play, Pause, Clock, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NotesTabProps {
  notes: CoachingNote[];
  memos: VoiceMemo[];
  sessions: SessionTranscript[];
  clientEmail: string;
  onRefresh?: () => void;
}

const SESSION_TYPES = [
  { value: 'prep', label: 'Prep' },
  { value: 'session', label: 'Session' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'general', label: 'General' },
];

export function NotesTab({ notes, memos, sessions, clientEmail, onRefresh }: NotesTabProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coachNotesOpen, setCoachNotesOpen] = useState(false);

  // Form state
  const [noteContent, setNoteContent] = useState('');
  const [sessionType, setSessionType] = useState('general');
  const [linkedSession, setLinkedSession] = useState<string>('');
  const [coachCuriosity, setCoachCuriosity] = useState('');
  const [coachNext, setCoachNext] = useState('');
  const [coachTrap, setCoachTrap] = useState('');

  const resetForm = () => {
    setNoteContent('');
    setSessionType('general');
    setLinkedSession('');
    setCoachCuriosity('');
    setCoachNext('');
    setCoachTrap('');
    setCoachNotesOpen(false);
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Please enter note content');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('coaching_notes')
        .insert({
          client_email: clientEmail,
          note_date: new Date().toISOString().split('T')[0],
          content: noteContent.trim(),
          session_type: sessionType,
          related_session_id: linkedSession && linkedSession !== 'none' ? linkedSession : null,
          coach_curiosity: coachCuriosity.trim() || null,
          coach_next: coachNext.trim() || null,
          coach_trap: coachTrap.trim() || null,
        });

      if (error) throw error;

      toast.success('Note added successfully');
      setAddModalOpen(false);
      resetForm();
      onRefresh?.();
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  // Recent sessions for linking (last 10)
  const recentSessions = sessions.slice(0, 10);

  return (
    <>
      <div className="space-y-8">
        {/* Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-medium flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Coaching Notes
            </h3>
            <Button onClick={() => setAddModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </div>

          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">No notes yet</p>
              <p className="text-sm mt-1">Add coaching notes to track client progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>

        {/* Voice Memos Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-serif font-medium flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice Memos
          </h3>

          {memos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <Mic className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">No voice memos</p>
              <p className="text-sm mt-1">Voice memos will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memos.map((memo) => (
                <VoiceMemoCard key={memo.id} memo={memo} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Coaching Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-content">Note Content *</Label>
              <Textarea
                id="note-content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your coaching note..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {recentSessions.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Session (optional)</Label>
                <Select value={linkedSession} onValueChange={setLinkedSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {recentSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {format(new Date(session.session_date), 'MMM d, yyyy')} - {session.session_type || `Session ${session.session_number}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Collapsible open={coachNotesOpen} onOpenChange={setCoachNotesOpen} className="border rounded-lg p-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto font-medium">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Private Coach Notes
                  </span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', coachNotesOpen && 'rotate-180')} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coach-curiosity" className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-3 w-3 text-amber-500" />
                    Curiosity
                  </Label>
                  <Textarea
                    id="coach-curiosity"
                    value={coachCuriosity}
                    onChange={(e) => setCoachCuriosity(e.target.value)}
                    placeholder="What are you curious about?"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coach-next" className="flex items-center gap-2 text-sm">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    Next Steps
                  </Label>
                  <Textarea
                    id="coach-next"
                    value={coachNext}
                    onChange={(e) => setCoachNext(e.target.value)}
                    placeholder="What's next for this client?"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coach-trap" className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-3 w-3 text-rose-500" />
                    Traps to Avoid
                  </Label>
                  <Textarea
                    id="coach-trap"
                    value={coachTrap}
                    onChange={(e) => setCoachTrap(e.target.value)}
                    placeholder="What should you avoid?"
                    rows={2}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={saving || !noteContent.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NoteCard({ note }: { note: CoachingNote }) {
  const [privateNotesOpen, setPrivateNotesOpen] = useState(false);
  const hasPrivateNotes = note.coach_curiosity || note.coach_next || note.coach_trap;

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">
              {format(new Date(note.note_date), 'MMMM d, yyyy')}
            </CardTitle>
            {note.session_type && (
              <Badge variant="outline" className="capitalize">
                {note.session_type}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm whitespace-pre-wrap">{note.content}</div>
        
        {hasPrivateNotes && (
          <Collapsible open={privateNotesOpen} onOpenChange={setPrivateNotesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground p-0 h-auto">
                <ChevronDown className={cn('h-3 w-3 mr-1 transition-transform', privateNotesOpen && 'rotate-180')} />
                Private Coach Notes
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="border-t pt-3 space-y-2">
                {note.coach_curiosity && (
                  <div className="flex items-start gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-muted-foreground">Curiosity: </span>
                      {note.coach_curiosity}
                    </div>
                  </div>
                )}
                {note.coach_next && (
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-muted-foreground">Next: </span>
                      {note.coach_next}
                    </div>
                  </div>
                )}
                {note.coach_trap && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-muted-foreground">Trap to avoid: </span>
                      {note.coach_trap}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

function VoiceMemoCard({ memo }: { memo: VoiceMemo }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    // TODO: Implement actual audio playback
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full flex-shrink-0"
            onClick={handlePlayPause}
            disabled={!memo.audio_url}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium truncate">
                {memo.title || 'Voice Memo'}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(memo.duration_seconds)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(memo.recorded_at), 'MMM d, yyyy h:mm a')}
            </p>

            {memo.transcription && (
              <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen} className="mt-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                    <FileText className="h-3 w-3 mr-1" />
                    {transcriptOpen ? 'Hide' : 'Show'} Transcript
                    <ChevronDown className={cn('h-3 w-3 ml-1 transition-transform', transcriptOpen && 'rotate-180')} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {memo.transcription}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}

            {!memo.is_transcribed && (
              <Badge variant="secondary" className="mt-2 text-[10px]">
                Not transcribed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
