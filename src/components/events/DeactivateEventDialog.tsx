import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeactivateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventCode: string;
  onConfirm: () => Promise<void>;
}

export function DeactivateEventDialog({ 
  open, 
  onOpenChange, 
  eventCode, 
  onConfirm 
}: DeactivateEventDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate event {eventCode}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will prevent new participants from accessing this event. 
            Existing data will not be affected. You can reactivate the event later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
