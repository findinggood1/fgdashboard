import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ZoneBadgeProps {
  zone: string | null;
}

const zoneConfig: Record<string, { label: string; className: string }> = {
  exploring: {
    label: 'Exploring',
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
  discovering: {
    label: 'Discovering',
    className: 'bg-blue-500/15 text-blue-600 border-blue-500/20',
  },
  performing: {
    label: 'Performing',
    className: 'bg-amber-500/15 text-amber-600 border-amber-500/20',
  },
  owning: {
    label: 'Owning',
    className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
  },
};

export function ZoneBadge({ zone }: ZoneBadgeProps) {
  if (!zone) {
    return <span className="text-muted-foreground">—</span>;
  }

  const normalizedZone = zone.toLowerCase();
  const config = zoneConfig[normalizedZone];

  if (!config) {
    return (
      <Badge variant="outline" className="font-medium">
        {zone}
      </Badge>
    );
  }

  return (
    <Badge className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
