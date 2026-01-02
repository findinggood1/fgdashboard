import { format } from 'date-fns';
import { CoachingNote } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';

interface NotesTabProps {
  notes: CoachingNote[];
}

export function NotesTab({ notes }: NotesTabProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No notes yet</p>
        <p className="text-sm mt-1">Coaching notes will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id} className="shadow-soft">
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
            
            {(note.coach_curiosity || note.coach_next || note.coach_trap) && (
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
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
