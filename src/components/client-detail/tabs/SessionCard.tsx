import { useState } from 'react';
import { format } from 'date-fns';
import { SessionTranscript } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronRight, Clock, Video, Phone, FileText, Pencil, ExternalLink, Loader2, Quote, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SessionCardProps {
  session: SessionTranscript;
  onViewTranscript: (session: SessionTranscript) => void;
  onRefresh: () => void;
}

const sessionTypeColors: Record<string, string> = {
  coaching: 'bg-primary/10 text-primary',
  intake: 'bg-blue-500/10 text-blue-600',
  'check-in': 'bg-amber-500/10 text-amber-600',
  final: 'bg-green-500/10 text-green-600',
};

const sourceIcons: Record<string, typeof Video> = {
  fathom: Video,
  zoom: Video,
  phone: Phone,
  'in-person': FileText,
  other: FileText,
  manual: Pencil,
};

export function SessionCard({ session, onViewTranscript, onRefresh }: SessionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [observations, setObservations] = useState(session.coach_observations || '');
  const [breakthroughs, setBreakthroughs] = useState(session.client_breakthroughs || '');
  const [nextFocus, setNextFocus] = useState(session.next_session_focus || '');

  const SourceIcon = sourceIcons[session.source?.toLowerCase() || 'manual'] || FileText;
  const sessionTypeClass = sessionTypeColors[session.session_type?.toLowerCase() || ''] || 'bg-muted text-muted-foreground';

  const handleGenerateSummary = async () => {
    if (!session.transcript_text) {
      toast.error('No transcript available to summarize');
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('summarize-session', {
        body: { 
          sessionId: session.id, 
          transcript: session.transcript_text 
        }
      });
      
      if (error) throw error;
      
      // The Edge Function already updates the database
      // data contains: summary, key_themes, key_quotes, action_items, coach_observations, client_breakthroughs, next_session_focus
      
      toast.success('Summary generated successfully');
      onRefresh();
      
    } catch (err) {
      console.error('Error generating summary:', err);
      toast.error('Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCoachNotes = async () => {
    try {
      const { error } = await supabase
        .from('session_transcripts')
        .update({
          coach_observations: observations,
          client_breakthroughs: breakthroughs,
          next_session_focus: nextFocus,
        })
        .eq('id', session.id);

      if (error) throw error;
      
      toast.success('Coach notes saved');
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      console.error('Error saving coach notes:', err);
      toast.error('Failed to save notes');
    }
  };

  const toggleActionItem = async (index: number) => {
    if (!session.action_items) return;
    
    const items = [...session.action_items] as any[];
    if (typeof items[index] === 'object') {
      items[index] = {
        ...items[index],
        status: items[index].status === 'complete' ? 'pending' : 'complete',
      };
    }

    try {
      const { error } = await supabase
        .from('session_transcripts')
        .update({ action_items: items })
        .eq('id', session.id);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error updating action item:', err);
      toast.error('Failed to update action item');
    }
  };

  const summaryPreview = session.summary 
    ? session.summary.slice(0, 80) + (session.summary.length > 80 ? '...' : '')
    : 'No summary yet';

  return (
    <Card className="shadow-soft">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">
                  {format(new Date(session.session_date), 'MMM d, yyyy')}
                </span>
                {session.session_number && (
                  <Badge variant="outline" className="font-normal">
                    Session {session.session_number}
                  </Badge>
                )}
                {session.session_type && (
                  <Badge className={cn('capitalize font-normal', sessionTypeClass)}>
                    {session.session_type}
                  </Badge>
                )}
                {session.duration_minutes && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {session.duration_minutes} min
                  </span>
                )}
                <SourceIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground max-w-xs truncate hidden sm:block">
                {summaryPreview}
              </span>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Summary Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Summary</h4>
                {!session.is_processed && session.transcript_text && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Summary'
                    )}
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {session.summary || 'No summary available'}
              </p>
            </div>

            {/* Key Themes */}
            {session.key_themes && session.key_themes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Key Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {session.key_themes.map((theme, i) => (
                    <Badge key={i} variant="secondary" className="font-normal">
                      {typeof theme === 'string' ? theme : (theme as any).text || theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Key Quotes */}
            {session.key_quotes && session.key_quotes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Key Quotes</h4>
                <div className="space-y-3">
                  {session.key_quotes.map((quote, i) => (
                    <blockquote key={i} className="border-l-2 border-primary/30 pl-4 py-1">
                      <Quote className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="text-sm italic">
                        "{typeof quote === 'string' ? quote : (quote as any).quote}"
                      </p>
                      {typeof quote === 'object' && (quote as any).context && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(quote as any).context}
                        </p>
                      )}
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {session.action_items && session.action_items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Action Items</h4>
                <div className="space-y-2">
                  {session.action_items.map((item, i) => {
                    const isObject = typeof item === 'object';
                    const text = isObject ? (item as any).item : item;
                    const owner = isObject ? (item as any).owner : null;
                    const status = isObject ? (item as any).status : 'pending';
                    const isComplete = status === 'complete';

                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleActionItem(i)}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={cn('text-sm', isComplete && 'line-through text-muted-foreground')}>
                            {text}
                          </p>
                          {owner && (
                            <Badge variant="outline" className="mt-1 text-xs capitalize">
                              {owner}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coach Section */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Coach Notes
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 p-4 bg-muted/30 rounded-lg space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Observations</label>
                        <Textarea
                          value={observations}
                          onChange={(e) => setObservations(e.target.value)}
                          placeholder="What did you observe?"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Client Breakthroughs</label>
                        <Textarea
                          value={breakthroughs}
                          onChange={(e) => setBreakthroughs(e.target.value)}
                          placeholder="Any breakthroughs or insights?"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Next Session Focus</label>
                        <Textarea
                          value={nextFocus}
                          onChange={(e) => setNextFocus(e.target.value)}
                          placeholder="What to focus on next time?"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveCoachNotes}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Observations</p>
                        <p className="text-sm">{session.coach_observations || 'No observations recorded'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Client Breakthroughs</p>
                        <p className="text-sm">{session.client_breakthroughs || 'None recorded'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Next Session Focus</p>
                        <p className="text-sm">{session.next_session_focus || 'Not set'}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-3 w-3 mr-2" />
                        Edit Notes
                      </Button>
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Footer Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              {session.transcript_text && (
                <Button variant="outline" size="sm" onClick={() => onViewTranscript(session)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Transcript
                </Button>
              )}
              {(session as any).source_url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={(session as any).source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Source
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
