import { useNavigate } from 'react-router-dom';
import { Client, ClientStatus, CoachingEngagement } from '@/lib/supabase';
import { Snapshot } from '@/hooks/useClientDetail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoneBadge } from '@/components/clients/ZoneBadge';
import { ClientStatusBadge } from '@/components/clients/ClientStatusBadge';
import { Plus, FileText, Upload, Rocket, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientDetailHeaderProps {
  client: Client;
  engagement: CoachingEngagement | null;
  latestSnapshot: Snapshot | null;
  onAddNote: () => void;
  onAddSession: () => void;
  onUploadFile: () => void;
  onStartEngagement: () => void;
  onStatusChange?: (status: ClientStatus) => Promise<void>;
  onDelete?: () => void;
}

const phaseColors: Record<string, string> = {
  NAME: 'bg-[#5B8C5A] text-white',
  VALIDATE: 'bg-[#D4A84B] text-white',
  COMMUNICATE: 'bg-[#7B68A6] text-white',
};

const phaseLabels: Record<string, string> = {
  NAME: 'NAME (CLARITY)',
  VALIDATE: 'VALIDATE (CONFIDENCE)',
  COMMUNICATE: 'COMMUNICATE (INFLUENCE)',
};

export function ClientDetailHeader({
  client,
  engagement,
  latestSnapshot,
  onAddNote,
  onAddSession,
  onUploadFile,
  onStartEngagement,
  onStatusChange,
  onDelete,
}: ClientDetailHeaderProps) {
  const navigate = useNavigate();

  const getEngagementLabel = () => {
    if (!engagement) return null;
    const phase = engagement.current_phase?.toUpperCase() || 'UNKNOWN';
    const week = engagement.current_week || 1;
    const phaseDisplay = phaseLabels[phase] || phase;
    return `${phaseDisplay} - Week ${week} of 12`;
  };

  const handleEngagementClick = () => {
    if (engagement?.id) {
      navigate(`/engagements/${engagement.id}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Name and email */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-serif font-semibold">
              {client.name || client.email}
            </h1>
            <ClientStatusBadge
              status={client.status as ClientStatus}
              editable={!!onStatusChange}
              onStatusChange={onStatusChange}
            />
          </div>
          {client.name && (
            <p className="text-muted-foreground">{client.email}</p>
          )}
          {client.phone && (
            <p className="text-muted-foreground text-sm">{client.phone}</p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {engagement ? (
            <Badge
              className={cn(
                'cursor-pointer text-sm px-3 py-1',
                phaseColors[engagement.current_phase?.toUpperCase() || ''] || 'bg-primary'
              )}
              onClick={handleEngagementClick}
            >
              {getEngagementLabel()}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              No active engagement
            </Badge>
          )}
          <ZoneBadge zone={latestSnapshot?.overall_zone || null} />
        </div>
      </div>

      {/* Client notes */}
      {client.notes && (
        <p className="text-sm text-muted-foreground italic bg-muted/50 rounded-lg p-3">
          {client.notes}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onAddNote}>
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
        <Button variant="outline" size="sm" onClick={onAddSession}>
          <FileText className="h-4 w-4 mr-1" />
          Add Session
        </Button>
        <Button variant="outline" size="sm" onClick={onUploadFile}>
          <Upload className="h-4 w-4 mr-1" />
          Upload File
        </Button>
        {!engagement && (
          <Button variant="secondary" size="sm" onClick={onStartEngagement}>
            <Rocket className="h-4 w-4 mr-1" />
            Start Engagement
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
