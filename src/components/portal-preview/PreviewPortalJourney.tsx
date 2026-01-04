import { useState } from 'react';
import { usePortalDataForClient } from '@/hooks/usePortalDataForClient';
import { usePortalPreview } from './PortalPreviewContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Flame
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const FIRES_CONFIG = {
  feelings: { label: 'Feelings', icon: Heart, color: 'text-rose-500' },
  influence: { label: 'Influence', icon: Users, color: 'text-blue-500' },
  resilience: { label: 'Resilience', icon: Shield, color: 'text-emerald-500' },
  ethics: { label: 'Ethics', icon: Compass, color: 'text-purple-500' },
  strengths: { label: 'Strengths', icon: Sparkles, color: 'text-amber-500' },
};

const ZONE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  green: { label: 'Thriving', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  yellow: { label: 'Growing', color: 'text-amber-700', bg: 'bg-amber-100' },
  orange: { label: 'Stretching', color: 'text-orange-700', bg: 'bg-orange-100' },
  red: { label: 'Challenged', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function PreviewPortalJourney() {
  const previewContext = usePortalPreview();
  const { snapshots, impactEntries, sessions, isLoading } = usePortalDataForClient(previewContext?.clientEmail);
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
                <Card key={snapshot.id}>
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

                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-muted-foreground mb-3">
                          {format(parseISO(snapshot.created_at), 'MMMM d, yyyy')}
                        </p>
                        <div className="space-y-2">
                          {snapshot.goal && (
                            <p className="text-sm"><span className="text-muted-foreground">Goal:</span> {snapshot.goal}</p>
                          )}
                          {snapshot.growth_opportunity_category && (
                            <p className="text-sm"><span className="text-muted-foreground">Growth Area:</span> {snapshot.growth_opportunity_category}</p>
                          )}
                          <div className="flex gap-4 pt-1">
                            {snapshot.total_confidence !== null && (
                              <span className="text-sm">Confidence: <strong>{snapshot.total_confidence}</strong></span>
                            )}
                            {snapshot.total_alignment !== null && (
                              <span className="text-sm">Alignment: <strong>{snapshot.total_alignment}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                <Card key={entry.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">
                            {entry.type === 'self' ? 'Impact on Self' : 'Impact on Others'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(entry.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {entry.integrity_line !== null && (
                          <p className="text-sm">Integrity Line: <strong>{entry.integrity_line}</strong></p>
                        )}
                        {entry.fires_focus && entry.fires_focus.length > 0 && (
                          <div className="flex gap-2 pt-1">
                            {entry.fires_focus.map((el) => {
                              const config = FIRES_CONFIG[el as keyof typeof FIRES_CONFIG];
                              if (!config) return null;
                              const Icon = config.icon;
                              return (
                                <Icon key={el} className={cn('h-4 w-4', config.color)} />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                <Card key={session.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-accent-foreground">
                          {sessions.length - index}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">
                            Session {sessions.length - index}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(session.session_date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        {session.summary && (
                          <p className="text-sm leading-relaxed pt-2">{session.summary}</p>
                        )}
                        {session.key_themes && session.key_themes.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {session.key_themes.map((theme, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
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
