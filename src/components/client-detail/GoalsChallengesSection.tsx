import { useState } from 'react';
import { CoachingEngagement } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Target, AlertTriangle, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

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
  onUpdate: (updates: Partial<CoachingEngagement>) => Promise<void>;
}

const FIRES_OPTIONS = ['feelings', 'influence', 'resilience', 'ethics', 'strengths'];

export function GoalsChallengesSection({ engagement, onUpdate }: GoalsChallengesSectionProps) {
  const [editingGoals, setEditingGoals] = useState(false);
  const [editingChallenges, setEditingChallenges] = useState(false);
  const [tempGoals, setTempGoals] = useState<Goal[]>([]);
  const [tempChallenges, setTempChallenges] = useState<Challenge[]>([]);
  const [saving, setSaving] = useState(false);

  const goals: Goal[] = Array.isArray(engagement?.goals) ? engagement.goals : [];
  const challenges: Challenge[] = Array.isArray(engagement?.challenges) ? engagement.challenges : [];

  const openGoalsEditor = () => {
    setTempGoals(goals.length > 0 ? [...goals] : [{ goal: '', fires_lever: '' }]);
    setEditingGoals(true);
  };

  const openChallengesEditor = () => {
    setTempChallenges(challenges.length > 0 ? [...challenges] : [{ challenge: '', fires_lever: '' }]);
    setEditingChallenges(true);
  };

  const addGoal = () => {
    if (tempGoals.length < 3) {
      setTempGoals([...tempGoals, { goal: '', fires_lever: '' }]);
    }
  };

  const addChallenge = () => {
    if (tempChallenges.length < 3) {
      setTempChallenges([...tempChallenges, { challenge: '', fires_lever: '' }]);
    }
  };

  const removeGoal = (index: number) => {
    setTempGoals(tempGoals.filter((_, i) => i !== index));
  };

  const removeChallenge = (index: number) => {
    setTempChallenges(tempChallenges.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: 'goal' | 'fires_lever', value: string) => {
    const updated = [...tempGoals];
    updated[index] = { ...updated[index], [field]: value };
    setTempGoals(updated);
  };

  const updateChallenge = (index: number, field: 'challenge' | 'fires_lever', value: string) => {
    const updated = [...tempChallenges];
    updated[index] = { ...updated[index], [field]: value };
    setTempChallenges(updated);
  };

  const saveGoals = async () => {
    setSaving(true);
    try {
      const validGoals = tempGoals.filter(g => g.goal.trim());
      await onUpdate({ goals: validGoals });
      toast.success('Goals updated');
      setEditingGoals(false);
    } catch (err) {
      toast.error('Failed to save goals');
    } finally {
      setSaving(false);
    }
  };

  const saveChallenges = async () => {
    setSaving(true);
    try {
      const validChallenges = tempChallenges.filter(c => c.challenge.trim());
      await onUpdate({ challenges: validChallenges });
      toast.success('Challenges updated');
      setEditingChallenges(false);
    } catch (err) {
      toast.error('Failed to save challenges');
    } finally {
      setSaving(false);
    }
  };

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
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Goals */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Goals
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openGoalsEditor}>
              <Pencil className="h-4 w-4" />
            </Button>
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
            <Button variant="link" size="sm" className="px-0 mt-2 text-primary" onClick={openGoalsEditor}>
              <Plus className="h-3 w-3 mr-1" />
              {goals.length > 0 ? 'Edit Goals' : 'Add Goal'}
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openChallengesEditor}>
              <Pencil className="h-4 w-4" />
            </Button>
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
            <Button variant="link" size="sm" className="px-0 mt-2 text-primary" onClick={openChallengesEditor}>
              <Plus className="h-3 w-3 mr-1" />
              {challenges.length > 0 ? 'Edit Challenges' : 'Add Challenge'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Goals Editor Modal */}
      <Dialog open={editingGoals} onOpenChange={setEditingGoals}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Goals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {tempGoals.map((goal, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Enter goal..."
                    value={goal.goal}
                    onChange={(e) => updateGoal(idx, 'goal', e.target.value)}
                  />
                  <Select
                    value={goal.fires_lever || ''}
                    onValueChange={(value) => updateGoal(idx, 'fires_lever', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select FIRES lever..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FIRES_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="capitalize">
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => removeGoal(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {tempGoals.length < 3 && (
              <Button variant="outline" size="sm" onClick={addGoal} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal ({tempGoals.length}/3)
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingGoals(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveGoals} disabled={saving}>
              <Check className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Goals'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Challenges Editor Modal */}
      <Dialog open={editingChallenges} onOpenChange={setEditingChallenges}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Challenges</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {tempChallenges.map((challenge, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Enter challenge..."
                    value={challenge.challenge}
                    onChange={(e) => updateChallenge(idx, 'challenge', e.target.value)}
                  />
                  <Select
                    value={challenge.fires_lever || ''}
                    onValueChange={(value) => updateChallenge(idx, 'fires_lever', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select FIRES lever..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FIRES_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="capitalize">
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => removeChallenge(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {tempChallenges.length < 3 && (
              <Button variant="outline" size="sm" onClick={addChallenge} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Challenge ({tempChallenges.length}/3)
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingChallenges(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveChallenges} disabled={saving}>
              <Check className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Challenges'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
