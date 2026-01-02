import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function NarrativeMapTab() {
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
          <div className="flex justify-center">
            <Button disabled className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
