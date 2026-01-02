import { CoachingEngagement } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, AlertTriangle, Plus } from 'lucide-react';

interface Goal {
  goal: string;
  fires_lever?: string;
}

interface Challenge {
  challenge: string;
  fires_lever?: string;
}

interface GoalsChallengesSectionProps {
  engagement: CoachingEngagement | null;
}

export function GoalsChallengesSection({ engagement }: GoalsChallengesSectionProps) {
  const goals: Goal[] = Array.isArray(engagement?.goals) ? engagement.goals : [];
  const challenges: Challenge[] = Array.isArray(engagement?.challenges) ? engagement.challenges : [];

  if (!engagement) {
    return null;
  }

  const FiresBadge = ({ lever }: { lever?: string }) => {
    if (!lever) return null;
    return (
      <Badge variant="outline" className="text-xs capitalize">
        {lever}
      </Badge>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Goals */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length > 0 ? (
            <ul className="space-y-3">
              {goals.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div className="flex-1">
                    <p className="text-sm">{item.goal}</p>
                    {item.fires_lever && (
                      <div className="mt-1">
                        <FiresBadge lever={item.fires_lever} />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No goals captured yet</p>
          )}
          <Button variant="link" size="sm" className="px-0 mt-2 text-primary">
            <Plus className="h-3 w-3 mr-1" />
            Add Goal
          </Button>
        </CardContent>
      </Card>

      {/* Challenges */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {challenges.length > 0 ? (
            <ul className="space-y-3">
              {challenges.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  <div className="flex-1">
                    <p className="text-sm">{item.challenge}</p>
                    {item.fires_lever && (
                      <div className="mt-1">
                        <FiresBadge lever={item.fires_lever} />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">No challenges captured yet</p>
          )}
          <Button variant="link" size="sm" className="px-0 mt-2 text-primary">
            <Plus className="h-3 w-3 mr-1" />
            Add Challenge
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
