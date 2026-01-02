import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/lib/supabase';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Calendar, Users, BarChart3, Pencil, Power } from 'lucide-react';
import { EventFormModal } from '@/components/events/EventFormModal';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { ToolTypeBadge } from '@/components/events/ToolTypeBadge';
import { DeactivateEventDialog } from '@/components/events/DeactivateEventDialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function Events() {
  const { userRole } = useAuth();
  const { events, stats, loading, createEvent, updateEvent, deactivateEvent } = useEvents();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [eventToDeactivate, setEventToDeactivate] = useState<Event | null>(null);

  // Only admins can access this page
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.code.toLowerCase().includes(query) ||
        event.name.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

  const handleCreateEvent = async (data: Omit<Event, 'id' | 'created_at'>) => {
    await createEvent(data);
    toast({
      title: 'Event created',
      description: `Event ${data.code} has been created successfully.`,
    });
  };

  const handleUpdateEvent = async (data: Omit<Event, 'id' | 'created_at'>) => {
    if (!editingEvent) return;
    await updateEvent(editingEvent.id, data);
    toast({
      title: 'Event updated',
      description: `Event ${data.code} has been updated successfully.`,
    });
  };

  const handleDeactivate = async () => {
    if (!eventToDeactivate) return;
    await deactivateEvent(eventToDeactivate.id);
    toast({
      title: 'Event deactivated',
      description: `Event ${eventToDeactivate.code} has been deactivated.`,
    });
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormModalOpen(true);
  };

  const openDeactivateDialog = (event: Event) => {
    setEventToDeactivate(event);
    setDeactivateDialogOpen(true);
  };

  const formatExpiration = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never';
    return format(new Date(expiresAt), 'MMM d, yyyy');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold">Events</h1>
          <p className="text-muted-foreground mt-1">Manage workshops and assessment events</p>
        </div>
        <Button className="gradient-primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Events
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.activeEvents}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Event Entries
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or name..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Events Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif">All Events</CardTitle>
          <CardDescription>View and manage your events</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No events match your search' : 'No events yet'}
              </p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Try a different search term' : 'Create your first event to get started'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Entries</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono font-medium">
                        {event.code}
                      </TableCell>
                      <TableCell>{event.name}</TableCell>
                      <TableCell>
                        <ToolTypeBadge toolType={event.tool_type} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatExpiration(event.expires_at)}
                      </TableCell>
                      <TableCell>
                        <EventStatusBadge 
                          isActive={event.is_active} 
                          expiresAt={event.expires_at} 
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {event.entries_count}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(event)}
                            title="Edit event"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {event.is_active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeactivateDialog(event)}
                              title="Deactivate event"
                              className="text-destructive hover:text-destructive"
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <EventFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        event={editingEvent}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
      />

      {/* Deactivate Confirmation Dialog */}
      <DeactivateEventDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        eventCode={eventToDeactivate?.code || ''}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
