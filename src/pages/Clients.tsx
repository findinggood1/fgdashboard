import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useClients, ClientWithDetails } from '@/hooks/useClients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Search, Plus, Users, ChevronRight } from 'lucide-react';
import { ZoneBadge } from '@/components/clients/ZoneBadge';
import { AddClientModal } from '@/components/clients/AddClientModal';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type ZoneFilter = 'all' | 'exploring' | 'discovering' | 'performing' | 'owning';
type EngagementFilter = 'all' | 'active' | 'none' | 'completed';

const phaseLabels: Record<string, string> = {
  name: 'NAME (CLARITY)',
  validate: 'VALIDATE (CONFIDENCE)',
  communicate: 'COMMUNICATE (INFLUENCE)',
};
type SortOption = 'last_activity' | 'name' | 'zone';

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
  const { clients, loading, addClient } = useClients();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all');
  const [engagementFilter, setEngagementFilter] = useState<EngagementFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('last_activity');
  const [addModalOpen, setAddModalOpen] = useState(false);

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
      } else {
        // Zone sorting: Owning > Performing > Discovering > Exploring > null
        const zoneOrder = { owning: 4, performing: 3, discovering: 2, exploring: 1 };
        const aOrder = a.overall_zone ? zoneOrder[a.overall_zone.toLowerCase() as keyof typeof zoneOrder] || 0 : 0;
        const bOrder = b.overall_zone ? zoneOrder[b.overall_zone.toLowerCase() as keyof typeof zoneOrder] || 0 : 0;
        return bOrder - aOrder;
      }
    });

    return result;
  }, [clients, debouncedSearch, zoneFilter, engagementFilter, sortBy]);

  const handleAddClient = async (email: string, name?: string) => {
    await addClient(email, name);
    toast({
      title: 'Client added',
      description: `${name || email} has been added to your roster.`,
    });
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
          <p className="font-medium text-foreground truncate">
            {client.name || <span className="text-muted-foreground italic">No name</span>}
          </p>
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

        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
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
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
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
              <SelectItem value="zone">Zone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Growth Area</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleClientClick(client.email)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleClientClick(client.email)}
                    >
                      <TableCell className="font-medium">
                        {client.name || <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatLastActivity(client.last_activity)}
                      </TableCell>
                      <TableCell>
                        <span className={client.engagement_status === 'active' ? 'font-medium text-primary' : 'text-muted-foreground'}>
                          {formatEngagement(client)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ZoneBadge zone={client.overall_zone} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.growth_opportunity_category || '—'}
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
