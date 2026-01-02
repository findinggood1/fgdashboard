import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface NarrativeMapTabProps {
  engagement: {
    id: string;
    status: string;
    ai_insights_generated_at?: string | null;
  } | null;
  refetch: () => void;
}

export function NarrativeMapTab({ engagement, refetch }: NarrativeMapTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const hasActiveEngagement = engagement?.status === 'active';

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

  return (
    <div className="mt-6">
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
          <p className="text-muted-foreground text-center py-8">
            Coming Soon — This tab will display the client's full Narrative Integrity Map once we build it out.
          </p>
          
          <div className="flex flex-col items-center gap-2">
            {hasActiveEngagement ? (
              <>
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
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Start an engagement to generate AI insights for this client.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
