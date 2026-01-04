import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Sparkles, 
  Loader2, 
  ChevronDown, 
  RefreshCw, 
  CheckCircle, 
  Send,
  Eye,
  EyeOff,
  Calendar,
  Pencil,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface WeeklyMap {
  id: string;
  engagement_id: string;
  client_email: string;
  week_number: number;
  phase: string | null;
  client_map: ClientMap;
  coach_map: CoachMap;
  data_summary: DataSummary | null;
  data_from: string | null;
  data_to: string | null;
  status: 'draft' | 'reviewed' | 'published';
  created_at: string;
  updated_at: string | null;
  reviewed_at: string | null;
  published_at: string | null;
}

interface ClientMap {
  story_summary?: string;
  zone_insight?: string;
  wins_this_week?: string[];
  focus_next_week?: string;
  reflection_prompt?: string;
}

interface CoachMap {
  patterns_noticed?: string[];
  potential_blindspots?: string[];
  conversation_starters?: string[];
  markers_to_watch?: string[];
  phase_alignment?: string;
}

interface DataSummary {
  snapshots_count: number;
  impacts_count: number;
  sessions_count: number;
  notes_count: number;
  memos_count: number;
  files_count: number;
  marker_updates_count: number;
}

interface WeeklyMapSectionProps {
  engagementId: string;
  clientEmail: string;
  currentWeek: number;
  weeklyMaps: WeeklyMap[];
  isGenerating: boolean;
  onGenerate: () => Promise<void>;
  onRefetch: () => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  reviewed: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  published: { bg: 'bg-green-500/10', text: 'text-green-600' },
};

function BulletList({ items, emptyText }: { items?: string[]; emptyText: string }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground italic">{emptyText}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, idx) => (
        <li key={idx} className="text-sm flex items-start gap-2">
          <span className="text-primary mt-0.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function WeeklyMapCard({ 
  map, 
  isCurrentWeek, 
  onUpdate 
}: { 
  map: WeeklyMap; 
  isCurrentWeek: boolean;
  onUpdate: () => void;
}) {
  const [isOpen, setIsOpen] = useState(isCurrentWeek);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedClientMap, setEditedClientMap] = useState<ClientMap>(map.client_map || {});
  const { toast } = useToast();

  const statusStyle = statusColors[map.status] || statusColors.draft;

  const handleMarkReviewed = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('weekly_narrative_maps')
        .update({ 
          status: 'reviewed', 
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', map.id);

      if (error) throw error;
      toast({ title: 'Marked as reviewed' });
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Failed to update', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('weekly_narrative_maps')
        .update({ 
          status: 'published', 
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', map.id);

      if (error) throw error;
      toast({ title: 'Published to client!' });
      onUpdate();
    } catch (error) {
      console.error('Error publishing:', error);
      toast({ title: 'Failed to publish', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('weekly_narrative_maps')
        .update({ 
          client_map: editedClientMap,
          updated_at: new Date().toISOString()
        })
        .eq('id', map.id);

      if (error) throw error;
      toast({ title: 'Changes saved' });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving edits:', error);
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedClientMap(map.client_map || {});
    setIsEditing(false);
  };

  const updateClientMapField = (field: keyof ClientMap, value: string | string[]) => {
    setEditedClientMap(prev => ({ ...prev, [field]: value }));
  };

  const clientMap = isEditing ? editedClientMap : (map.client_map || {});
  const coachMap = map.coach_map || {};

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div 
          className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
            isCurrentWeek ? 'border-primary bg-primary/5' : 'bg-background'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Week {map.week_number}</span>
              {isCurrentWeek && (
                <Badge variant="outline" className="text-xs border-primary text-primary">Current</Badge>
              )}
            </div>
            {map.phase && (
              <Badge variant="secondary" className="text-xs capitalize">{map.phase}</Badge>
            )}
            <Badge variant="outline" className={`text-xs capitalize ${statusStyle.bg} ${statusStyle.text}`}>
              {map.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {map.data_from && map.data_to && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {format(new Date(map.data_from), 'MMM d')} - {format(new Date(map.data_to), 'MMM d')}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-4 space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Client Map
              </Button>
            ) : (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveEdits}
                  disabled={isSaving}
                  className="gap-1"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </>
            )}
            
            {map.status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkReviewed}
                disabled={isSaving}
                className="gap-1"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Mark as Reviewed
              </Button>
            )}
            
            {(map.status === 'draft' || map.status === 'reviewed') && (
              <Button
                variant="default"
                size="sm"
                onClick={handlePublish}
                disabled={isSaving}
                className="gap-1"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Publish to Client
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Client Map - Left Side */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Client View
                </CardTitle>
                <CardDescription className="text-xs">Visible to client when published</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Story Summary */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Story Summary
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={clientMap.story_summary || ''}
                      onChange={(e) => updateClientMapField('story_summary', e.target.value)}
                      placeholder="Summary of the client's story this week..."
                      className="min-h-[80px] text-sm"
                    />
                  ) : (
                    <p className="text-sm">{clientMap.story_summary || <span className="italic text-muted-foreground">Not set</span>}</p>
                  )}
                </div>

                {/* Zone Insight */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Zone Insight
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={clientMap.zone_insight || ''}
                      onChange={(e) => updateClientMapField('zone_insight', e.target.value)}
                      placeholder="Insight about where they are in their zone..."
                      className="min-h-[60px] text-sm"
                    />
                  ) : (
                    <p className="text-sm">{clientMap.zone_insight || <span className="italic text-muted-foreground">Not set</span>}</p>
                  )}
                </div>

                {/* Wins This Week */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Wins This Week
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={(clientMap.wins_this_week || []).join('\n')}
                      onChange={(e) => updateClientMapField('wins_this_week', e.target.value.split('\n').filter(s => s.trim()))}
                      placeholder="One win per line..."
                      className="min-h-[80px] text-sm"
                    />
                  ) : (
                    <BulletList items={clientMap.wins_this_week} emptyText="No wins recorded" />
                  )}
                </div>

                {/* Focus Next Week */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Focus Next Week
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={clientMap.focus_next_week || ''}
                      onChange={(e) => updateClientMapField('focus_next_week', e.target.value)}
                      placeholder="What to focus on next week..."
                      className="min-h-[60px] text-sm"
                    />
                  ) : (
                    <p className="text-sm">{clientMap.focus_next_week || <span className="italic text-muted-foreground">Not set</span>}</p>
                  )}
                </div>

                {/* Reflection Prompt */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reflection Prompt
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={clientMap.reflection_prompt || ''}
                      onChange={(e) => updateClientMapField('reflection_prompt', e.target.value)}
                      placeholder="A question for the client to reflect on..."
                      className="min-h-[60px] text-sm"
                    />
                  ) : (
                    <p className="text-sm italic text-primary">{clientMap.reflection_prompt || <span className="text-muted-foreground not-italic">Not set</span>}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Coach Map - Right Side */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <EyeOff className="h-4 w-4" />
                  Coach Notes
                </CardTitle>
                <CardDescription className="text-xs text-amber-600/80">Not visible to client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Patterns Noticed */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">
                    Patterns Noticed
                  </Label>
                  <BulletList items={coachMap.patterns_noticed} emptyText="No patterns identified" />
                </div>

                {/* Potential Blindspots */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">
                    Potential Blindspots
                  </Label>
                  <BulletList items={coachMap.potential_blindspots} emptyText="No blindspots identified" />
                </div>

                {/* Conversation Starters */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">
                    Conversation Starters
                  </Label>
                  <BulletList items={coachMap.conversation_starters} emptyText="No starters suggested" />
                </div>

                {/* Markers to Watch */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">
                    Markers to Watch
                  </Label>
                  <BulletList items={coachMap.markers_to_watch} emptyText="No markers flagged" />
                </div>

                {/* Phase Alignment */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">
                    Phase Alignment
                  </Label>
                  <p className="text-sm">{coachMap.phase_alignment || <span className="italic text-muted-foreground">Not assessed</span>}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Summary */}
          {map.data_summary && (
            <div className="text-xs text-muted-foreground flex flex-wrap gap-3 pt-2 border-t">
              <span>Data sources:</span>
              {map.data_summary.snapshots_count > 0 && <span>{map.data_summary.snapshots_count} snapshots</span>}
              {map.data_summary.impacts_count > 0 && <span>{map.data_summary.impacts_count} impacts</span>}
              {map.data_summary.sessions_count > 0 && <span>{map.data_summary.sessions_count} sessions</span>}
              {map.data_summary.notes_count > 0 && <span>{map.data_summary.notes_count} notes</span>}
              {map.data_summary.memos_count > 0 && <span>{map.data_summary.memos_count} memos</span>}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function WeeklyMapSection({
  engagementId,
  clientEmail,
  currentWeek,
  weeklyMaps,
  isGenerating,
  onGenerate,
  onRefetch
}: WeeklyMapSectionProps) {
  const hasNoMaps = !weeklyMaps || weeklyMaps.length === 0;
  const currentWeekMap = weeklyMaps?.find(m => m.week_number === currentWeek);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Weekly Narrative Maps
            </CardTitle>
            <CardDescription>
              AI-generated weekly summaries for coach and client
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={onGenerate} 
              disabled={isGenerating}
              variant={currentWeekMap ? 'outline' : 'default'}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : currentWeekMap ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Week {currentWeek}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Week {currentWeek} Map
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasNoMaps ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No weekly maps generated yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generate a map to create AI-powered summaries for Week {currentWeek}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {weeklyMaps.map((map) => (
              <WeeklyMapCard 
                key={map.id} 
                map={map} 
                isCurrentWeek={map.week_number === currentWeek}
                onUpdate={onRefetch}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
