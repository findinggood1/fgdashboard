import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Superpower, WorldAskingInsight, WeeklyAction, ZoneInterpretation } from '@/lib/supabase';
import { MoreLessMarker } from '@/hooks/useClientDetail';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, MapPin, Heart, Sparkles, Target, Flame, Quote, Compass, TrendingUp, TrendingDown, MessageCircle, Calendar, ChevronDown, CheckCircle2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Interface for weekly maps (client_map only)
interface ClientMapContent {
  story_summary?: string;
  zone_insight?: string;
  wins_this_week?: string[];
  focus_next_week?: string;
  reflection_prompt?: string;
}

interface WeeklyMapPublished {
  id: string;
  week_number: number;
  phase: string | null;
  client_map: ClientMapContent;
  published_at: string | null;
}

// Phase labels for display
const phaseLabels: Record<string, string> = {
  name: 'NAME (CLARITY)',
  validate: 'VALIDATE (CONFIDENCE)',
  communicate: 'COMMUNICATE (INFLUENCE)',
};

// Local interface for what we fetch from the DB
interface ClientMapEngagement {
  id: string;
  client_email: string;
  start_date: string;
  end_date: string | null;
  status: string;
  current_week: number;
  current_phase: string;
  story_present: string | null;
  story_past: string | null;
  story_potential: string | null;
  zone_interpretation: ZoneInterpretation | null;
  superpowers_claimed: Superpower[] | null;
  superpowers_emerging: Superpower[] | null;
  superpowers_hidden: Superpower[] | null;
  world_asking: WorldAskingInsight[] | string[] | null;
  weekly_tracking: string | null;
  weekly_creating: string | null;
  weekly_actions: WeeklyAction[] | null;
  fires_focus: any;
  focus: string | null;
  anchor_quote: string | null;
  ai_insights_generated_at: string | null;
}

export default function PortalMap() {
  const { user, clientData } = useAuth();
  
  const [engagement, setEngagement] = useState<ClientMapEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<MoreLessMarker[]>([]);
  const [togglingAction, setTogglingAction] = useState<number | null>(null);
  const [publishedMaps, setPublishedMaps] = useState<WeeklyMapPublished[]>([]);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const clientEmail = user?.email || '';

  // Fetch engagement when component mounts
  useEffect(() => {
    async function fetchEngagement() {
      if (!clientEmail) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('coaching_engagements')
          .select(`
            id, client_email, start_date, end_date, status,
            current_week, current_phase, story_present, story_past, story_potential,
            zone_interpretation, superpowers_claimed, superpowers_emerging, superpowers_hidden,
            world_asking, weekly_tracking, weekly_creating, weekly_actions,
            fires_focus, focus, anchor_quote, ai_insights_generated_at
          `)
          .eq('client_email', clientEmail)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;
        setEngagement(data);
      } catch (err) {
        console.error('Error fetching engagement:', err);
        setError('Unable to load your map. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchEngagement();
  }, [clientEmail]);

  // Fetch more_less_markers
  useEffect(() => {
    async function fetchMarkers() {
      if (!clientEmail) return;
      
      try {
        const { data, error } = await supabase
          .from('more_less_markers')
          .select('*')
          .eq('client_email', clientEmail)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMarkers(data || []);
      } catch (err) {
        console.error('Error fetching markers:', err);
      }
    }

    fetchMarkers();
  }, [clientEmail]);

  // Fetch published weekly maps
  useEffect(() => {
    async function fetchPublishedMaps() {
      if (!clientEmail) return;
      
      try {
        const { data, error } = await supabase
          .from('weekly_narrative_maps')
          .select('id, week_number, phase, client_map, published_at')
          .eq('client_email', clientEmail)
          .eq('status', 'published')
          .order('week_number', { ascending: false });

        if (error) throw error;
        setPublishedMaps(data || []);
        // Expand most recent week by default
        if (data && data.length > 0) {
          setExpandedWeek(data[0].week_number);
        }
      } catch (err) {
        console.error('Error fetching published maps:', err);
      }
    }

    fetchPublishedMaps();
  }, [clientEmail]);

  // Toggle weekly action status
  const handleToggleAction = async (index: number) => {
    if (!engagement) return;
    
    setTogglingAction(index);
    try {
      const updatedActions = [...(engagement.weekly_actions || [])];
      const action = updatedActions[index];
      const newStatus = action.status === 'completed' ? 'active' : 'completed';
      updatedActions[index] = { ...action, status: newStatus };
      
      const { error } = await supabase
        .from('coaching_engagements')
        .update({ weekly_actions: updatedActions })
        .eq('id', engagement.id);
      
      if (error) throw error;
      
      setEngagement({ ...engagement, weekly_actions: updatedActions });
      toast.success(newStatus === 'completed' ? 'Action completed!' : 'Action reopened');
    } catch (err) {
      console.error('Error toggling action:', err);
      toast.error('Failed to update action');
    } finally {
      setTogglingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              No Active Engagement
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              You don't have an active coaching engagement yet. Contact your coach to get started on your journey toward narrative integrity.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
          <MapPin className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">
          Your Narrative Integrity Map
        </h1>
        <p className="text-muted-foreground">
          Week {engagement.current_week} of 12 • <span className="font-medium">{phaseLabels[engagement.current_phase] || engagement.current_phase}</span> Phase
        </p>
      </div>

      {/* Weekly Reflections Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-medium text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Your Weekly Reflections
        </h2>
        
        {publishedMaps.length === 0 ? (
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
            <CardContent className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your coach will share weekly reflections here as your journey unfolds.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {publishedMaps.map((weekMap) => {
              const clientMap = weekMap.client_map || {};
              const isExpanded = expandedWeek === weekMap.week_number;
              
              return (
                <Collapsible 
                  key={weekMap.id} 
                  open={isExpanded}
                  onOpenChange={() => setExpandedWeek(isExpanded ? null : weekMap.week_number)}
                >
                  <Card className={isExpanded ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5' : ''}>
                    <CollapsibleTrigger asChild>
                      <CardContent className="py-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{weekMap.week_number}</span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Week {weekMap.week_number}</p>
                              <p className="text-xs text-muted-foreground">
                                {weekMap.phase ? phaseLabels[weekMap.phase] || weekMap.phase : 'Reflection'}
                                {weekMap.published_at && ` • ${format(new Date(weekMap.published_at), 'MMM d, yyyy')}`}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-6 space-y-5 border-t border-border/50">
                        {/* Story Summary */}
                        {clientMap.story_summary && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Story Summary</h4>
                            <p className="text-foreground">{clientMap.story_summary}</p>
                          </div>
                        )}
                        
                        {/* Zone Insight */}
                        {clientMap.zone_insight && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Zone Insight</h4>
                            <p className="text-foreground">{clientMap.zone_insight}</p>
                          </div>
                        )}
                        
                        {/* Wins This Week */}
                        {clientMap.wins_this_week && clientMap.wins_this_week.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              Wins This Week
                            </h4>
                            <ul className="space-y-2">
                              {clientMap.wins_this_week.map((win, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-foreground">
                                  <span className="text-emerald-600 mt-1">•</span>
                                  <span>{win}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Focus Next Week */}
                        {clientMap.focus_next_week && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                              <Target className="h-4 w-4 text-primary" />
                              Focus Next Week
                            </h4>
                            <p className="text-foreground">{clientMap.focus_next_week}</p>
                          </div>
                        )}
                        
                        {/* Reflection Prompt */}
                        {clientMap.reflection_prompt && (
                          <Card className="bg-primary/5 border-primary/10">
                            <CardContent className="py-4">
                              <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                Reflection Prompt
                              </h4>
                              <p className="text-foreground italic">"{clientMap.reflection_prompt}"</p>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </section>

      {/* The Story - 3Ps Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-medium text-foreground flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          The Story
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <StoryCard title="Present" content={engagement.story_present} />
          <StoryCard title="Past" content={engagement.story_past} />
          <StoryCard title="Potential" content={engagement.story_potential} />
        </div>
      </section>

      {/* Zone Section */}
      {engagement.zone_interpretation && (() => {
        const zoneData = engagement.zone_interpretation;
        const currentZone = zoneData.zone || zoneData.current_zone;
        
        if (!currentZone) return null;
        
        const zoneColors: Record<string, { bg: string; text: string }> = {
          'Performing': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700' },
          'Discovering': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700' },
          'Coasting': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700' },
          'Drifting': { bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-700' },
          'Owning': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700' },
        };
        
        const zoneKey = currentZone.charAt(0).toUpperCase() + currentZone.slice(1).toLowerCase();
        const colors = zoneColors[zoneKey] || zoneColors['Performing'];
        
        return (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-lg ${colors.bg}`}>
                  <Compass className={`h-6 w-6 ${colors.text}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Zone</p>
                  <p className={`text-xl font-serif font-medium ${colors.text}`}>{currentZone}</p>
                </div>
              </div>
              {zoneData.description && (
                <p className="mt-4 text-sm text-muted-foreground">{zoneData.description}</p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Superpowers Section */}
      {(engagement.superpowers_claimed?.length || engagement.superpowers_emerging?.length) && (
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Your Superpowers
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {engagement.superpowers_claimed && engagement.superpowers_claimed.length > 0 && (
              <Card>
                <CardContent className="py-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Claimed</h3>
                  <div className="flex flex-wrap gap-2">
                    {engagement.superpowers_claimed.map((sp, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {typeof sp === 'string' ? sp : sp.superpower}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {engagement.superpowers_emerging && engagement.superpowers_emerging.length > 0 && (
              <Card>
                <CardContent className="py-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Emerging</h3>
                  <div className="flex flex-wrap gap-2">
                    {engagement.superpowers_emerging.map((sp, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        {typeof sp === 'string' ? sp : sp.superpower}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* More/Less Markers */}
      {markers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-medium text-foreground">More / Less</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center gap-2 text-emerald-600 mb-4">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">More of</span>
                </div>
                <ul className="space-y-2">
                  {markers.filter(m => m.marker_type === 'more').map((marker) => (
                    <li key={marker.id} className="text-sm">{marker.marker_text}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center gap-2 text-rose-600 mb-4">
                  <TrendingDown className="h-5 w-5" />
                  <span className="font-medium">Less of</span>
                </div>
                <ul className="space-y-2">
                  {markers.filter(m => m.marker_type === 'less').map((marker) => (
                    <li key={marker.id} className="text-sm">{marker.marker_text}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Anchor Quote */}
      {engagement.anchor_quote && (
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="py-8 text-center">
            <Quote className="h-8 w-8 text-primary mx-auto mb-4" />
            <blockquote className="text-lg font-serif italic text-foreground max-w-2xl mx-auto">
              "{engagement.anchor_quote}"
            </blockquote>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StoryCard({ title, content }: { title: string; content: string | null }) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
      <CardContent className="py-6">
        <div className="flex items-center gap-2 mb-3">
          <Quote className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        </div>
        <p className={content ? 'text-foreground italic' : 'text-muted-foreground'}>
          {content ? `"${content}"` : 'Not yet defined'}
        </p>
      </CardContent>
    </Card>
  );
}
