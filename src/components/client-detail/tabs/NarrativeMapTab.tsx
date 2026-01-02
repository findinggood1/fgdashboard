import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sparkles, Loader2, ChevronDown, Flame, Sprout } from 'lucide-react';
import { supabase, ZoneInterpretation, Superpower } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Snapshot } from '@/hooks/useClientDetail';

interface ZoneDefault {
  id: string;
  zone_name: string;
  headline: string;
  description: string;
  the_work: string;
}

interface NarrativeMapTabProps {
  engagement: {
    id: string;
    status: string;
    ai_insights_generated_at?: string | null;
    story_present?: string | null;
    story_past?: string | null;
    story_potential?: string | null;
    zone_interpretation?: ZoneInterpretation | null;
    superpowers_claimed?: Superpower[] | null;
    superpowers_emerging?: Superpower[] | null;
    superpowers_hidden?: Superpower[] | null;
  } | null;
  clientName?: string;
  latestSnapshot?: Snapshot | null;
  refetch: () => void;
}

const firesColors: Record<string, { bg: string; text: string }> = {
  feelings: { bg: 'bg-rose-500/10', text: 'text-rose-600' },
  influence: { bg: 'bg-violet-500/10', text: 'text-violet-600' },
  resilience: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  ethics: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  strengths: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
};

function SuperpowerCard({ superpower }: { superpower: Superpower }) {
  const [isOpen, setIsOpen] = useState(false);
  const firesStyle = firesColors[superpower.fires_element] || firesColors.strengths;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{superpower.superpower}</span>
            <Badge variant="outline" className={`${firesStyle.bg} ${firesStyle.text} capitalize text-xs`}>
              {superpower.fires_element}
            </Badge>
            {superpower.source && (
              <Badge variant="secondary" className="text-xs text-muted-foreground">
                {superpower.source}
              </Badge>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="pt-3 space-y-2 border-l-2 border-primary/20 pl-4 ml-2">
          <p className="text-sm text-foreground">{superpower.description}</p>
          {superpower.evidence && superpower.evidence.length > 0 && (
            <ul className="text-sm text-muted-foreground space-y-1">
              {superpower.evidence.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SuperpowersSection({ 
  title, 
  icon, 
  subtitle, 
  superpowers, 
  emptyLabel 
}: { 
  title: string; 
  icon: React.ReactNode; 
  subtitle: string; 
  superpowers: Superpower[] | null | undefined; 
  emptyLabel: string;
}) {
  const items = superpowers || [];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((sp, idx) => (
            <SuperpowerCard key={idx} superpower={sp} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic py-2">
          No {emptyLabel} superpowers yet. Click Generate Insights or add manually.
        </p>
      )}
    </div>
  );
}

const zoneColors: Record<string, { bg: string; text: string; border: string }> = {
  exploring: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted-foreground/30' },
  discovering: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' },
  performing: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30' },
  owning: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' },
};

export function NarrativeMapTab({ engagement, clientName, latestSnapshot, refetch }: NarrativeMapTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyPresent, setStoryPresent] = useState(engagement?.story_present || '');
  const [storyPast, setStoryPast] = useState(engagement?.story_past || '');
  const [storyPotential, setStoryPotential] = useState(engagement?.story_potential || '');
  const [customNote, setCustomNote] = useState(engagement?.zone_interpretation?.custom_note || '');
  const [saving, setSaving] = useState<string | null>(null);
  const [zoneDefaults, setZoneDefaults] = useState<ZoneDefault[]>([]);
  const { toast } = useToast();

  const hasActiveEngagement = engagement?.status === 'active';

  // Fetch zone defaults
  useEffect(() => {
    async function fetchZoneDefaults() {
      const { data, error } = await supabase
        .from('zone_defaults')
        .select('*');
      
      if (error) {
        console.error('Error fetching zone defaults:', error);
        return;
      }
      setZoneDefaults(data || []);
    }
    fetchZoneDefaults();
  }, []);

  useEffect(() => {
    setStoryPresent(engagement?.story_present || '');
    setStoryPast(engagement?.story_past || '');
    setStoryPotential(engagement?.story_potential || '');
    setCustomNote(engagement?.zone_interpretation?.custom_note || '');
  }, [engagement?.story_present, engagement?.story_past, engagement?.story_potential, engagement?.zone_interpretation?.custom_note]);

  // Determine current zone from snapshot or zone_interpretation
  const currentZone = (latestSnapshot?.overall_zone?.toLowerCase() || engagement?.zone_interpretation?.zone || 'exploring') as string;
  const zoneDefault = zoneDefaults.find(z => z.zone_name === currentZone);
  const zoneStyle = zoneColors[currentZone] || zoneColors.exploring;

  const handleSaveStory = async (field: 'story_present' | 'story_past' | 'story_potential', value: string) => {
    if (!engagement?.id) return;
    
    const originalValue = field === 'story_present' ? engagement.story_present :
                          field === 'story_past' ? engagement.story_past :
                          engagement.story_potential;
    
    if (value === (originalValue || '')) return;

    setSaving(field);
    try {
      const { error } = await supabase
        .from('coaching_engagements')
        .update({ [field]: value })
        .eq('id', engagement.id);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error saving story:', error);
      toast({
        title: 'Failed to save',
        description: 'Could not save your changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveCustomNote = async () => {
    if (!engagement?.id) return;
    
    const originalNote = engagement?.zone_interpretation?.custom_note || '';
    if (customNote === originalNote) return;

    setSaving('custom_note');
    try {
      const updatedZoneInterpretation: ZoneInterpretation = {
        ...(engagement.zone_interpretation || {}),
        custom_note: customNote,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('coaching_engagements')
        .update({ zone_interpretation: updatedZoneInterpretation })
        .eq('id', engagement.id);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error saving custom note:', error);
      toast({
        title: 'Failed to save',
        description: 'Could not save your changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleGenerateInsights = async () => {
    if (!engagement?.id) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-narrative-map', {
        body: { engagementId: engagement.id }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate insights');
      }

      if (data?.error) {
        console.error('API error:', data.error);
        throw new Error(data.error);
      }

      toast({
        title: 'Narrative Map insights generated!',
        description: 'The AI has analyzed client data and updated the map.',
      });

      refetch();
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: 'Failed to generate insights',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasActiveEngagement) {
    return (
      <div className="mt-6">
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground text-center">
              Start an engagement to build this client's Narrative Map.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* The Story We're Strengthening */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">The Story We're Strengthening</CardTitle>
          <CardDescription>
            Capture the client's narrative in their own voice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PRESENT Card */}
            <div className="bg-background rounded-lg p-4 border border-primary/20 shadow-sm">
              <div className="mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Present</span>
                <p className="text-xs text-muted-foreground">Where I am now</p>
              </div>
              <Textarea
                value={storyPresent}
                onChange={(e) => setStoryPresent(e.target.value)}
                onBlur={() => handleSaveStory('story_present', storyPresent)}
                placeholder="Write in first person: 'I'm ready to...'"
                className="min-h-[120px] resize-none border-primary/20 focus:border-primary"
                disabled={saving === 'story_present'}
              />
              {saving === 'story_present' && (
                <p className="text-xs text-muted-foreground mt-1">Saving...</p>
              )}
            </div>

            {/* PAST Card */}
            <div className="bg-background rounded-lg p-4 border border-primary/20 shadow-sm">
              <div className="mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Past</span>
                <p className="text-xs text-muted-foreground">What brought me here</p>
              </div>
              <Textarea
                value={storyPast}
                onChange={(e) => setStoryPast(e.target.value)}
                onBlur={() => handleSaveStory('story_past', storyPast)}
                placeholder="Write in first person: 'Years of...'"
                className="min-h-[120px] resize-none border-primary/20 focus:border-primary"
                disabled={saving === 'story_past'}
              />
              {saving === 'story_past' && (
                <p className="text-xs text-muted-foreground mt-1">Saving...</p>
              )}
            </div>

            {/* POTENTIAL Card */}
            <div className="bg-background rounded-lg p-4 border border-primary/20 shadow-sm">
              <div className="mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Potential</span>
                <p className="text-xs text-muted-foreground">Where I'm going</p>
              </div>
              <Textarea
                value={storyPotential}
                onChange={(e) => setStoryPotential(e.target.value)}
                onBlur={() => handleSaveStory('story_potential', storyPotential)}
                placeholder="Write in first person: 'A life where...'"
                className="min-h-[120px] resize-none border-primary/20 focus:border-primary"
                disabled={saving === 'story_potential'}
              />
              {saving === 'story_potential' && (
                <p className="text-xs text-muted-foreground mt-1">Saving...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Position */}
      <Card className={`${zoneStyle.bg} ${zoneStyle.border} border`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className={`text-2xl font-bold uppercase ${zoneStyle.text}`}>
              {currentZone.toUpperCase()}
            </CardTitle>
            {zoneDefault?.headline && (
              <Badge variant="outline" className={`${zoneStyle.text} ${zoneStyle.border} w-fit`}>
                {zoneDefault.headline}
              </Badge>
            )}
          </div>
          <CardDescription>Current Position</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {zoneDefault?.description && (
            <p className="text-foreground">{zoneDefault.description}</p>
          )}
          
          {zoneDefault?.the_work && (
            <div>
              <span className="font-semibold text-sm uppercase tracking-wide">The Work:</span>
              <p className="text-foreground mt-1">{zoneDefault.the_work}</p>
            </div>
          )}

          <div className="pt-4 border-t border-border/50">
            <span className="font-semibold text-sm">
              For {clientName || 'this client'}:
            </span>
            <Textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              onBlur={handleSaveCustomNote}
              placeholder="Add personalized interpretation for this client..."
              className="mt-2 min-h-[80px] resize-none bg-background/50"
              disabled={saving === 'custom_note'}
            />
            {saving === 'custom_note' && (
              <p className="text-xs text-muted-foreground mt-1">Saving...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Your FIRES Superpowers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Your FIRES Superpowers
          </CardTitle>
          <CardDescription>
            Strengths identified through coaching sessions and AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SuperpowersSection
            title="SUPERPOWERS CLAIMED"
            icon={<span className="text-lg">🔥</span>}
            subtitle="What you know and own"
            superpowers={engagement?.superpowers_claimed}
            emptyLabel="claimed"
          />
          
          <SuperpowersSection
            title="SUPERPOWERS EMERGING"
            icon={<span className="text-lg">🌱</span>}
            subtitle="What you're building confidence in"
            superpowers={engagement?.superpowers_emerging}
            emptyLabel="emerging"
          />
          
          <SuperpowersSection
            title="SUPERPOWERS HIDDEN"
            icon={<span className="text-lg">✨</span>}
            subtitle="What's in the data but unclaimed"
            superpowers={engagement?.superpowers_hidden}
            emptyLabel="hidden"
          />
        </CardContent>
      </Card>

      {/* Generate Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Generate AI-powered analysis of client data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2">
            <Button 
              onClick={handleGenerateInsights} 
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              {engagement?.ai_insights_generated_at
                ? `Last generated: ${format(new Date(engagement.ai_insights_generated_at), 'MMM d, yyyy h:mm a')}`
                : 'No AI insights generated yet'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
