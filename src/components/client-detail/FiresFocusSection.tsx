import { CoachingEngagement } from '@/lib/supabase';
import { Snapshot } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FiresFocusSectionProps {
  engagement: CoachingEngagement | null;
  latestSnapshot: Snapshot | null;
}

const firesElements = ['Feelings', 'Influence', 'Resilience', 'Ethics', 'Strengths'];

export function FiresFocusSection({ engagement, latestSnapshot }: FiresFocusSectionProps) {
  if (!engagement) return null;

  const activeFires: string[] = Array.isArray(engagement.fires_focus) 
    ? engagement.fires_focus 
    : [];

  // Get scores from latest snapshot
  const getScore = (element: string) => {
    if (!latestSnapshot?.confidence_scores) return null;
    const scores = latestSnapshot.confidence_scores as Record<string, number>;
    // Try different key formats
    const score = scores[element.toLowerCase()] || scores[element] || null;
    return score;
  };

  const getZone = (element: string) => {
    if (!latestSnapshot?.zone_breakdown) return null;
    const breakdown = latestSnapshot.zone_breakdown as Record<string, string>;
    return breakdown[element.toLowerCase()] || breakdown[element] || null;
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          FIRES Focus
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {firesElements.map((element) => {
            const isActive = activeFires.some(
              (f) => f.toLowerCase() === element.toLowerCase()
            );
            const score = getScore(element);
            const zone = getZone(element);

            return (
              <div
                key={element}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg border transition-all',
                  isActive
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-muted/30 border-muted opacity-50'
                )}
              >
                <span
                  className={cn(
                    'font-medium text-sm',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {element}
                </span>
                {isActive && score !== null && (
                  <span className="text-lg font-bold mt-1">{score.toFixed(1)}</span>
                )}
                {isActive && zone && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs mt-1 capitalize',
                      zone.toLowerCase() === 'owning' && 'border-emerald-500 text-emerald-600',
                      zone.toLowerCase() === 'performing' && 'border-amber-500 text-amber-600',
                      zone.toLowerCase() === 'discovering' && 'border-blue-500 text-blue-600',
                      zone.toLowerCase() === 'exploring' && 'border-gray-500 text-gray-600'
                    )}
                  >
                    {zone}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        {activeFires.length === 0 && (
          <p className="text-sm text-muted-foreground italic mt-2">
            No FIRES focus areas selected for this engagement
          </p>
        )}
      </CardContent>
    </Card>
  );
}
