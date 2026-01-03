import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClientDetail } from '@/hooks/useClientDetail';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { ClientDetailHeader } from '@/components/client-detail/ClientDetailHeader';
import { ClientSummaryCards } from '@/components/client-detail/ClientSummaryCards';
import { StorySection } from '@/components/client-detail/StorySection';
import { GoalsChallengesSection } from '@/components/client-detail/GoalsChallengesSection';
import { FiresFocusSection } from '@/components/client-detail/FiresFocusSection';
import { MoreLessSummary } from '@/components/client-detail/MoreLessSummary';
import { RecentActivity } from '@/components/client-detail/RecentActivity';
import { SessionsTab } from '@/components/client-detail/tabs/SessionsTab';
import { SnapshotsTab } from '@/components/client-detail/tabs/SnapshotsTab';
import { ImpactTab } from '@/components/client-detail/tabs/ImpactTab';
import { FilesTab } from '@/components/client-detail/tabs/FilesTab';
import { MoreLessTab } from '@/components/client-detail/tabs/MoreLessTab';
import { NotesTab } from '@/components/client-detail/tabs/NotesTab';
import { NarrativeMapTab } from '@/components/client-detail/tabs/NarrativeMapTab';
import { useToast } from '@/hooks/use-toast';

export default function ClientDetail() {
  const { email } = useParams<{ email: string }>();
  const { toast } = useToast();
  const { client, engagement, snapshots, impactVerifications, sessions, markers, notes, files, loading, updateEngagement, refetch } = useClientDetail(email);
  const [activeTab, setActiveTab] = useState('overview');

  const latestSnapshot = snapshots[0] || null;

  const lastActivity = useMemo(() => {
    const activities = [
      ...snapshots.map((s) => ({ date: s.created_at, type: 'snapshot' })),
      ...impactVerifications.map((i) => ({ date: i.created_at, type: 'impact' })),
      ...sessions.map((s) => ({ date: s.created_at, type: 'session' })),
      ...notes.map((n) => ({ date: n.created_at, type: 'note' })),
    ];
    if (activities.length === 0) return null;
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [snapshots, impactVerifications, sessions, notes]);

  const recentActivities = useMemo(() => {
    const all = [
      ...snapshots.slice(0, 5).map((s) => ({ id: s.id, type: 'snapshot' as const, description: `Zone: ${s.overall_zone}`, date: s.created_at })),
      ...sessions.slice(0, 5).map((s) => ({ id: s.id, type: 'session' as const, description: s.summary || `Session ${s.session_number}`, date: s.created_at })),
      ...notes.slice(0, 5).map((n) => ({ id: n.id, type: 'note' as const, description: n.content.slice(0, 50) + '...', date: n.created_at })),
    ];
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [snapshots, sessions, notes]);

  const handleAction = (action: string) => {
    toast({ title: `${action} coming soon`, description: 'This feature is under development.' });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link to="/clients"><Button variant="ghost" className="gap-2 -ml-2"><ArrowLeft className="h-4 w-4" />Back to Clients</Button></Link>
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Client not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/clients"><Button variant="ghost" className="gap-2 -ml-2"><ArrowLeft className="h-4 w-4" />Back to Clients</Button></Link>

      <ClientDetailHeader
        client={client}
        engagement={engagement}
        latestSnapshot={latestSnapshot}
        onAddNote={() => handleAction('Add Note')}
        onAddSession={() => handleAction('Add Session')}
        onUploadFile={() => setActiveTab('files')}
        onStartEngagement={() => handleAction('Start Engagement')}
      />

      <ClientSummaryCards latestSnapshot={latestSnapshot} lastActivity={lastActivity} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="moreless">More/Less</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="narrative-map">Narrative Map</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <StorySection engagement={engagement} onUpdate={updateEngagement} onStartEngagement={() => handleAction('Start Engagement')} />
          <GoalsChallengesSection engagement={engagement} />
          <FiresFocusSection engagement={engagement} latestSnapshot={latestSnapshot} />
          <MoreLessSummary markers={markers} onViewAll={() => setActiveTab('moreless')} />
          <RecentActivity activities={recentActivities} />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsTab 
            sessions={sessions} 
            clientEmail={client?.email || ''} 
            engagementId={engagement?.id}
            onRefresh={refetch}
          />
        </TabsContent>
        <TabsContent value="snapshots"><SnapshotsTab snapshots={snapshots} /></TabsContent>
        <TabsContent value="impact"><ImpactTab impacts={impactVerifications} /></TabsContent>
        <TabsContent value="files"><FilesTab files={files} clientEmail={client?.email || ''} engagementId={engagement?.id} onRefresh={refetch} /></TabsContent>
        <TabsContent value="moreless"><MoreLessTab markers={markers} onRefresh={refetch} /></TabsContent>
        <TabsContent value="notes"><NotesTab notes={notes} /></TabsContent>
        <TabsContent value="narrative-map"><NarrativeMapTab engagement={engagement} clientName={client?.name} latestSnapshot={latestSnapshot} refetch={refetch} /></TabsContent>
      </Tabs>
    </div>
  );
}
