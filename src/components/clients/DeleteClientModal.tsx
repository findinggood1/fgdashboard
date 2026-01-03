import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase, Client } from '@/lib/supabase';

interface DeleteClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onDeleted: () => void;
}

interface ImpactSummary {
  engagements: number;
  snapshots: number;
  sessions: number;
  loading: boolean;
}

export function DeleteClientModal({ open, onOpenChange, client, onDeleted }: DeleteClientModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [impact, setImpact] = useState<ImpactSummary>({ engagements: 0, snapshots: 0, sessions: 0, loading: true });

  useEffect(() => {
    if (!open || !client) {
      setImpact({ engagements: 0, snapshots: 0, sessions: 0, loading: true });
      return;
    }

    const fetchImpact = async () => {
      try {
        const [engagementsRes, snapshotsRes, sessionsRes] = await Promise.all([
          supabase.from('coaching_engagements').select('id', { count: 'exact', head: true }).eq('client_email', client.email),
          supabase.from('snapshots').select('id', { count: 'exact', head: true }).eq('client_email', client.email),
          supabase.from('session_transcripts').select('id', { count: 'exact', head: true }).eq('client_email', client.email),
        ]);

        setImpact({
          engagements: engagementsRes.count || 0,
          snapshots: snapshotsRes.count || 0,
          sessions: sessionsRes.count || 0,
          loading: false,
        });
      } catch (err) {
        console.error('Error fetching impact:', err);
        setImpact((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchImpact();
  }, [open, client]);

  const hasRelatedData = impact.engagements > 0 || impact.snapshots > 0 || impact.sessions > 0;

  const handleDelete = async () => {
    if (!client) return;

    setDeleting(true);
    try {
      // Soft delete - set status to 'deleted'
      const { error } = await supabase
        .from('clients')
        .update({ status: 'deleted' })
        .eq('id', client.id);

      if (error) throw error;

      onDeleted();
      onOpenChange(false);
    } catch (err) {
      console.error('Error deleting client:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Client
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to delete <strong>{client?.name || client?.email}</strong>?
              </p>

              {impact.loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking related data...
                </div>
              ) : hasRelatedData ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-400 mb-2">
                    This client has related data:
                  </p>
                  <ul className="list-disc list-inside text-amber-700 dark:text-amber-500 space-y-1">
                    {impact.engagements > 0 && (
                      <li>{impact.engagements} coaching engagement{impact.engagements > 1 ? 's' : ''}</li>
                    )}
                    {impact.snapshots > 0 && (
                      <li>{impact.snapshots} snapshot{impact.snapshots > 1 ? 's' : ''}</li>
                    )}
                    {impact.sessions > 0 && (
                      <li>{impact.sessions} session{impact.sessions > 1 ? 's' : ''}</li>
                    )}
                  </ul>
                  <p className="mt-2 text-amber-600 dark:text-amber-500">
                    The client will be marked as deleted but their data will be preserved.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  This client has no related data. They will be marked as deleted.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting || impact.loading}>
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Client'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
