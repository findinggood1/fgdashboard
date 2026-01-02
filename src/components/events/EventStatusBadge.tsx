import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventStatusBadgeProps {
  isActive: boolean;
  expiresAt: string | null;
}

export function EventStatusBadge({ isActive, expiresAt }: EventStatusBadgeProps) {
  const now = new Date();
  const isExpired = expiresAt && new Date(expiresAt) < now;

  if (isExpired) {
    return (
      <Badge className={cn('bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/20')}>
        Expired
      </Badge>
    );
  }

  if (!isActive) {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        Inactive
      </Badge>
    );
  }

  return (
    <Badge className={cn('bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20')}>
      Active
    </Badge>
  );
}
