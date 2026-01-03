import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useClients, ClientWithDetails } from '@/hooks/useClients';
import { ClientStatus } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Users, ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ZoneBadge } from '@/components/clients/ZoneBadge';
import { ClientStatusBadge } from '@/components/clients/ClientStatusBadge';
import { AddClientModal } from '@/components/clients/AddClientModal';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type ZoneFilter = 'all' | 'exploring' | 'discovering' | 'performing' | 'owning';
type EngagementFilter = 'all' | 'active' | 'none' | 'completed';
type StatusFilter = 'all' | 'pending' | 'approved' | 'inactive';

const phaseLabels: Record<string, string> = {
  name: 'NAME (CLARITY)',
  validate: 'VALIDATE (CONFIDENCE)',
  communicate: 'COMMUNICATE (INFLUENCE)',
};
type SortOption = 'last_activity' | 'name' | 'zone' | 'status';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  });

  // Update immediately for now, debounce can be added later if needed
  return value;
}

export default function Clients() {
  const navigate = useNavigate();
  const { clients, loading, addClient, updateClientStatus, bulkUpdateStatus } = useClients();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all');
  const [engagementFilter, setEngagementFilter] = useState<EngagementFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('last_activity');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredAndSortedClients = useMemo(() => {
    let result = [...clients];

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (client) =>
          client.name?.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query)
      );
    }

    // Zone filter
    if (zoneFilter !== 'all') {
      result = result.filter(
        (client) => client.overall_zone?.toLowerCase() === zoneFilter
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((client) => client.status === statusFilter);
    }

    // Engagement filter
    if (engagementFilter !== 'all') {
      result = result.filter((client) => {
        if (engagementFilter === 'active') {
          return client.engagement_status === 'active';
        } else if (engagementFilter === 'completed') {
          return client.engagement_status === 'completed';
        } else {
          return !client.engagement_status;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'last_activity') {
        const aDate = a.last_activity ? new Date(a.last_activity).getTime() : 0;
        const bDate = b.last_activity ? new Date(b.last_activity).getTime() : 0;
        return bDate - aDate;
      } else if (sortBy === 'name') {
        const aName = a.name || a.email;
        const bName = b.name || b.email;
        return aName.localeCompare(bName);
      } else if (sortBy === 'status') {
        const statusOrder = { pending: 1, approved: 2, inactive: 3 };
        const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 4;
        const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 4;
        return aOrder - bOrder;
      } else {
        // Zone sorting: Owning > Performing > Discovering > Exploring > null
        const zoneOrder = { owning: 4, performing: 3, discovering: 2, exploring: 1 };
        const aOrder = a.overall_zone ? zoneOrder[a.overall_zone.toLowerCase() as keyof typeof zoneOrder] || 0 : 0;
        const bOrder = b.overall_zone ? zoneOrder[b.overall_zone.toLowerCase() as keyof typeof zoneOrder] || 0 : 0;
        return bOrder - aOrder;
      }
    });

    return result;
  }, [clients, debouncedSearch, zoneFilter, statusFilter, engagementFilter, sortBy]);

  const handleAddClient = async (data: { email: string; name: string; phone?: string; notes?: string }) => {
    await addClient(data);
    toast({
      title: 'Client added',
      description: `${data.name || data.email} has been added to your roster.`,
    });
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await bulkUpdateStatus(Array.from(selectedIds), 'approved');
      toast({ title: 'Clients approved', description: `${selectedIds.size} client(s) approved.` });
      setSelectedIds(new Set());
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to approve clients.', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await bulkUpdateStatus(Array.from(selectedIds), 'inactive');
      toast({ title: 'Clients deactivated', description: `${selectedIds.size} client(s) deactivated.` });
      setSelectedIds(new Set());
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to deactivate clients.', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedClients.map((c) => c.id)));
    }
  };

  const formatLastActivity = (date: string | null) => {
    if (!date) return '—';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const formatEngagement = (client: ClientWithDetails) => {
    if (!client.engagement_status) return 'None';
    if (client.engagement_status === 'completed') return 'Completed';
    if (client.engagement_phase && client.engagement_week !== null) {
      const phaseKey = client.engagement_phase.toLowerCase();
      const phaseDisplay = phaseLabels[phaseKey] || client.engagement_phase;
      return `${phaseDisplay} - Week ${client.engagement_week}`;
    }
    return client.engagement_status;
  };

  const handleClientClick = useCallback((email: string) => {
    navigate(`/clients/${encodeURIComponent(email)}`);
  }, [navigate]);

  // Mobile card view
  const MobileClientCard = ({ client }: { client: ClientWithDetails }) => (
    <div
      className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer"
      onClick={() => handleClientClick(client.email)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClientClick(client.email)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground truncate">
              {client.name || <span className="text-muted-foreground italic">No name</span>}
            </p>
            <ClientStatusBadge status={client.status as ClientStatus} />
          </div>
          <p className="text-sm text-muted-foreground truncate">{client.email}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
      
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ZoneBadge zone={client.overall_zone} />
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          client.engagement_status === 'active' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-muted text-muted-foreground'
        )}>
          {client.engagement_status === 'active' ? 'Active' : 'No Engagement'}
        </span>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Last activity: {formatLastActivity(client.last_activity)}
      </p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your coaching clients</p>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => setAddModalOpen(true)}
          className="min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10 min-h-[44px] text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search clients"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 sm:flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="min-h-[44px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={zoneFilter} onValueChange={(v) => setZoneFilter(v as ZoneFilter)}>
            <SelectTrigger className="min-h-[44px]" aria-label="Filter by zone">
              <SelectValue placeholder="Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="exploring">Exploring</SelectItem>
              <SelectItem value="discovering">Discovering</SelectItem>
              <SelectItem value="performing">Performing</SelectItem>
              <SelectItem value="owning">Owning</SelectItem>
            </SelectContent>
          </Select>

          <Select value={engagementFilter} onValueChange={(v) => setEngagementFilter(v as EngagementFilter)}>
            <SelectTrigger className="min-h-[44px]" aria-label="Filter by engagement">
              <SelectValue placeholder="Engagement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Engagements</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="min-h-[44px]" aria-label="Sort by">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_activity">Activity</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="zone">Zone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkApprove}
            disabled={bulkLoading}
            className="gap-1.5"
          >
            {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkDeactivate}
            disabled={bulkLoading}
            className="gap-1.5"
          >
            {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Deactivate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Clients List */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-serif">All Clients</CardTitle>
              <CardDescription>
                {loading
                  ? 'Loading...'
                  : `Showing ${filteredAndSortedClients.length} of ${clients.length} clients`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium text-foreground">No clients yet</p>
              <p className="text-sm mt-1 text-center max-w-md">
                Clients appear here when they complete their first Snapshot or Impact entry.
              </p>
              <Button 
                onClick={() => setAddModalOpen(true)} 
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          ) : filteredAndSortedClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium text-foreground">No clients match your filters</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setZoneFilter('all');
                  setStatusFilter('all');
                  setEngagementFilter('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : isMobile ? (
            // Mobile: Card view
            <div className="space-y-3">
              {filteredAndSortedClients.map((client) => (
                <MobileClientCard key={client.id} client={client} />
              ))}
            </div>
          ) : (
            // Desktop: Table view with horizontal scroll
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === filteredAndSortedClients.length && filteredAndSortedClients.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Zone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedIds.has(client.id) && "bg-muted/30"
                      )}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(client.id)}
                          onCheckedChange={() => toggleSelection(client.id)}
                          aria-label={`Select ${client.name || client.email}`}
                        />
                      </TableCell>
                      <TableCell 
                        className="font-medium"
                        onClick={() => handleClientClick(client.email)}
                      >
                        {client.name || <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell 
                        className="text-muted-foreground"
                        onClick={() => handleClientClick(client.email)}
                      >
                        {client.email}
                      </TableCell>
                      <TableCell onClick={() => handleClientClick(client.email)}>
                        <ClientStatusBadge status={client.status as ClientStatus} />
                      </TableCell>
                      <TableCell 
                        className="text-muted-foreground"
                        onClick={() => handleClientClick(client.email)}
                      >
                        {formatLastActivity(client.last_activity)}
                      </TableCell>
                      <TableCell onClick={() => handleClientClick(client.email)}>
                        <span className={client.engagement_status === 'active' ? 'font-medium text-primary' : 'text-muted-foreground'}>
                          {formatEngagement(client)}
                        </span>
                      </TableCell>
                      <TableCell onClick={() => handleClientClick(client.email)}>
                        <ZoneBadge zone={client.overall_zone} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      <AddClientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSubmit={handleAddClient}
      />
    </div>
  );
}
