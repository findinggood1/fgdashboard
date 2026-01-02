import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ToolTypeBadgeProps {
  toolType: string;
}

const toolLabels: Record<string, string> = {
  snapshot: 'Snapshot',
  impact: 'Impact',
  both: 'Both',
};

export function ToolTypeBadge({ toolType }: ToolTypeBadgeProps) {
  const label = toolLabels[toolType] || toolType;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium',
        toolType === 'both' && 'border-accent text-accent-foreground bg-accent/10',
        toolType === 'snapshot' && 'border-primary/50 text-primary bg-primary/5',
        toolType === 'impact' && 'border-secondary/50 text-secondary-foreground bg-secondary/10'
      )}
    >
      {label}
    </Badge>
  );
}
