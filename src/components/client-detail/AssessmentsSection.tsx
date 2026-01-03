import { useState } from 'react';
import { ClientAssessment } from '@/hooks/useClientDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ClipboardCheck, Plus, ChevronDown, FileUp, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AssessmentsSectionProps {
  assessments: ClientAssessment[];
  clientEmail: string;
  engagementId?: string;
  onRefresh: () => void;
  onUploadFile?: () => void;
}

const ASSESSMENT_TYPES = [
  { value: 'intake', label: 'Intake Assessment' },
  { value: 'progress', label: 'Progress Check' },
  { value: 'personality', label: 'Personality Assessment' },
  { value: '360_feedback', label: '360 Feedback' },
  { value: 'values', label: 'Values Assessment' },
  { value: 'strengths', label: 'Strengths Assessment' },
  { value: 'other', label: 'Other' },
];

export function AssessmentsSection({ assessments, clientEmail, engagementId, onRefresh, onUploadFile }: AssessmentsSectionProps) {
  const { toast } = useToast();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('intake');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Standard Intake Form state
  const [intakeData, setIntakeData] = useState({
    role: '',
    timeInRole: '',
    teamSize: '',
    orgIndustry: '',
    whatBringsYou: '',
    successLooksLike: '',
    biggestChallenge: '',
    firesScores: { fulfillment: 5, impact: 5, relationships: 5, engagement: 5, structure: 5 },
    previousCoaching: '',
    sessionPreferences: '',
  });

  // Quick Assessment state
  const [quickData, setQuickData] = useState({
    name: '',
    type: 'progress',
    notes: '',
  });

  const resetForm = () => {
    setIntakeData({
      role: '',
      timeInRole: '',
      teamSize: '',
      orgIndustry: '',
      whatBringsYou: '',
      successLooksLike: '',
      biggestChallenge: '',
      firesScores: { fulfillment: 5, impact: 5, relationships: 5, engagement: 5, structure: 5 },
      previousCoaching: '',
      sessionPreferences: '',
    });
    setQuickData({ name: '', type: 'progress', notes: '' });
    setActiveTab('intake');
  };

  const handleSaveIntake = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('client_assessments')
        .insert({
          client_email: clientEmail,
          engagement_id: engagementId || null,
          assessment_type: 'intake',
          assessment_name: 'Standard Intake Assessment',
          assessment_date: new Date().toISOString().split('T')[0],
          responses: {
            role: intakeData.role,
            time_in_role: intakeData.timeInRole,
            team_size: intakeData.teamSize,
            org_industry: intakeData.orgIndustry,
            what_brings_you: intakeData.whatBringsYou,
            success_looks_like: intakeData.successLooksLike,
            biggest_challenge: intakeData.biggestChallenge,
            previous_coaching: intakeData.previousCoaching,
            session_preferences: intakeData.sessionPreferences,
          },
          scores: intakeData.firesScores,
          status: 'completed',
        });

      if (error) throw error;

      toast({ title: 'Assessment saved', description: 'Intake assessment has been recorded.' });
      setAddModalOpen(false);
      resetForm();
      onRefresh();
    } catch (err) {
      console.error('Error saving assessment:', err);
      toast({ title: 'Failed to save assessment', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuick = async () => {
    if (!quickData.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter an assessment name.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('client_assessments')
        .insert({
          client_email: clientEmail,
          engagement_id: engagementId || null,
          assessment_type: quickData.type,
          assessment_name: quickData.name.trim(),
          assessment_date: new Date().toISOString().split('T')[0],
          summary: quickData.notes.trim() || null,
          status: 'completed',
        });

      if (error) throw error;

      toast({ title: 'Assessment saved' });
      setAddModalOpen(false);
      resetForm();
      onRefresh();
    } catch (err) {
      console.error('Error saving assessment:', err);
      toast({ title: 'Failed to save assessment', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return ASSESSMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const renderFIRESSlider = (label: string, key: keyof typeof intakeData.firesScores) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">{intakeData.firesScores[key]}/10</span>
      </div>
      <Slider
        value={[intakeData.firesScores[key]]}
        onValueChange={([v]) => setIntakeData(prev => ({
          ...prev,
          firesScores: { ...prev.firesScores, [key]: v }
        }))}
        min={1}
        max={10}
        step={1}
      />
    </div>
  );

  const renderAssessmentCard = (assessment: ClientAssessment) => {
    const isExpanded = expandedId === assessment.id;
    const hasDetails = assessment.responses || assessment.summary || assessment.scores;

    return (
      <Card key={assessment.id} className="bg-card/50">
        <Collapsible open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : assessment.id)}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{assessment.assessment_name}</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    {getTypeLabel(assessment.assessment_type)}
                  </Badge>
                  <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                    {assessment.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                </p>
                {assessment.scores && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {Object.entries(assessment.scores).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key.charAt(0).toUpperCase()}: {String(value)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {hasDetails && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>

            <CollapsibleContent className="mt-4 pt-4 border-t space-y-3">
              {assessment.summary && (
                <div>
                  <Label className="text-xs text-muted-foreground">Summary</Label>
                  <p className="text-sm mt-1">{assessment.summary}</p>
                </div>
              )}
              {assessment.responses && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Responses</Label>
                  <div className="grid gap-2">
                    {Object.entries(assessment.responses).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}: </span>
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </CardContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Assessments
        </CardTitle>
        <Button size="sm" onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Assessment
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {assessments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No assessments recorded yet</p>
          </div>
        ) : (
          assessments.map(renderAssessmentCard)
        )}
      </CardContent>

      {/* Add Assessment Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Assessment</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="intake">Standard Intake</TabsTrigger>
              <TabsTrigger value="quick">Quick Assessment</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="intake" className="space-y-6 mt-4">
              {/* Role & Context */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role / Title</Label>
                  <Input
                    id="role"
                    value={intakeData.role}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., VP of Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-in-role">Time in Role</Label>
                  <Input
                    id="time-in-role"
                    value={intakeData.timeInRole}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, timeInRole: e.target.value }))}
                    placeholder="e.g., 2 years"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-size">Team Size</Label>
                  <Input
                    id="team-size"
                    value={intakeData.teamSize}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, teamSize: e.target.value }))}
                    placeholder="e.g., 15 direct reports"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-industry">Org / Industry</Label>
                  <Input
                    id="org-industry"
                    value={intakeData.orgIndustry}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, orgIndustry: e.target.value }))}
                    placeholder="e.g., Tech / SaaS"
                  />
                </div>
              </div>

              {/* Coaching Goals */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="what-brings">What brings you to coaching?</Label>
                  <Textarea
                    id="what-brings"
                    value={intakeData.whatBringsYou}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, whatBringsYou: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="success">What does success look like?</Label>
                  <Textarea
                    id="success"
                    value={intakeData.successLooksLike}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, successLooksLike: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="challenge">Biggest challenge right now?</Label>
                  <Textarea
                    id="challenge"
                    value={intakeData.biggestChallenge}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, biggestChallenge: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>

              {/* FIRES Self-Assessment */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">FIRES Self-Assessment</Label>
                <div className="grid gap-4">
                  {renderFIRESSlider('Fulfillment', 'fulfillment')}
                  {renderFIRESSlider('Impact', 'impact')}
                  {renderFIRESSlider('Relationships', 'relationships')}
                  {renderFIRESSlider('Engagement', 'engagement')}
                  {renderFIRESSlider('Structure', 'structure')}
                </div>
              </div>

              {/* Experience & Preferences */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="previous-coaching">Previous coaching experience</Label>
                  <Textarea
                    id="previous-coaching"
                    value={intakeData.previousCoaching}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, previousCoaching: e.target.value }))}
                    rows={2}
                    placeholder="Have they worked with a coach before? What worked/didn't?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferences">Session preferences</Label>
                  <Textarea
                    id="preferences"
                    value={intakeData.sessionPreferences}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, sessionPreferences: e.target.value }))}
                    rows={2}
                    placeholder="Preferred time, frequency, format, etc."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveIntake} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Intake'}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="quick" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="quick-name">Assessment Name</Label>
                <Input
                  id="quick-name"
                  value={quickData.name}
                  onChange={(e) => setQuickData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., DiSC Profile"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={quickData.type} onValueChange={(v) => setQuickData(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-notes">Notes / Summary</Label>
                <Textarea
                  id="quick-notes"
                  value={quickData.notes}
                  onChange={(e) => setQuickData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  placeholder="Key findings or summary of the assessment..."
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveQuick} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Assessment'}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Upload an assessment document</p>
                <Button variant="outline" onClick={() => {
                  setAddModalOpen(false);
                  onUploadFile?.();
                }}>
                  <FileUp className="h-4 w-4 mr-2" />
                  Go to Files Tab
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload will save with category "Assessment"
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
