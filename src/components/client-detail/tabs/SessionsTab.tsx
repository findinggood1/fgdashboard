import { useState } from 'react';
import { SessionTranscript } from '@/hooks/useClientDetail';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { SessionCard } from './SessionCard';
import { AddSessionModal } from './AddSessionModal';
import { TranscriptModal } from './TranscriptModal';

interface SessionsTabProps {
  sessions: SessionTranscript[];
  clientEmail: string;
  engagementId?: string;
  onRefresh: () => void;
}

export function SessionsTab({ sessions, clientEmail, engagementId, onRefresh }: SessionsTabProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [transcriptSession, setTranscriptSession] = useState<SessionTranscript | null>(null);

  const nextSessionNumber = sessions.length > 0
    ? Math.max(...sessions.map(s => s.session_number || 0)) + 1
    : 1;

  if (sessions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Session
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No sessions recorded yet</p>
          <p className="text-sm mt-1">Add your first session transcript or notes</p>
        </div>

        <AddSessionModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          clientEmail={clientEmail}
          engagementId={engagementId}
          nextSessionNumber={nextSessionNumber}
          onSuccess={onRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Session
        </Button>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onViewTranscript={setTranscriptSession}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      <AddSessionModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        clientEmail={clientEmail}
        engagementId={engagementId}
        nextSessionNumber={nextSessionNumber}
        onSuccess={onRefresh}
      />

      <TranscriptModal
        open={!!transcriptSession}
        onOpenChange={(open) => !open && setTranscriptSession(null)}
        session={transcriptSession}
      />
    </div>
  );
}
