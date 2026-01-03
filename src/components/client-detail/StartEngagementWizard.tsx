import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, nextMonday } from 'date-fns';
import { cn } from '@/lib/utils';

interface StartEngagementWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientEmail: string;
  onSuccess: () => void;
}

interface GoalItem {
  id: string;
  text: string;
  firesLever: string;
}

interface ChallengeItem {
  id: string;
  text: string;
  firesLever: string;
}

interface MarkerItem {
  id: string;
  text: string;
  type: 'more' | 'less';
  baseline: number;
  target: number;
}

const FIRES_LEVERS = [
  { value: 'feelings', label: 'Feelings' },
  { value: 'influence', label: 'Influence' },
  { value: 'resilience', label: 'Resilience' },
  { value: 'ethics', label: 'Ethics' },
  { value: 'strengths', label: 'Strengths' },
];

const FIRES_OPTIONS = [
  { key: 'feelings', label: 'Feelings', description: 'Emotional awareness and regulation' },
  { key: 'influence', label: 'Influence', description: 'Locus of control and agency' },
  { key: 'resilience', label: 'Resilience', description: 'Growth through difficulty' },
  { key: 'ethics', label: 'Ethics', description: 'Values alignment and purpose' },
  { key: 'strengths', label: 'Strengths', description: 'Capability confidence and self-efficacy' },
];

const STEPS = [
  { num: 1, title: 'Basics' },
  { num: 2, title: 'The Story' },
  { num: 3, title: 'Goals & Challenges' },
  { num: 4, title: 'FIRES Focus' },
  { num: 5, title: 'Initial Markers' },
];

export function StartEngagementWizard({ open, onOpenChange, clientEmail, onSuccess }: StartEngagementWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Basics
  const [startDate, setStartDate] = useState<Date>(nextMonday(new Date()));
  const [primaryArena, setPrimaryArena] = useState<string>('team');

  // Step 2: The Story
  const [storyPresent, setStoryPresent] = useState('');
  const [storyPast, setStoryPast] = useState('');
  const [storyPotential, setStoryPotential] = useState('');

  // Step 3: Goals & Challenges
  const [goals, setGoals] = useState<GoalItem[]>([{ id: crypto.randomUUID(), text: '', firesLever: 'impact' }]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([{ id: crypto.randomUUID(), text: '', firesLever: 'structure' }]);

  // Step 4: FIRES Focus
  const [firesFocus, setFiresFocus] = useState<string[]>([]);

  // Step 5: Initial Markers
  const [markers, setMarkers] = useState<MarkerItem[]>([]);

  const resetForm = () => {
    setStep(1);
    setStartDate(nextMonday(new Date()));
    setPrimaryArena('team');
    setStoryPresent('');
    setStoryPast('');
    setStoryPotential('');
    setGoals([{ id: crypto.randomUUID(), text: '', firesLever: 'impact' }]);
    setChallenges([{ id: crypto.randomUUID(), text: '', firesLever: 'structure' }]);
    setFiresFocus([]);
    setMarkers([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const addGoal = () => {
    if (goals.length < 3) {
      setGoals([...goals, { id: crypto.randomUUID(), text: '', firesLever: 'impact' }]);
    }
  };

  const removeGoal = (id: string) => {
    if (goals.length > 1) {
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  const updateGoal = (id: string, updates: Partial<GoalItem>) => {
    setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const addChallenge = () => {
    if (challenges.length < 3) {
      setChallenges([...challenges, { id: crypto.randomUUID(), text: '', firesLever: 'structure' }]);
    }
  };

  const removeChallenge = (id: string) => {
    if (challenges.length > 1) {
      setChallenges(challenges.filter(c => c.id !== id));
    }
  };

  const updateChallenge = (id: string, updates: Partial<ChallengeItem>) => {
    setChallenges(challenges.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const toggleFiresFocus = (key: string) => {
    if (firesFocus.includes(key)) {
      setFiresFocus(firesFocus.filter(f => f !== key));
    } else if (firesFocus.length < 3) {
      setFiresFocus([...firesFocus, key]);
    }
  };

  const addMarker = () => {
    setMarkers([...markers, { id: crypto.randomUUID(), text: '', type: 'more', baseline: 5, target: 8 }]);
  };

  const removeMarker = (id: string) => {
    setMarkers(markers.filter(m => m.id !== id));
  };

  const updateMarker = (id: string, updates: Partial<MarkerItem>) => {
    setMarkers(markers.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return startDate && primaryArena;
      case 2:
        return true; // All optional
      case 3:
        return goals.some(g => g.text.trim()) || challenges.some(c => c.text.trim()) || true;
      case 4:
        return firesFocus.length >= 1 && firesFocus.length <= 3;
      case 5:
        return true; // Optional
      default:
        return true;
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      // Build goals and challenges arrays
      const goalsData = goals.filter(g => g.text.trim()).map(g => ({
        text: g.text.trim(),
        fires_lever: g.firesLever,
      }));

      const challengesData = challenges.filter(c => c.text.trim()).map(c => ({
        text: c.text.trim(),
        fires_lever: c.firesLever,
      }));

      const firesData = firesFocus.reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);

      // Create engagement
      const { data: engagement, error: engagementError } = await supabase
        .from('coaching_engagements')
        .insert({
          client_email: clientEmail,
          start_date: format(startDate, 'yyyy-MM-dd'),
          current_phase: 'name',
          current_week: 1,
          status: 'active',
          primary_arena: primaryArena,
          story_present: storyPresent.trim() || null,
          story_past: storyPast.trim() || null,
          story_potential: storyPotential.trim() || null,
          goals: goalsData.length > 0 ? goalsData : null,
          challenges: challengesData.length > 0 ? challengesData : null,
          fires_focus: Object.keys(firesData).length > 0 ? firesData : null,
        })
        .select()
        .single();

      if (engagementError) throw engagementError;

      // Create initial markers if any
      const markersToInsert = markers.filter(m => m.text.trim()).map(m => ({
        client_email: clientEmail,
        engagement_id: engagement.id,
        marker_text: m.text.trim(),
        marker_type: m.type,
        baseline_score: m.baseline,
        target_score: m.target,
        current_score: m.baseline,
        is_active: true,
      }));

      if (markersToInsert.length > 0) {
        const { error: markersError } = await supabase
          .from('more_less_markers')
          .insert(markersToInsert);

        if (markersError) throw markersError;
      }

      toast({ title: 'Engagement started!', description: 'The coaching engagement has been created.' });
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Error creating engagement:', err);
      toast({ title: 'Failed to start engagement', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((s, idx) => (
        <div key={s.num} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step === s.num
                ? "bg-primary text-primary-foreground"
                : step > s.num
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {s.num}
          </div>
          {idx < STEPS.length - 1 && (
            <div className={cn(
              "w-8 h-0.5 mx-1",
              step > s.num ? "bg-primary/50" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => date && setStartDate(date)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-3">
        <Label>Primary Arena</Label>
        <RadioGroup value={primaryArena} onValueChange={setPrimaryArena} className="space-y-2">
          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="team" id="arena-team" />
            <label htmlFor="arena-team" className="flex-1 cursor-pointer">
              <div className="font-medium">Team</div>
              <div className="text-sm text-muted-foreground">Focus on managing and leading their team</div>
            </label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="clients" id="arena-clients" />
            <label htmlFor="arena-clients" className="flex-1 cursor-pointer">
              <div className="font-medium">Clients</div>
              <div className="text-sm text-muted-foreground">Focus on client relationships and outcomes</div>
            </label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="both" id="arena-both" />
            <label htmlFor="arena-both" className="flex-1 cursor-pointer">
              <div className="font-medium">Both</div>
              <div className="text-sm text-muted-foreground">Balance between team leadership and client work</div>
            </label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Capture the client's narrative arc. All fields are optional.</p>
      
      <div className="space-y-2">
        <Label htmlFor="story-present">Present: Where are they now?</Label>
        <Textarea
          id="story-present"
          value={storyPresent}
          onChange={(e) => setStoryPresent(e.target.value)}
          rows={3}
          placeholder="Current situation, role, context..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="story-past">Past: What brought them here?</Label>
        <Textarea
          id="story-past"
          value={storyPast}
          onChange={(e) => setStoryPast(e.target.value)}
          rows={3}
          placeholder="Career journey, key experiences, pivotal moments..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="story-potential">Potential: Where are they going?</Label>
        <Textarea
          id="story-potential"
          value={storyPotential}
          onChange={(e) => setStoryPotential(e.target.value)}
          rows={3}
          placeholder="Aspirations, vision, desired future state..."
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Goals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Goals (1-3)</Label>
          {goals.length < 3 && (
            <Button variant="ghost" size="sm" onClick={addGoal}>
              <Plus className="h-4 w-4 mr-1" />Add
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {goals.map((goal, idx) => (
            <div key={goal.id} className="flex gap-2">
              <Input
                value={goal.text}
                onChange={(e) => updateGoal(goal.id, { text: e.target.value })}
                placeholder={`Goal ${idx + 1}`}
                className="flex-1"
              />
              <Select value={goal.firesLever} onValueChange={(v) => updateGoal(goal.id, { firesLever: v })}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIRES_LEVERS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {goals.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeGoal(goal.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Challenges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Challenges (1-3)</Label>
          {challenges.length < 3 && (
            <Button variant="ghost" size="sm" onClick={addChallenge}>
              <Plus className="h-4 w-4 mr-1" />Add
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {challenges.map((challenge, idx) => (
            <div key={challenge.id} className="flex gap-2">
              <Input
                value={challenge.text}
                onChange={(e) => updateChallenge(challenge.id, { text: e.target.value })}
                placeholder={`Challenge ${idx + 1}`}
                className="flex-1"
              />
              <Select value={challenge.firesLever} onValueChange={(v) => updateChallenge(challenge.id, { firesLever: v })}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIRES_LEVERS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {challenges.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeChallenge(challenge.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <Label>Select 1-3 FIRES dimensions to focus on</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Selected: {firesFocus.length}/3
        </p>
      </div>

      <div className="space-y-3">
        {FIRES_OPTIONS.map(opt => (
          <div
            key={opt.key}
            className={cn(
              "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
              firesFocus.includes(opt.key)
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50",
              firesFocus.length >= 3 && !firesFocus.includes(opt.key) && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => toggleFiresFocus(opt.key)}
          >
            <Checkbox
              checked={firesFocus.includes(opt.key)}
              disabled={firesFocus.length >= 3 && !firesFocus.includes(opt.key)}
            />
            <div className="flex-1">
              <div className="font-medium">{opt.label}</div>
              <div className="text-sm text-muted-foreground">{opt.description}</div>
            </div>
          </div>
        ))}
      </div>

      {firesFocus.length === 0 && (
        <p className="text-sm text-destructive">Please select at least one focus area.</p>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Initial More/Less Markers (Optional)</Label>
          <p className="text-sm text-muted-foreground">Add behavioral markers to track progress</p>
        </div>
        <Button variant="outline" size="sm" onClick={addMarker}>
          <Plus className="h-4 w-4 mr-1" />Add Marker
        </Button>
      </div>

      {markers.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No markers added yet</p>
          <p className="text-sm">You can add them later from the More/Less tab</p>
        </div>
      ) : (
        <div className="space-y-4">
          {markers.map((marker, idx) => (
            <div key={marker.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex gap-2">
                <Input
                  value={marker.text}
                  onChange={(e) => updateMarker(marker.id, { text: e.target.value })}
                  placeholder="What behavior, thought, or feeling to track?"
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removeMarker(marker.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Type:</Label>
                  <RadioGroup
                    value={marker.type}
                    onValueChange={(v) => updateMarker(marker.id, { type: v as 'more' | 'less' })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="more" id={`more-${marker.id}`} />
                      <label htmlFor={`more-${marker.id}`} className="text-sm text-green-500 cursor-pointer">More</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="less" id={`less-${marker.id}`} />
                      <label htmlFor={`less-${marker.id}`} className="text-sm text-red-500 cursor-pointer">Less</label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Baseline</Label>
                    <span className="text-muted-foreground">{marker.baseline}/10</span>
                  </div>
                  <Slider
                    value={[marker.baseline]}
                    onValueChange={([v]) => updateMarker(marker.id, { baseline: v })}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Target</Label>
                    <span className="text-muted-foreground">{marker.target}/10</span>
                  </div>
                  <Slider
                    value={[marker.target]}
                    onValueChange={([v]) => updateMarker(marker.id, { target: v })}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start New Engagement</DialogTitle>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="min-h-[300px]">
          <h3 className="text-lg font-semibold mb-4">{STEPS[step - 1].title}</h3>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={saving || !canProceed()}>
                {saving ? 'Creating...' : 'Start Engagement'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
