import { useState } from 'react';
import { Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function RecordMemoButton() {
  const [isRecording, setIsRecording] = useState(false);

  const handleClick = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.info('Recording stopped');
    } else {
      setIsRecording(true);
      toast.info('Recording started... (feature coming soon)');
    }
  };

  return (
    <Button
      onClick={handleClick}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all duration-300',
        isRecording 
          ? 'bg-destructive hover:bg-destructive/90 animate-pulse-soft' 
          : 'gradient-primary hover:opacity-90'
      )}
    >
      {isRecording ? (
        <X className="h-6 w-6" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
    </Button>
  );
}
