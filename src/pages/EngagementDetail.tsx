import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase, Client, CoachingEngagement } from '@/lib/supabase';
import { MoreLessMarker, MoreLessUpdate } from '@/hooks/useClientDetail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, Target, Flame, ChevronRight, Calendar as CalendarIcon,
  Loader2, TrendingUp, TrendingDown, Plus, Pencil, Trash2, Check,
  Play, Pause, CheckCircle, History, ChevronDown, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Phase configuration
const PHASES = [
  { key: 'name', label: 'NAME', builds: 'CLARITY', weeks: '1-4', weekRange: [1, 4], color: 'bg-[#5B8C5A]' },
  { key: 'validate', label: 'VALIDATE', builds: 'CONFIDENCE', weeks: '5-8', weekRange: [5, 8], color: 'bg-[#D4A84B]' },
  { key: 'communicate', label: 'COMMUNICATE', builds: 'INFLUENCE', weeks: '9-12', weekRange: [9, 12], color: 'bg-[#7B68A6]' },
];

// Focus labels mapping
const FOCUS_LABELS: Record<string, string> = {
  sales: 'Sales / Business Development',
  communication: 'Communication / Influence',
  leadership: 'Leadership / Management',
  growth: 'Professional Growth',
  team: 'Team Dynamics',
  transition: 'Role Transition',
  health: 'Health & Wellness',
  relationships: 'Relationships',
  finances: 'Finances',
  other: 'Other',
};

// FIRES configuration
const FIRES_OPTIONS = [
  { key: 'feelings', label: 'Feelings', description: 'Emotional awareness and regulation' },
  { key: 'influence', label: 'Influence', description: 'Locus of control and agency' },
  { key: 'resilience', label: 'Resilience', description: 'Growth through difficulty' },
  { key: 'ethics', label: 'Ethics', description: 'Values alignment and purpose' },
  { key: 'strengths', label: 'Strengths', description: 'Capability confidence and self-efficacy' },
];

const FIRES_COLORS: Record<string, string> = {
  feelings: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  influence: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  resilience: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ethics: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  strengths: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

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

export default function EngagementDetail() {
  const { id } = useParams<{ id: string }>();
  
  // Data state
  const [engagement, setEngagement] = useState<CoachingEngagement | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [markers, setMarkers] = useState<MoreLessMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Story editing
  const [storyPresent, setStoryPresent] = useState('');
  const [storyPast, setStoryPast] = useState('');
  const [storyPotential, setStoryPotential] = useState('');

  // Modal states
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [firesModalOpen, setFiresModalOpen] = useState(false);
  const [editDetailsModalOpen, setEditDetailsModalOpen] = useState(false);
  const [addMarkerModalOpen, setAddMarkerModalOpen] = useState(false);
  const [updateScoreModalOpen, setUpdateScoreModalOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  
  // Edit states
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<ChallengeItem | null>(null);
  const [tempFiresFocus, setTempFiresFocus] = useState<string[]>([]);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
  const [tempFocus, setTempFocus] = useState('');

  // Add marker state
  const [newMarkerText, setNewMarkerText] = useState('');
  const [newMarkerType, setNewMarkerType] = useState<'more' | 'less'>('more');
  const [newBaseline, setNewBaseline] = useState([5]);
  const [newTarget, setNewTarget] = useState([8]);
  const [newFiresConnection, setNewFiresConnection] = useState('none');

  // Update score state
  const [selectedMarker, setSelectedMarker] = useState<MoreLessMarker | null>(null);
  const [updateScore, setUpdateScore] = useState([5]);
  const [updateNote, setUpdateNote] = useState('');

  // Fetch engagement data
  const fetchData = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch engagement
      const { data: engData, error: engError } = await supabase
        .from('coaching_engagements')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (engError) throw engError;
      if (!engData) {
        toast.error('Engagement not found');
        return;
      }

      setEngagement(engData);
      setStoryPresent(engData.story_present || '');
      setStoryPast(engData.story_past || '');
      setStoryPotential(engData.story_potential || '');

      // Fetch client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('email', engData.client_email)
        .maybeSingle();

      setClient(clientData);

      // Fetch markers with updates
      const { data: markersData } = await supabase
        .from('more_less_markers')
        .select('*')
        .eq('engagement_id', id)
        .eq('is_active', true);

      if (markersData && markersData.length > 0) {
        const markerIds = markersData.map(m => m.id);
        const { data: updatesData } = await supabase
          .from('more_less_updates')
          .select('*')
          .in('marker_id', markerIds)
          .order('update_date', { ascending: false });

        const updatesByMarker = (updatesData || []).reduce((acc, update) => {
          if (!acc[update.marker_id]) acc[update.marker_id] = [];
          acc[update.marker_id].push(update);
          return acc;
        }, {} as Record<string, MoreLessUpdate[]>);

        setMarkers(markersData.map(marker => ({
          ...marker,
          updates: updatesByMarker[marker.id] || [],
        })));
      } else {
        setMarkers([]);
      }
    } catch (err) {
      console.error('Error fetching engagement:', err);
      toast.error('Failed to load engagement');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save story field
  const saveStory = async (field: string, value: string) => {
    if (!engagement) return;
    setSaving(field);
    try {
      const { error } = await supabase
        .from('coaching_engagements')
        .update({ [field]: value })
        .eq('id', engagement.id);

      if (error) throw error;
      setEngagement(prev => prev ? { ...prev, [field]: value } : null);
      toast.success('Saved');
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  // Week advancement logic
  const getPhaseForWeek = (week: number): string => {
    if (week >= 1 && week <= 4) return 'name';
    if (week >= 5 && week <= 8) return 'validate';
    if (week >= 9 && week <= 12) return 'communicate';
    return 'communicate';
  };

  const handleAdvanceWeek = async () => {
    if (!engagement) return;
    
    const newWeek = (engagement.current_week || 1) + 1;
    
    if (newWeek > 12) {
      setCompleteConfirmOpen(true);
      return;
    }

    const newPhase = getPhaseForWeek(newWeek);
    
    setSaving('week');
    try {
      const { error } = await supabase
        .from('coaching_engagements')
        .update({ 
          current_week: newWeek,
          current_phase: newPhase 
        })
        .eq('id', engagement.id);

      if (error) throw error;
      
      setEngagement(prev => prev ? { 
        ...prev, 
        current_week: newWeek, 
        current_phase: newPhase 
      } : null);
      
      toast.success(`Advanced to Week ${newWeek}`);
    } catch (err) {
      console.error('Error advancing week:', err);
      toast.error('Failed to advance week');
    } finally {
      setSaving(null);
    }
  };

  const handleTogglePause = async () => {
    if (!engagement) return;
    
    const newStatus = engagement.status === 'paused' ? 'active' : 'paused';
    
    setSaving('status');
    try {
      const { error } = await supabase
        .from('coaching_engagements')
        .update({ status: newStatus })
        .eq('id', engagement.id);

      if (error) throw error;
      
      setEngagement(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(newStatus === 'paused' ? 'Engagement paused' : 'Engagement resumed');
    } catch (err) {
      console.error('Error toggling pause:', err);
      toast.error('Failed to update status');
    } finally {
      setSaving(null);
    }
  };

  const handleCompleteEngagement = async () => {
    if (!engagement) return;
    
    setSaving('complete');
    try {
      const { error } = await supabase
        .from('coaching_engagements')
        .update({ 
          status: 'completed',
          end_date: format(new Date(), 'yyyy-MM-dd')
        })
        .eq('id', engagement.id);

      if (error) throw error;
      
      setEngagement(prev => prev ? { 
        ...prev, 
        status: 'completed',
        end_date: format(new Date(), 'yyyy-MM-dd')
      } : null);
      
      setCompleteConfirmOpen(false);
      toast.success('Engagement completed');
    } catch (err) {
      console.error('Error completing:', err);
      toast.error('Failed to complete engagement');
    } finally {
      setSaving(null);
    }
  };

  // Goals management
  const goals: GoalItem[] = Array.isArray(engagement?.goals) ? engagement.goals : [];
  const challenges: ChallengeItem[] = Array.isArray(engagement?.challenges) ? engagement.challenges : [];

  const handleSaveGoal = async () => {
    if (!engagement || !editingGoal) return;
    
    setSaving('goal');
    try {
      let updatedGoals: GoalItem[];
      if (goals.find(g => g.id === editingGoal.id)) {
        updatedGoals = goals.map(g => g.id === editingGoal.id ? editingGoal : g);
      } else {
        updatedGoals = [...goals, editingGoal];
      }

      const { error } = await supabase
        .from('coaching_engagements')
        .update({ goals: updatedGoals })
        .eq('id', engagement.id);

      if (error) throw error;
      
      setEngagement(prev => prev ? { ...prev, goals: updatedGoals } : null);
      setGoalModalOpen(false);
      setEditingGoal(null);
      toast.success('Goal saved');
    } catch (err) {
      console.error('Error saving goal:', err);
      toast.error('Failed to save goal');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!engagement) return;
    
    const updatedGoals = goals.filter(g => g.id !== goalId);
    
    try {
      const { error } = await supabase
        .from('coaching_engagements')
        .update({ goals: updatedGoals })
        .eq('id', engagement.id);

      if (error) throw error;
      
      setEngagement(prev => prev ? { ...prev, goals: updatedGoals } : null);
      toast.success('Goal deleted');
    } catch (err) {
      console.error('Error deleting goal:', err);
      toast.error('Failed to delete goal');
    }
  };

  const handleSaveChallenge = async () => {
    if (!engagement || !editingChallenge) return;
    
    setSaving('challenge');
    try {
      let updatedChallenges: ChallengeItem[];
      if (challenges.find(c => c.id === editingChallenge.id)) {
        updatedChallenges = challenges.map(c => c.id === editingChallenge.id ? editingChallenge : c);
      } else {
        updatedChallenges = [...challenges, editingChallenge];
      }

      const { error } = await supabase
        .from('coaching_engagements')
        .update({ challenges: updatedChallenges })
        .eq('id', engagement.id);

      if (error) throw error;
      
      setEngagement(prev => prev ? { ...prev, challenges: updatedChallenges } : null);
      setChallengeModalOpen(false);
      setEditingChallenge(null);
      toast.success('Challenge saved');
    } catch (err) {
      console.error('Error saving challenge:', err);
      toast.error('Failed to save challenge');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!engagement) return;
    
    const updatedChallenges = challenges.filter(c => c.id !== challengeId);
    
    try {
      const { error } = await supabase
        .from('coaching_engagements')
        .update({ challenges: updatedChallenges })
        .eq('id', engagement.id);

      if (error) throw error;
      
      setEngagement(prev => prev ? { ...prev, challenges: updatedChallenges } : null);
      toast.success('Challenge deleted');
    } catch (err) {
      console.error('Error deleting challenge:', err);
      toast.error('Failed to delete challenge');
    }
  };

  // FIRES focus management
  const firesFocus: string[] = Array.isArray(engagement?.fires_focus) ? engagement.fires_focus : [];

  const handleSaveFiresFocus = async () => {
    if (!engagement) return;
    
    setSaving('fires');
    try {
      const { error } = await supabase
        .from('coaching_engagements')
        .update({ fires_focus: tempFiresFocus })
        .eq('id', engagement.id);

      if (error) throw error;
      
      setEngagement(prev => prev ? { ...prev, fires_focus: tempFiresFocus } : null);
      setFiresModalOpen(false);
      toast.success('FIRES focus updated');
    } catch (err) {
      console.error('Error saving FIRES focus:', err);
      toast.error('Failed to update FIRES focus');
    } finally {
      setSaving(null);
    }
  };

  // Edit details
  const handleSaveDetails = async () => {
    if (!engagement) return;
    
    setSaving('details');
    try {
      const updates: Partial<CoachingEngagement> = {};
      if (tempStartDate) {
        updates.start_date = format(tempStartDate, 'yyyy-MM-dd');
      }
      if (tempFocus) {
        updates.focus = tempFocus;
      }

      const { error } = await supabase
        .from('coaching_engagements')
        .update(updates)
        .eq('id', engagement.id);

      if (error) throw error;
      
      setEngagement(prev => prev ? { ...prev, ...updates } : null);
      setEditDetailsModalOpen(false);
      toast.success('Details updated');
    } catch (err) {
      console.error('Error saving details:', err);
      toast.error('Failed to update details');
    } finally {
      setSaving(null);
    }
  };

  // Add marker
  const handleAddMarker = async () => {
    if (!engagement || !newMarkerText.trim()) return;
    
    setSaving('marker');
    try {
      const { data: markerData, error: markerError } = await supabase
        .from('more_less_markers')
        .insert({
          client_email: engagement.client_email,
          engagement_id: engagement.id,
          marker_text: newMarkerText.trim(),
          marker_type: newMarkerType,
          baseline_score: newBaseline[0],
          target_score: newTarget[0],
          current_score: newBaseline[0],
          fires_connection: newFiresConnection === 'none' ? null : newFiresConnection,
          is_active: true,
        })
        .select()
        .single();

      if (markerError) throw markerError;

      await supabase.from('more_less_updates').insert({
        marker_id: markerData.id,
        update_date: new Date().toISOString().split('T')[0],
        score: newBaseline[0],
        source: 'baseline',
        note: 'Initial baseline score',
      });

      setAddMarkerModalOpen(false);
      setNewMarkerText('');
      setNewMarkerType('more');
      setNewBaseline([5]);
      setNewTarget([8]);
      setNewFiresConnection('none');
      fetchData();
      toast.success('Marker added');
    } catch (err) {
      console.error('Error adding marker:', err);
      toast.error('Failed to add marker');
    } finally {
      setSaving(null);
    }
  };

  // Update score
  const handleUpdateScore = async () => {
    if (!selectedMarker) return;
    
    setSaving('score');
    try {
      await supabase.from('more_less_updates').insert({
        marker_id: selectedMarker.id,
        update_date: new Date().toISOString().split('T')[0],
        score: updateScore[0],
        source: 'manual',
        note: updateNote.trim() || null,
      });

      await supabase
        .from('more_less_markers')
        .update({ current_score: updateScore[0] })
        .eq('id', selectedMarker.id);

      setUpdateScoreModalOpen(false);
      setSelectedMarker(null);
      setUpdateNote('');
      fetchData();
      toast.success('Score updated');
    } catch (err) {
      console.error('Error updating score:', err);
      toast.error('Failed to update score');
    } finally {
      setSaving(null);
    }
  };

  // Get progress percentage for markers
  const getProgress = (marker: MoreLessMarker) => {
    if (marker.baseline_score === null || marker.target_score === null || marker.current_score === null) return 0;
    const range = marker.target_score - marker.baseline_score;
    if (range === 0) return 100;
    const progress = ((marker.current_score - marker.baseline_score) / range) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'paused': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Engagement not found</p>
        <Link to="/clients">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Link>
      </div>
    );
  }

  const currentPhase = PHASES.find(p => p.key === engagement.current_phase) || PHASES[0];
  const weekProgress = ((engagement.current_week || 1) / 12) * 100;
  const moreMarkers = markers.filter(m => m.marker_type === 'more');
  const lessMarkers = markers.filter(m => m.marker_type === 'less');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link to={`/clients/${encodeURIComponent(engagement.client_email)}`}>
        <Button variant="ghost" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to {client?.name || 'Client'}
        </Button>
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-semibold">
              {client?.name || engagement.client_email}
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(engagement.start_date), 'MMM d, yyyy')} – {engagement.end_date ? format(new Date(engagement.end_date), 'MMM d, yyyy') : 'Present'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('capitalize', getStatusColor(engagement.status))}>
              {engagement.status}
            </Badge>
            {engagement.focus && (
              <Badge variant="secondary">
                {FOCUS_LABELS[engagement.focus] || engagement.focus}
              </Badge>
            )}
          </div>
        </div>

        {/* Phase/Week with Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">
              {currentPhase.label} • Week {engagement.current_week} of 12
            </span>
            <span className="text-sm text-muted-foreground">
              Builds {currentPhase.builds}
            </span>
          </div>
          <Progress value={weekProgress} className="h-2" />
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="grid gap-3 md:grid-cols-3">
        {PHASES.map((phase) => {
          const isCurrent = phase.key === engagement.current_phase;
          const isPast = PHASES.indexOf(phase) < PHASES.findIndex(p => p.key === engagement.current_phase);
          
          return (
            <Card 
              key={phase.key}
              className={cn(
                'transition-all cursor-pointer hover:shadow-md',
                isCurrent && 'ring-2 ring-primary shadow-md'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', phase.color)} />
                  <div className="flex-1">
                    <div className="font-medium">{phase.label}</div>
                    <div className="text-sm text-muted-foreground">
                      Weeks {phase.weeks} • Builds {phase.builds}
                    </div>
                  </div>
                  {isCurrent && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                  {isPast && (
                    <Check className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* The Story Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">The Story</CardTitle>
          <CardDescription>Client's narrative arc</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Present: Where are they now?</Label>
              <Textarea
                value={storyPresent}
                onChange={(e) => setStoryPresent(e.target.value)}
                onBlur={() => saveStory('story_present', storyPresent)}
                placeholder="I'm ready to..."
                rows={4}
                disabled={saving === 'story_present'}
              />
            </div>
            <div className="space-y-2">
              <Label>Past: What brought them here?</Label>
              <Textarea
                value={storyPast}
                onChange={(e) => setStoryPast(e.target.value)}
                onBlur={() => saveStory('story_past', storyPast)}
                placeholder="Years of..."
                rows={4}
                disabled={saving === 'story_past'}
              />
            </div>
            <div className="space-y-2">
              <Label>Potential: Where are they going?</Label>
              <Textarea
                value={storyPotential}
                onChange={(e) => setStoryPotential(e.target.value)}
                onBlur={() => saveStory('story_potential', storyPotential)}
                placeholder="A life where..."
                rows={4}
                disabled={saving === 'story_potential'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals & Challenges */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Goals */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Goals
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => {
                setEditingGoal({ id: crypto.randomUUID(), text: '', firesLever: 'influence' });
                setGoalModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No goals set</p>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm">{goal.text}</p>
                    <Badge variant="outline" className={cn('text-xs mt-1 capitalize', FIRES_COLORS[goal.firesLever])}>
                      {goal.firesLever}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingGoal(goal);
                        setGoalModalOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Challenges
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => {
                setEditingChallenge({ id: crypto.randomUUID(), text: '', firesLever: 'resilience' });
                setChallengeModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {challenges.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No challenges set</p>
            ) : (
              challenges.map((challenge) => (
                <div key={challenge.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm">{challenge.text}</p>
                    <Badge variant="outline" className={cn('text-xs mt-1 capitalize', FIRES_COLORS[challenge.firesLever])}>
                      {challenge.firesLever}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingChallenge(challenge);
                        setChallengeModalOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteChallenge(challenge.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* FIRES Focus */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            FIRES Focus
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setTempFiresFocus([...firesFocus]);
              setFiresModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit Focus
          </Button>
        </CardHeader>
        <CardContent>
          {firesFocus.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No FIRES focus areas selected</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {firesFocus.map((focus) => {
                const option = FIRES_OPTIONS.find(o => o.key === focus);
                return (
                  <div 
                    key={focus}
                    className={cn(
                      'px-4 py-3 rounded-lg border-2',
                      FIRES_COLORS[focus]
                    )}
                  >
                    <div className="font-medium capitalize">{option?.label || focus}</div>
                    <div className="text-xs opacity-80">{option?.description}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* More/Less Markers */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="font-serif text-lg">More/Less Markers</CardTitle>
          <Button size="sm" onClick={() => setAddMarkerModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Marker
          </Button>
        </CardHeader>
        <CardContent>
          {markers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              No markers yet. Add markers to track behavioral changes.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* More Of */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  More Of
                </h4>
                {moreMarkers.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No "more" markers</p>
                ) : (
                  moreMarkers.map((marker) => (
                    <MarkerCard 
                      key={marker.id} 
                      marker={marker} 
                      onUpdateScore={() => {
                        setSelectedMarker(marker);
                        setUpdateScore([marker.current_score || 5]);
                        setUpdateScoreModalOpen(true);
                      }}
                    />
                  ))
                )}
              </div>

              {/* Less Of */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                  Less Of
                </h4>
                {lessMarkers.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No "less" markers</p>
                ) : (
                  lessMarkers.map((marker) => (
                    <MarkerCard 
                      key={marker.id} 
                      marker={marker} 
                      onUpdateScore={() => {
                        setSelectedMarker(marker);
                        setUpdateScore([marker.current_score || 5]);
                        setUpdateScoreModalOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleAdvanceWeek}
              disabled={saving === 'week' || engagement.status !== 'active'}
            >
              {saving === 'week' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1" />
              )}
              Advance Week
            </Button>

            <Button 
              variant="outline"
              onClick={handleTogglePause}
              disabled={saving === 'status' || engagement.status === 'completed'}
            >
              {saving === 'status' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : engagement.status === 'paused' ? (
                <Play className="h-4 w-4 mr-1" />
              ) : (
                <Pause className="h-4 w-4 mr-1" />
              )}
              {engagement.status === 'paused' ? 'Resume' : 'Pause'} Engagement
            </Button>

            <Button 
              variant="outline"
              onClick={() => setCompleteConfirmOpen(true)}
              disabled={engagement.status === 'completed'}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete Engagement
            </Button>

            <Button 
              variant="outline"
              onClick={() => {
                setTempStartDate(new Date(engagement.start_date));
                setTempFocus(engagement.focus || '');
                setEditDetailsModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goal Modal */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal?.text ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Goal</Label>
              <Textarea
                value={editingGoal?.text || ''}
                onChange={(e) => setEditingGoal(prev => prev ? { ...prev, text: e.target.value } : null)}
                placeholder="What does the client want to achieve?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>FIRES Lever</Label>
              <Select 
                value={editingGoal?.firesLever || 'influence'} 
                onValueChange={(v) => setEditingGoal(prev => prev ? { ...prev, firesLever: v } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIRES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGoal} disabled={saving === 'goal' || !editingGoal?.text.trim()}>
              {saving === 'goal' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Challenge Modal */}
      <Dialog open={challengeModalOpen} onOpenChange={setChallengeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChallenge?.text ? 'Edit Challenge' : 'Add Challenge'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Challenge</Label>
              <Textarea
                value={editingChallenge?.text || ''}
                onChange={(e) => setEditingChallenge(prev => prev ? { ...prev, text: e.target.value } : null)}
                placeholder="What obstacle is the client facing?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>FIRES Lever</Label>
              <Select 
                value={editingChallenge?.firesLever || 'resilience'} 
                onValueChange={(v) => setEditingChallenge(prev => prev ? { ...prev, firesLever: v } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIRES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChallengeModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChallenge} disabled={saving === 'challenge' || !editingChallenge?.text.trim()}>
              {saving === 'challenge' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FIRES Focus Modal */}
      <Dialog open={firesModalOpen} onOpenChange={setFiresModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit FIRES Focus</DialogTitle>
            <DialogDescription>Select the FIRES elements to focus on</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {FIRES_OPTIONS.map((opt) => (
              <div 
                key={opt.key}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                  tempFiresFocus.includes(opt.key) ? FIRES_COLORS[opt.key] : 'border-muted hover:border-muted-foreground/50'
                )}
                onClick={() => {
                  if (tempFiresFocus.includes(opt.key)) {
                    setTempFiresFocus(tempFiresFocus.filter(f => f !== opt.key));
                  } else {
                    setTempFiresFocus([...tempFiresFocus, opt.key]);
                  }
                }}
              >
                <Checkbox checked={tempFiresFocus.includes(opt.key)} />
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-sm text-muted-foreground">{opt.description}</div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFiresModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFiresFocus} disabled={saving === 'fires'}>
              {saving === 'fires' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Details Modal */}
      <Dialog open={editDetailsModalOpen} onOpenChange={setEditDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Engagement Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {tempStartDate ? format(tempStartDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tempStartDate}
                    onSelect={setTempStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Focus Area</Label>
              <Select value={tempFocus} onValueChange={setTempFocus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select focus area" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FOCUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDetailsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDetails} disabled={saving === 'details'}>
              {saving === 'details' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Marker Modal */}
      <Dialog open={addMarkerModalOpen} onOpenChange={setAddMarkerModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add More/Less Marker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Marker Text</Label>
              <Textarea
                value={newMarkerText}
                onChange={(e) => setNewMarkerText(e.target.value)}
                placeholder="What behavior, thought, or feeling to track?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup value={newMarkerType} onValueChange={(v) => setNewMarkerType(v as 'more' | 'less')} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more" id="type-more" />
                  <Label htmlFor="type-more" className="flex items-center gap-1 cursor-pointer">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> More
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less" id="type-less" />
                  <Label htmlFor="type-less" className="flex items-center gap-1 cursor-pointer">
                    <TrendingDown className="h-4 w-4 text-rose-500" /> Less
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Baseline Score: {newBaseline[0]}</Label>
              <Slider value={newBaseline} onValueChange={setNewBaseline} min={1} max={10} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Target Score: {newTarget[0]}</Label>
              <Slider value={newTarget} onValueChange={setNewTarget} min={1} max={10} step={1} />
            </div>
            <div className="space-y-2">
              <Label>FIRES Connection</Label>
              <Select value={newFiresConnection} onValueChange={setNewFiresConnection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {FIRES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMarkerModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMarker} disabled={saving === 'marker' || !newMarkerText.trim()}>
              {saving === 'marker' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Marker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Score Modal */}
      <Dialog open={updateScoreModalOpen} onOpenChange={setUpdateScoreModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Score</DialogTitle>
          </DialogHeader>
          {selectedMarker && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                {selectedMarker.marker_type === 'more' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
                <span className="text-sm font-medium">{selectedMarker.marker_text}</span>
              </div>
              <div className="space-y-2">
                <Label>New Score: {updateScore[0]}</Label>
                <Slider value={updateScore} onValueChange={setUpdateScore} min={1} max={10} step={1} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Baseline: {selectedMarker.baseline_score}</span>
                  <span>Target: {selectedMarker.target_score}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Add context..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateScoreModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateScore} disabled={saving === 'score'}>
              {saving === 'score' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation */}
      <Dialog open={completeConfirmOpen} onOpenChange={setCompleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Engagement?</DialogTitle>
            <DialogDescription>
              This will mark the engagement as completed and set the end date to today. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleCompleteEngagement} disabled={saving === 'complete'}>
              {saving === 'complete' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Complete Engagement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Marker Card Component
function MarkerCard({ marker, onUpdateScore }: { marker: MoreLessMarker; onUpdateScore: () => void }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const isMore = marker.marker_type === 'more';
  
  const getProgress = () => {
    if (marker.baseline_score === null || marker.target_score === null || marker.current_score === null) return 0;
    const range = marker.target_score - marker.baseline_score;
    if (range === 0) return 100;
    const progress = ((marker.current_score - marker.baseline_score) / range) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const progress = getProgress();

  return (
    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className={cn('mt-0.5', isMore ? 'text-emerald-500' : 'text-rose-500')}>
            {isMore ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-medium">{marker.marker_text}</p>
            {marker.fires_connection && (
              <Badge variant="outline" className={cn('text-xs mt-1 capitalize', FIRES_COLORS[marker.fires_connection])}>
                {marker.fires_connection}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onUpdateScore}>
          <Pencil className="h-3 w-3 mr-1" />
          Update
        </Button>
      </div>

      <div className="space-y-1">
        <div className="relative">
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{marker.baseline_score ?? '—'}</span>
          <span className="font-medium text-foreground">{marker.current_score ?? '—'}</span>
          <span>{marker.target_score ?? '—'}</span>
        </div>
      </div>

      {marker.updates && marker.updates.length > 0 && (
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs w-full justify-between">
              <span className="flex items-center gap-1">
                <History className="h-3 w-3" />
                History ({marker.updates.length})
              </span>
              <ChevronDown className={cn('h-3 w-3 transition-transform', historyOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-1 border-l-2 border-muted pl-2 ml-1">
              {marker.updates.slice(0, 5).map((update) => (
                <div key={update.id} className="text-xs">
                  <span className="text-muted-foreground">{format(new Date(update.update_date), 'MMM d')}</span>
                  <span className="mx-1">•</span>
                  <span className="font-medium">{update.score}</span>
                  {update.note && <span className="text-muted-foreground ml-1">- {update.note}</span>}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
