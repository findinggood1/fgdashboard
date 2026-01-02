import { format } from 'date-fns';
import { SessionTranscript } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, MessageSquare } from 'lucide-react';

interface SessionsTabProps {
  sessions: SessionTranscript[];
}

export function SessionsTab({ sessions }: SessionsTabProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No sessions yet</p>
        <p className="text-sm mt-1">Session transcripts will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="shadow-soft hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium">
                  Session {session.session_number || '—'}
                </CardTitle>
                {session.session_type && (
                  <Badge variant="outline" className="capitalize">
                    {session.session_type}
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(session.session_date), 'MMM d, yyyy')}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {session.summary && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {session.summary}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {session.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session.duration_minutes} min
                </span>
              )}
              {session.key_themes && session.key_themes.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {session.key_themes.length} themes
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
