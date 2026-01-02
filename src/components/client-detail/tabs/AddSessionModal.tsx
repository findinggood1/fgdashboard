import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AddSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientEmail: string;
  engagementId?: string;
  nextSessionNumber: number;
  onSuccess: () => void;
}

const sessionTypes = ['coaching', 'intake', 'check-in', 'final'];
const sources = ['fathom', 'zoom', 'phone', 'in-person', 'other'];

export function AddSessionModal({
  open,
  onOpenChange,
  clientEmail,
  engagementId,
  nextSessionNumber,
  onSuccess,
}: AddSessionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('transcript');

  // Shared fields
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState('coaching');
  const [sessionNumber, setSessionNumber] = useState(nextSessionNumber);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [source, setSource] = useState('zoom');
  const [sourceUrl, setSourceUrl] = useState('');

  // Tab 1: Transcript
  const [transcriptText, setTranscriptText] = useState('');

  // Tab 2: Summary Only
  const [summary, setSummary] = useState('');
  const [keyThemes, setKeyThemes] = useState<string[]>([]);
  const [themeInput, setThemeInput] = useState('');
  const [actionItems, setActionItems] = useState<{ item: string; owner: string; dueDate?: string }[]>([]);

  // Tab 3: Quick Note
  const [quickNote, setQuickNote] = useState('');

  const addTheme = () => {
    if (themeInput.trim() && !keyThemes.includes(themeInput.trim())) {
      setKeyThemes([...keyThemes, themeInput.trim()]);
      setThemeInput('');
    }
  };

  const removeTheme = (theme: string) => {
    setKeyThemes(keyThemes.filter(t => t !== theme));
  };

  const addActionItem = () => {
    setActionItems([...actionItems, { item: '', owner: 'client' }]);
  };

  const updateActionItem = (index: number, field: string, value: string) => {
    const updated = [...actionItems];
    updated[index] = { ...updated[index], [field]: value };
    setActionItems(updated);
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (activeTab === 'quicknote') {
        // Save to coaching_notes instead
        const { error } = await supabase.from('coaching_notes').insert({
          client_email: clientEmail,
          note_date: sessionDate,
          content: quickNote,
          session_type: sessionType,
        });

        if (error) throw error;
        toast.success('Quick note saved');
      } else {
        // Save to session_transcripts
        const sessionData: any = {
          client_email: clientEmail,
          engagement_id: engagementId || null,
          session_date: sessionDate,
          session_type: sessionType,
          session_number: sessionNumber,
          duration_minutes: durationMinutes,
          source: source,
          source_url: sourceUrl || null,
        };

        if (activeTab === 'transcript') {
          sessionData.transcript_text = transcriptText;
          sessionData.is_processed = false;
        } else {
          sessionData.summary = summary;
          sessionData.key_themes = keyThemes;
          sessionData.action_items = actionItems.filter(a => a.item.trim());
          sessionData.is_processed = true;
        }

        const { error } = await supabase.from('session_transcripts').insert(sessionData);

        if (error) throw error;
        toast.success('Session saved');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error('Error saving session:', err);
      toast.error('Failed to save session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSessionType('coaching');
    setSessionNumber(nextSessionNumber);
    setDurationMinutes(60);
    setSource('zoom');
    setSourceUrl('');
    setTranscriptText('');
    setSummary('');
    setKeyThemes([]);
    setActionItems([]);
    setQuickNote('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Session</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transcript">From Transcript</TabsTrigger>
            <TabsTrigger value="summary">Summary Only</TabsTrigger>
            <TabsTrigger value="quicknote">Quick Note</TabsTrigger>
          </TabsList>

          {/* Shared Header Fields (not for Quick Note) */}
          {activeTab !== 'quicknote' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Session Date</Label>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Session Type</Label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Session Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source URL (optional)</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
            </div>
          )}

          <TabsContent value="transcript" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Transcript</Label>
              <Textarea
                placeholder="Paste the full session transcript here..."
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                rows={10}
              />
              <p className="text-xs text-muted-foreground">
                After saving, you can use "Generate Summary" to process this transcript with AI.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                placeholder="Write a summary of the session..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Key Themes</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a theme..."
                  value={themeInput}
                  onChange={(e) => setThemeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTheme())}
                />
                <Button type="button" variant="outline" onClick={addTheme}>
                  Add
                </Button>
              </div>
              {keyThemes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keyThemes.map((theme) => (
                    <Badge key={theme} variant="secondary" className="gap-1">
                      {theme}
                      <button onClick={() => removeTheme(theme)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Action Items</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addActionItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              {actionItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    placeholder="Action item..."
                    value={item.item}
                    onChange={(e) => updateActionItem(index, 'item', e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={item.owner}
                    onValueChange={(v) => updateActionItem(index, 'owner', v)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={item.dueDate || ''}
                    onChange={(e) => updateActionItem(index, 'dueDate', e.target.value)}
                    className="w-36"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActionItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quicknote" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Session Type</Label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Quick notes about the session..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                This will be saved as a coaching note, not a full session transcript.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save {activeTab === 'quicknote' ? 'Note' : 'Session'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
