import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientStatus } from '@/lib/supabase';
import { Check, Clock, XCircle, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientStatusBadgeProps {
  status: ClientStatus;
  editable?: boolean;
  onStatusChange?: (newStatus: ClientStatus) => Promise<void>;
}

const statusConfig: Record<ClientStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  },
  approved: {
    label: 'Approved',
    icon: Check,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  inactive: {
    label: 'Inactive',
    icon: XCircle,
    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
  deleted: {
    label: 'Deleted',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
};

export function ClientStatusBadge({ status, editable = false, onStatusChange }: ClientStatusBadgeProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const handleStatusChange = async (newStatus: ClientStatus) => {
    if (!onStatusChange || newStatus === status) return;
    
    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium',
        config.className,
        editable && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
    >
      {isUpdating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      {config.label}
      {editable && !isUpdating && <ChevronDown className="h-3 w-3 ml-0.5" />}
    </Badge>
  );

  if (!editable || !onStatusChange) {
    return badge;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isUpdating}>
        {badge}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(['pending', 'approved', 'inactive'] as ClientStatus[]).map((statusOption) => {
          const optionConfig = statusConfig[statusOption];
          const OptionIcon = optionConfig.icon;
          return (
            <DropdownMenuItem
              key={statusOption}
              onClick={() => handleStatusChange(statusOption)}
              className={cn(
                'gap-2',
                statusOption === status && 'bg-muted'
              )}
            >
              <OptionIcon className="h-4 w-4" />
              {optionConfig.label}
              {statusOption === status && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
