import { useState, useEffect, useCallback } from 'react';
import { supabase, Event } from '@/lib/supabase';

interface EventWithEntries extends Event {
  entries_count: number;
}

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  totalEntries: number;
}

export function useEvents() {
  const [events, setEvents] = useState<EventWithEntries[]>([]);
  const [stats, setStats] = useState<EventStats>({ totalEvents: 0, activeEvents: 0, totalEntries: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch snapshot counts by event code
      const { data: snapshotCounts, error: snapshotError } = await supabase
        .from('snapshots')
        .select('id');

      if (snapshotError) throw snapshotError;

      // Fetch impact verification counts
      const { data: impactCounts, error: impactError } = await supabase
        .from('impact_verifications')
        .select('id');

      if (impactError) throw impactError;

      // For now, we'll count total entries across all events
      // In a real scenario, you'd have event_code on snapshots/impact_verifications
      const totalEntriesCount = (snapshotCounts?.length || 0) + (impactCounts?.length || 0);

      // Calculate entries per event (placeholder - would need event_code in actual tables)
      const eventsWithEntries: EventWithEntries[] = (eventsData || []).map(event => ({
        ...event,
        entries_count: 0, // This would be calculated based on event_code matching
      }));

      // Calculate stats
      const now = new Date();
      const activeCount = eventsWithEntries.filter(e => 
        e.is_active && (!e.expires_at || new Date(e.expires_at) > now)
      ).length;

      setEvents(eventsWithEntries);
      setStats({
        totalEvents: eventsWithEntries.length,
        activeEvents: activeCount,
        totalEntries: totalEntriesCount,
      });
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;
    await fetchEvents();
    return data;
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchEvents();
    return data;
  };

  const deactivateEvent = async (id: string) => {
    const { error } = await supabase
      .from('events')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    await fetchEvents();
  };

  return {
    events,
    stats,
    loading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deactivateEvent,
  };
}
