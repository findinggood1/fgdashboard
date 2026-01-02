import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, Loader2, ChevronDown, Flame, Pencil, X, Plus } from 'lucide-react';
import { supabase, ZoneInterpretation, Superpower, WorldAskingInsight } from '@/lib/supabase';
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

type SuperpowerCategory = 'claimed' | 'emerging' | 'hidden';

interface SuperpowerFormData {
  superpower: string;
  description: string;
  evidence: string;
  fires_element: string;
  category: SuperpowerCategory;
}

interface InsightFormData {
  insight: string;
  fires_element: string;
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
    world_asking?: WorldAskingInsight[] | null;
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

const firesElements = [
  { value: 'feelings', label: 'Feelings' },
  { value: 'influence', label: 'Influence' },
  { value: 'resilience', label: 'Resilience' },
  { value: 'ethics', label: 'Ethics' },
  { value: 'strengths', label: 'Strengths' },
];

function SuperpowerCard({ 
  superpower, 
  onEdit, 
  onDelete 
}: { 
  superpower: Superpower; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
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
  category,
  emptyLabel,
  onAdd,
  onEdit,
  onDelete,
}: { 
  title: string; 
  icon: React.ReactNode; 
  subtitle: string; 
  superpowers: Superpower[] | null | undefined;
  category: SuperpowerCategory;
  emptyLabel: string;
  onAdd: (category: SuperpowerCategory) => void;
  onEdit: (superpower: Superpower, index: number, category: SuperpowerCategory) => void;
  onDelete: (index: number, category: SuperpowerCategory) => void;
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
            <SuperpowerCard 
              key={idx} 
              superpower={sp} 
              onEdit={() => onEdit(sp, idx, category)}
              onDelete={() => onDelete(idx, category)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic py-2">
          No {emptyLabel} superpowers yet. Click Generate Insights or add manually.
        </p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => onAdd(category)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Superpower
      </Button>
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

  // Superpower modal state
  const [isSuperpowerModalOpen, setIsSuperpowerModalOpen] = useState(false);
  const [editingSuperpowerIndex, setEditingSuperpowerIndex] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<SuperpowerCategory>('claimed');
  const [superpowerForm, setSuperpowerForm] = useState<SuperpowerFormData>({
    superpower: '',
    description: '',
    evidence: '',
    fires_element: 'strengths',
    category: 'claimed',
  });
  const [isSavingSuperpower, setIsSavingSuperpower] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<SuperpowerCategory>('claimed');
  const [deletingType, setDeletingType] = useState<'superpower' | 'insight'>('superpower');

  // World Asking modal state
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [editingInsightIndex, setEditingInsightIndex] = useState<number | null>(null);
  const [insightForm, setInsightForm] = useState<InsightFormData>({
    insight: '',
    fires_element: 'strengths',
  });
  const [isSavingInsight, setIsSavingInsight] = useState(false);

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

  // Superpower handlers
  const handleAddSuperpower = (category: SuperpowerCategory) => {
    setEditingSuperpowerIndex(null);
    setEditingCategory(category);
    setSuperpowerForm({
      superpower: '',
      description: '',
      evidence: '',
      fires_element: 'strengths',
      category,
    });
    setIsSuperpowerModalOpen(true);
  };

  const handleEditSuperpower = (superpower: Superpower, index: number, category: SuperpowerCategory) => {
    setEditingSuperpowerIndex(index);
    setEditingCategory(category);
    setSuperpowerForm({
      superpower: superpower.superpower,
      description: superpower.description || '',
      evidence: superpower.evidence?.join('\n') || '',
      fires_element: superpower.fires_element,
      category,
    });
    setIsSuperpowerModalOpen(true);
  };

  const handleDeleteSuperpowerClick = (index: number, category: SuperpowerCategory) => {
    setDeletingIndex(index);
    setDeletingCategory(category);
    setDeletingType('superpower');
    setDeleteConfirmOpen(true);
  };

  const getSuperpowerArrayField = (category: SuperpowerCategory) => {
    switch (category) {
      case 'claimed': return 'superpowers_claimed';
      case 'emerging': return 'superpowers_emerging';
      case 'hidden': return 'superpowers_hidden';
    }
  };

  const getSuperpowerArray = (category: SuperpowerCategory): Superpower[] => {
    switch (category) {
      case 'claimed': return engagement?.superpowers_claimed || [];
      case 'emerging': return engagement?.superpowers_emerging || [];
      case 'hidden': return engagement?.superpowers_hidden || [];
    }
  };

  const handleSaveSuperpower = async () => {
    if (!engagement?.id || !superpowerForm.superpower.trim()) return;

    setIsSavingSuperpower(true);
    try {
      const evidenceArray = superpowerForm.evidence
        .split('\n')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      const newSuperpower: Superpower = {
        superpower: superpowerForm.superpower.trim(),
        description: superpowerForm.description.trim(),
        evidence: evidenceArray,
        fires_element: superpowerForm.fires_element as Superpower['fires_element'],
        source: 'Coach',
        created_at: new Date().toISOString(),
      };

      // Get current arrays
      const targetArray = [...getSuperpowerArray(superpowerForm.category)];
      
      if (editingSuperpowerIndex !== null) {
        // Editing existing - check if category changed
        const originalArray = [...getSuperpowerArray(editingCategory)];
        
        if (editingCategory === superpowerForm.category) {
          // Same category - update in place
          targetArray[editingSuperpowerIndex] = newSuperpower;
          
          const { error } = await supabase
            .from('coaching_engagements')
            .update({ [getSuperpowerArrayField(superpowerForm.category)]: targetArray })
            .eq('id', engagement.id);
          
          if (error) throw error;
        } else {
          // Category changed - remove from old, add to new
          originalArray.splice(editingSuperpowerIndex, 1);
          targetArray.push(newSuperpower);
          
          const { error } = await supabase
            .from('coaching_engagements')
            .update({
              [getSuperpowerArrayField(editingCategory)]: originalArray,
              [getSuperpowerArrayField(superpowerForm.category)]: targetArray,
            })
            .eq('id', engagement.id);
          
          if (error) throw error;
        }
      } else {
        // Adding new
        targetArray.push(newSuperpower);
        
        const { error } = await supabase
          .from('coaching_engagements')
          .update({ [getSuperpowerArrayField(superpowerForm.category)]: targetArray })
          .eq('id', engagement.id);
        
        if (error) throw error;
      }

      toast({ title: 'Superpower saved!' });
      setIsSuperpowerModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving superpower:', error);
      toast({
        title: 'Failed to save',
        description: 'Could not save the superpower. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingSuperpower(false);
    }
  };

  const handleDeleteSuperpower = async () => {
    if (!engagement?.id || deletingIndex === null) return;

    try {
      const targetArray = [...getSuperpowerArray(deletingCategory)];
      targetArray.splice(deletingIndex, 1);

      const { error } = await supabase
        .from('coaching_engagements')
        .update({ [getSuperpowerArrayField(deletingCategory)]: targetArray })
        .eq('id', engagement.id);

      if (error) throw error;

      toast({ title: 'Superpower removed' });
      setDeleteConfirmOpen(false);
      refetch();
    } catch (error) {
      console.error('Error deleting superpower:', error);
      toast({
        title: 'Failed to delete',
        description: 'Could not remove the superpower. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // World Asking handlers
  const handleAddInsight = () => {
    setEditingInsightIndex(null);
    setInsightForm({ insight: '', fires_element: 'strengths' });
    setIsInsightModalOpen(true);
  };

  const handleEditInsight = (item: WorldAskingInsight, index: number) => {
    setEditingInsightIndex(index);
    setInsightForm({
      insight: item.insight,
      fires_element: item.fires_element,
    });
    setIsInsightModalOpen(true);
  };

  const handleDeleteInsightClick = (index: number) => {
    setDeletingIndex(index);
    setDeletingType('insight');
    setDeleteConfirmOpen(true);
  };

  const handleSaveInsight = async () => {
    if (!engagement?.id || !insightForm.insight.trim()) return;

    setIsSavingInsight(true);
    try {
      const newInsight: WorldAskingInsight = {
        insight: insightForm.insight.trim(),
        fires_element: insightForm.fires_element as WorldAskingInsight['fires_element'],
        source: 'Coach',
        created_at: new Date().toISOString(),
      };

      const currentArray = [...(engagement?.world_asking || [])];
      
      if (editingInsightIndex !== null) {
        currentArray[editingInsightIndex] = newInsight;
      } else {
        currentArray.push(newInsight);
      }

      const { error } = await supabase
        .from('coaching_engagements')
        .update({ world_asking: currentArray })
        .eq('id', engagement.id);

      if (error) throw error;

      toast({ title: 'Insight saved!' });
      setIsInsightModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving insight:', error);
      toast({
        title: 'Failed to save',
        description: 'Could not save the insight. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingInsight(false);
    }
  };

  const handleDeleteInsight = async () => {
    if (!engagement?.id || deletingIndex === null) return;

    try {
      const currentArray = [...(engagement?.world_asking || [])];
      currentArray.splice(deletingIndex, 1);

      const { error } = await supabase
        .from('coaching_engagements')
        .update({ world_asking: currentArray })
        .eq('id', engagement.id);

      if (error) throw error;

      toast({ title: 'Insight removed' });
      setDeleteConfirmOpen(false);
      refetch();
    } catch (error) {
      console.error('Error deleting insight:', error);
      toast({
        title: 'Failed to delete',
        description: 'Could not remove the insight. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (deletingType === 'insight') {
      await handleDeleteInsight();
    } else {
      await handleDeleteSuperpower();
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
            category="claimed"
            emptyLabel="claimed"
            onAdd={handleAddSuperpower}
            onEdit={handleEditSuperpower}
            onDelete={handleDeleteSuperpowerClick}
          />
          
          <SuperpowersSection
            title="SUPERPOWERS EMERGING"
            icon={<span className="text-lg">🌱</span>}
            subtitle="What you're building confidence in"
            superpowers={engagement?.superpowers_emerging}
            category="emerging"
            emptyLabel="emerging"
            onAdd={handleAddSuperpower}
            onEdit={handleEditSuperpower}
            onDelete={handleDeleteSuperpowerClick}
          />
          
          <SuperpowersSection
            title="SUPERPOWERS HIDDEN"
            icon={<span className="text-lg">✨</span>}
            subtitle="What's in the data but unclaimed"
            superpowers={engagement?.superpowers_hidden}
            category="hidden"
            emptyLabel="hidden"
            onAdd={handleAddSuperpower}
            onEdit={handleEditSuperpower}
            onDelete={handleDeleteSuperpowerClick}
          />
        </CardContent>
      </Card>

      {/* What Your Story Is Asking of You */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            What Your Story Is Asking of You
          </CardTitle>
          <CardDescription>
            Insights and themes emerging from your coaching journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(engagement?.world_asking && engagement.world_asking.length > 0) ? (
            <div className="space-y-3">
              {engagement.world_asking.map((item, idx) => {
                const firesStyle = firesColors[item.fires_element] || firesColors.strengths;
                return (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 p-3 bg-background rounded-lg border"
                  >
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">{item.insight}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`${firesStyle.bg} ${firesStyle.text} capitalize text-xs`}>
                          {item.fires_element}
                        </Badge>
                        {item.source && (
                          <Badge variant="secondary" className="text-xs text-muted-foreground">
                            {item.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditInsight(item, idx)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteInsightClick(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic py-2">
              No insights yet. Click Generate Insights or add manually.
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1 mt-4"
            onClick={handleAddInsight}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Insight
          </Button>
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

      {/* Superpower Edit Modal */}
      <Dialog open={isSuperpowerModalOpen} onOpenChange={setIsSuperpowerModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSuperpowerIndex !== null ? 'Edit Superpower' : 'Add Superpower'}
            </DialogTitle>
            <DialogDescription>
              {editingSuperpowerIndex !== null 
                ? 'Update this superpower details.' 
                : 'Add a new superpower to the client\'s profile.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="superpower-name">Name</Label>
              <Input
                id="superpower-name"
                value={superpowerForm.superpower}
                onChange={(e) => setSuperpowerForm(prev => ({ ...prev, superpower: e.target.value }))}
                placeholder="e.g., Strategic Thinking"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="superpower-description">Description</Label>
              <Textarea
                id="superpower-description"
                value={superpowerForm.description}
                onChange={(e) => setSuperpowerForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this superpower..."
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="superpower-evidence">Evidence (one item per line)</Label>
              <Textarea
                id="superpower-evidence"
                value={superpowerForm.evidence}
                onChange={(e) => setSuperpowerForm(prev => ({ ...prev, evidence: e.target.value }))}
                placeholder="Session 3: demonstrated clear planning ability&#10;Handled crisis with calm approach"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>FIRES Element</Label>
              <Select
                value={superpowerForm.fires_element}
                onValueChange={(value) => setSuperpowerForm(prev => ({ ...prev, fires_element: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select element" />
                </SelectTrigger>
                <SelectContent>
                  {firesElements.map(el => (
                    <SelectItem key={el.value} value={el.value}>{el.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <RadioGroup
                value={superpowerForm.category}
                onValueChange={(value: SuperpowerCategory) => setSuperpowerForm(prev => ({ ...prev, category: value }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="claimed" id="cat-claimed" />
                  <Label htmlFor="cat-claimed" className="cursor-pointer">Claimed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emerging" id="cat-emerging" />
                  <Label htmlFor="cat-emerging" className="cursor-pointer">Emerging</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hidden" id="cat-hidden" />
                  <Label htmlFor="cat-hidden" className="cursor-pointer">Hidden</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuperpowerModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSuperpower} 
              disabled={isSavingSuperpower || !superpowerForm.superpower.trim()}
            >
              {isSavingSuperpower ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insight Edit Modal */}
      <Dialog open={isInsightModalOpen} onOpenChange={setIsInsightModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingInsightIndex !== null ? 'Edit Insight' : 'Add Insight'}
            </DialogTitle>
            <DialogDescription>
              {editingInsightIndex !== null 
                ? 'Update this insight.' 
                : 'Add a new insight to the client\'s story.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="insight-text">Insight</Label>
              <Textarea
                id="insight-text"
                value={insightForm.insight}
                onChange={(e) => setInsightForm(prev => ({ ...prev, insight: e.target.value }))}
                placeholder="What is this client's story asking of them?"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>FIRES Element</Label>
              <Select
                value={insightForm.fires_element}
                onValueChange={(value) => setInsightForm(prev => ({ ...prev, fires_element: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select element" />
                </SelectTrigger>
                <SelectContent>
                  {firesElements.map(el => (
                    <SelectItem key={el.value} value={el.value}>{el.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInsightModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveInsight} 
              disabled={isSavingInsight || !insightForm.insight.trim()}
            >
              {isSavingInsight ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove this {deletingType === 'insight' ? 'insight' : 'superpower'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The {deletingType === 'insight' ? 'insight' : 'superpower'} will be permanently removed from this client's profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
