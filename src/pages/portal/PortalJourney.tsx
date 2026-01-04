import { useState } from 'react';
import { usePortalData, PortalSnapshot, PortalImpactEntry, PortalSession } from '@/hooks/usePortalData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Camera, 
  FileText, 
  Calendar,
  Heart,
  Users,
  Shield,
  Compass,
  Sparkles,
  Flame,
  ChevronDown,
  ChevronUp,
  Quote,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const FIRES_CONFIG = {
  feelings: { label: 'Feelings', icon: Heart, color: 'text-rose-500' },
  influence: { label: 'Influence', icon: Users, color: 'text-blue-500' },
  resilience: { label: 'Resilience', icon: Shield, color: 'text-emerald-500' },
  ethics: { label: 'Ethics', icon: Compass, color: 'text-purple-500' },
  strengths: { label: 'Strengths', icon: Sparkles, color: 'text-amber-500' },
};

const ZONE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  green: { label: 'Thriving', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  yellow: { label: 'Growing', color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  orange: { label: 'Stretching', color: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  red: { label: 'Challenged', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export default function PortalJourney() {
  const { snapshots, impactEntries, sessions, isLoading, refetchAll } = usePortalData();
  const [activeTab, setActiveTab] = useState('snapshots');

  if (isLoading) {
    return <JourneySkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-foreground">
          Your Journey
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your progress and see how far you've come
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="snapshots" className="flex-1 sm:flex-none gap-2">
            <Camera className="h-4 w-4" />
            Snapshots
            <Badge variant="secondary" className="ml-1">{snapshots.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex-1 sm:flex-none gap-2">
            <FileText className="h-4 w-4" />
            Impact
            <Badge variant="secondary" className="ml-1">{impactEntries.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex-1 sm:flex-none gap-2">
            <Calendar className="h-4 w-4" />
            Sessions
            <Badge variant="secondary" className="ml-1">{sessions.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="snapshots" className="mt-6">
          {snapshots.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="No snapshots yet"
              description="Your FIRES snapshots will appear here once you complete your first assessment."
            />
          ) : (
            <div className="grid gap-4">
              {snapshots.map((snapshot) => (
                <SnapshotCard key={snapshot.id} snapshot={snapshot} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="impact" className="mt-6">
          {impactEntries.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No impact entries yet"
              description="Your impact reflections will appear here as you document your journey."
            />
          ) : (
            <div className="grid gap-4">
              {impactEntries.map((entry) => (
                <ImpactCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          {sessions.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No sessions yet"
              description="Your coaching sessions will appear here once they're scheduled."
            />
          ) : (
            <div className="grid gap-4">
              {sessions.map((session, index) => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  sessionNumber={sessions.length - index}
                  onActionToggle={refetchAll}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SnapshotCard({ snapshot }: { snapshot: PortalSnapshot }) {
  const [isOpen, setIsOpen] = useState(false);
  const goalPreview = snapshot.goal ? (snapshot.goal.length > 80 ? snapshot.goal.slice(0, 80) + '...' : snapshot.goal) : null;

  const zoneBreakdown = [
    { key: 'feelings', zone: snapshot.feelings_zone },
    { key: 'influence', zone: snapshot.influence_zone },
    { key: 'resilience', zone: snapshot.resilience_zone },
    { key: 'ethics', zone: snapshot.ethics_zone },
    { key: 'strengths', zone: snapshot.strengths_zone },
  ].filter(z => z.zone);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {snapshot.overall_zone && (
              <div
                className={cn(
                  'px-4 py-3 rounded-lg text-center shrink-0',
                  ZONE_CONFIG[snapshot.overall_zone]?.bg || 'bg-muted'
                )}
              >
                <Flame className={cn('h-6 w-6 mx-auto mb-1', ZONE_CONFIG[snapshot.overall_zone]?.color)} />
                <p className={cn('text-sm font-medium', ZONE_CONFIG[snapshot.overall_zone]?.color)}>
                  {ZONE_CONFIG[snapshot.overall_zone]?.label || snapshot.overall_zone}
                </p>
              </div>
            )}

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(snapshot.created_at), 'MMMM d, yyyy')}
                </p>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              {goalPreview && !isOpen && (
                <p className="text-sm"><span className="text-muted-foreground">Goal:</span> {goalPreview}</p>
              )}
              
              <div className="flex gap-4">
                {snapshot.total_confidence !== null && (
                  <span className="text-sm">Confidence: <strong>{snapshot.total_confidence}</strong></span>
                )}
                {snapshot.total_alignment !== null && (
                  <span className="text-sm">Alignment: <strong>{snapshot.total_alignment}</strong></span>
                )}
              </div>
            </div>
          </div>

          <CollapsibleContent className="mt-4 pt-4 border-t space-y-4">
            {snapshot.goal && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Goal</p>
                <p className="text-sm">{snapshot.goal}</p>
              </div>
            )}

            {snapshot.success_story && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Success Story</p>
                <p className="text-sm">{snapshot.success_story}</p>
              </div>
            )}

            {zoneBreakdown.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">FIRES Breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {zoneBreakdown.map(({ key, zone }) => {
                    const config = FIRES_CONFIG[key as keyof typeof FIRES_CONFIG];
                    const zoneConfig = ZONE_CONFIG[zone!];
                    if (!config || !zoneConfig) return null;
                    const Icon = config.icon;
                    return (
                      <Badge key={key} variant="outline" className={cn('gap-1.5', config.color)}>
                        <Icon className="h-3 w-3" />
                        {config.label}: {zoneConfig.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {snapshot.question_48_hour && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">48-Hour Question</p>
                <p className="text-sm italic">"{snapshot.question_48_hour}"</p>
              </div>
            )}

            {snapshot.support_network && snapshot.support_network.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Support Network</p>
                <div className="flex flex-wrap gap-1">
                  {snapshot.support_network.map((person, idx) => (
                    <Badge key={idx} variant="secondary">{person}</Badge>
                  ))}
                </div>
              </div>
            )}

            {snapshot.growth_opportunity_category && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Growth Area</p>
                <p className="text-sm">{snapshot.growth_opportunity_category}</p>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

function ImpactCard({ entry }: { entry: PortalImpactEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const responses = entry.responses || {};
  const integrityPreview = responses.integrity_line_text || responses.what?.slice(0, 60);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    {entry.type === 'self' ? 'Impact on Self' : 'Impact on Others'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(entry.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>

              {!isOpen && integrityPreview && (
                <p className="text-sm truncate">{integrityPreview}...</p>
              )}

              {entry.integrity_line !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Integrity Line:</span>
                  <span className="font-semibold text-primary">{entry.integrity_line}</span>
                </div>
              )}
            </div>
          </div>

          <CollapsibleContent className="mt-4 pt-4 border-t space-y-4">
            {responses.what && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">What happened?</p>
                <p className="text-sm">{responses.what}</p>
              </div>
            )}

            {responses.how && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">How did it impact you?</p>
                <p className="text-sm">{responses.how}</p>
              </div>
            )}

            {responses.impact && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">The impact</p>
                <p className="text-sm">{responses.impact}</p>
              </div>
            )}

            {entry.integrity_line !== null && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm font-medium text-primary mb-1">Integrity Line Score</p>
                <p className="text-2xl font-bold text-primary">{entry.integrity_line}</p>
                {responses.integrity_line_text && (
                  <p className="text-sm mt-2">{responses.integrity_line_text}</p>
                )}
              </div>
            )}

            {entry.signals && entry.signals.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Signals</p>
                <div className="flex flex-wrap gap-1">
                  {entry.signals.map((signal, idx) => (
                    <Badge key={idx} variant="secondary">{signal}</Badge>
                  ))}
                </div>
              </div>
            )}

            {entry.fires_focus && entry.fires_focus.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">FIRES Focus</p>
                <div className="flex gap-2">
                  {entry.fires_focus.map((el) => {
                    const config = FIRES_CONFIG[el as keyof typeof FIRES_CONFIG];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <Badge key={el} variant="outline" className={cn('gap-1.5', config.color)}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

function SessionCard({ 
  session, 
  sessionNumber,
  onActionToggle 
}: { 
  session: PortalSession; 
  sessionNumber: number;
  onActionToggle: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [updatingAction, setUpdatingAction] = useState<number | null>(null);
  const summaryPreview = session.summary ? (session.summary.length > 100 ? session.summary.slice(0, 100) + '...' : session.summary) : null;

  const handleActionToggle = async (actionIndex: number, completed: boolean) => {
    if (!session.action_items) return;
    
    setUpdatingAction(actionIndex);
    try {
      const updatedActions = session.action_items.map((item, idx) => 
        idx === actionIndex ? { ...item, completed } : item
      );

      const { error } = await supabase
        .from('session_transcripts')
        .update({ action_items: updatedActions })
        .eq('id', session.id);

      if (error) throw error;
      
      toast({
        title: completed ? "Action completed!" : "Action unchecked",
        description: session.action_items[actionIndex].text,
      });
      onActionToggle();
    } catch (error) {
      toast({
        title: "Error updating action",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setUpdatingAction(null);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-accent-foreground">
                {session.session_number || sessionNumber}
              </span>
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium">
                    Session {session.session_number || sessionNumber}
                  </h3>
                  {session.session_type && (
                    <Badge variant="outline">{session.session_type}</Badge>
                  )}
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(session.session_date), 'EEEE, MMMM d, yyyy')}
              </p>
              
              {!isOpen && summaryPreview && (
                <p className="text-sm leading-relaxed pt-2">{summaryPreview}</p>
              )}

              {!isOpen && session.key_themes && session.key_themes.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {session.key_themes.slice(0, 3).map((theme, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                  {session.key_themes.length > 3 && (
                    <Badge variant="secondary" className="text-xs">+{session.key_themes.length - 3}</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <CollapsibleContent className="mt-4 pt-4 border-t space-y-4">
            {session.summary && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
                <p className="text-sm leading-relaxed">{session.summary}</p>
              </div>
            )}

            {session.key_themes && session.key_themes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Key Themes</p>
                <div className="flex flex-wrap gap-1">
                  {session.key_themes.map((theme, idx) => (
                    <Badge key={idx} variant="secondary">{theme}</Badge>
                  ))}
                </div>
              </div>
            )}

            {session.key_quotes && session.key_quotes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Key Quotes</p>
                <div className="space-y-2">
                  {session.key_quotes.map((quote, idx) => (
                    <div key={idx} className="flex gap-2 p-2 rounded bg-muted/50">
                      <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm italic">"{quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {session.action_items && session.action_items.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Action Items</p>
                <div className="space-y-2">
                  {session.action_items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                      <Checkbox 
                        checked={item.completed}
                        disabled={updatingAction === idx}
                        onCheckedChange={(checked) => handleActionToggle(idx, checked as boolean)}
                        className="mt-0.5"
                      />
                      <span className={cn(
                        "text-sm flex-1",
                        item.completed && "line-through text-muted-foreground"
                      )}>
                        {item.text}
                      </span>
                      {item.completed && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
      </CardContent>
    </Card>
  );
}

function JourneySkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <Skeleton className="h-10 w-full sm:w-96" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
