import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { SessionTranscript } from '@/hooks/useClientDetail';

interface TranscriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionTranscript | null;
}

export function TranscriptModal({ open, onOpenChange, session }: TranscriptModalProps) {
  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Session Transcript</span>
            {session.session_number && (
              <Badge variant="outline">Session {session.session_number}</Badge>
            )}
            <span className="text-sm font-normal text-muted-foreground">
              {format(new Date(session.session_date), 'MMMM d, yyyy')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] mt-4">
          <div className="pr-4">
            {session.transcript_text ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {session.transcript_text}
              </pre>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No transcript available for this session.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
