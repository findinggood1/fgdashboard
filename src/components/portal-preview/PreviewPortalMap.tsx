import { useEffect, useState } from 'react';
import { usePortalPreview } from './PortalPreviewContext';
import { supabase, Superpower, ZoneInterpretation, WeeklyAction } from '@/lib/supabase';
import { MoreLessMarker } from '@/hooks/useClientDetail';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MapPin, Heart, Sparkles, Target, Quote, Compass, TrendingUp, TrendingDown } from 'lucide-react';

const phaseLabels: Record<string, string> = {
  name: 'NAME (CLARITY)',
  validate: 'VALIDATE (CONFIDENCE)',
  communicate: 'COMMUNICATE (INFLUENCE)',
};

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
  weekly_actions: WeeklyAction[] | null;
  anchor_quote: string | null;
}

export default function PreviewPortalMap() {
  const previewContext = usePortalPreview();
  const clientEmail = previewContext?.clientEmail || '';
  
  const [engagement, setEngagement] = useState<ClientMapEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<MoreLessMarker[]>([]);

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
            weekly_actions, anchor_quote
          `)
          .eq('client_email', clientEmail)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;
        setEngagement(data);
      } catch (err) {
        console.error('Error fetching engagement:', err);
        setError('Unable to load the map.');
      } finally {
        setLoading(false);
      }
    }

    fetchEngagement();
  }, [clientEmail]);

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
              This client doesn't have an active coaching engagement yet.
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
          Narrative Integrity Map
        </h1>
        <p className="text-muted-foreground">
          Week {engagement.current_week} of 12 • <span className="font-medium">{phaseLabels[engagement.current_phase] || engagement.current_phase}</span> Phase
        </p>
      </div>

      {/* The Story */}
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

      {/* Zone */}
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

      {/* Superpowers */}
      {(engagement.superpowers_claimed?.length || engagement.superpowers_emerging?.length) && (
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Superpowers
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

      {/* Weekly Actions - Read Only in Preview */}
      {engagement.weekly_actions && engagement.weekly_actions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-medium text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            This Week's Actions
          </h2>
          <Card>
            <CardContent className="py-6 space-y-3">
              {engagement.weekly_actions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Checkbox
                    checked={action.status === 'completed'}
                    disabled
                    className="mt-0.5"
                  />
                  <span className={action.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                    {action.action}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
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
