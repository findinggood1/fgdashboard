import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface NarrativeMapTabProps {
  engagement: {
    id: string;
    status: string;
    ai_insights_generated_at?: string | null;
    story_present?: string | null;
    story_past?: string | null;
    story_potential?: string | null;
  } | null;
  refetch: () => void;
}

export function NarrativeMapTab({ engagement, refetch }: NarrativeMapTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyPresent, setStoryPresent] = useState(engagement?.story_present || '');
  const [storyPast, setStoryPast] = useState(engagement?.story_past || '');
  const [storyPotential, setStoryPotential] = useState(engagement?.story_potential || '');
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const hasActiveEngagement = engagement?.status === 'active';

  useEffect(() => {
    setStoryPresent(engagement?.story_present || '');
    setStoryPast(engagement?.story_past || '');
    setStoryPotential(engagement?.story_potential || '');
  }, [engagement?.story_present, engagement?.story_past, engagement?.story_potential]);

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

      {/* Generate Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Narrative Integrity Map
          </CardTitle>
          <CardDescription>
            AI-generated insights into superpowers, zone interpretation, and weekly actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center py-4">
            Coming Soon — Full Narrative Integrity Map visualization
          </p>
          
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
