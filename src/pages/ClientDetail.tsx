import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useClientDetail } from '@/hooks/useClientDetail';
import { supabase, ClientStatus } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText, Calendar, MessageSquare, Map, ClipboardList, Crosshair, Star, CheckCircle } from 'lucide-react';
import { ClientDetailHeader } from '@/components/client-detail/ClientDetailHeader';
import { ClientSummaryCards } from '@/components/client-detail/ClientSummaryCards';
import { StorySection } from '@/components/client-detail/StorySection';
import { GoalsChallengesSection } from '@/components/client-detail/GoalsChallengesSection';
import { FiresFocusSection } from '@/components/client-detail/FiresFocusSection';
import { RecentActivity } from '@/components/client-detail/RecentActivity';
import { ActivityFeed } from '@/components/client-detail/ActivityFeed';
import { AssessmentsSection } from '@/components/client-detail/AssessmentsSection';
import { PredictionsCard } from '@/components/client-detail/PredictionsCard';
import { StartEngagementWizard } from '@/components/client-detail/StartEngagementWizard';
import { DeleteClientModal } from '@/components/clients/DeleteClientModal';
import { SessionsTab } from '@/components/client-detail/tabs/SessionsTab';
import { ImpactTab } from '@/components/client-detail/tabs/ImpactTab';
import { PrioritiesTab } from '@/components/client-detail/tabs/PrioritiesTab';
import { NotesTab } from '@/components/client-detail/tabs/NotesTab';
import { NarrativeMapTab } from '@/components/client-detail/tabs/NarrativeMapTab';
import { AssignmentsTab } from '@/components/client-detail/tabs/AssignmentsTab';
import { AddSessionModal } from '@/components/client-detail/tabs/AddSessionModal';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Tab loading skeleton
function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default function ClientDetail() {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { coachData } = useAuth();
  const { client, engagement, snapshots, impactVerifications, sessions, assessments, notes, memos, assignments, nextScheduledSession, loading, updateEngagement, refetch } = useClientDetail(email);
  const [activeTab, setActiveTab] = useState('overview');
  const [engagementWizardOpen, setEngagementWizardOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addSessionModalOpen, setAddSessionModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const latestSnapshot = snapshots[0] || null;

  // Filter for only past activities
  const lastActivity = useMemo(() => {
    const now = new Date();
    const activities = [
      ...snapshots.filter(s => new Date(s.created_at) < now).map((s) => ({ date: s.created_at, type: 'snapshot' })),
      ...impactVerifications.filter(i => new Date(i.created_at) < now).map((i) => ({ date: i.created_at, type: 'impact' })),
      ...sessions.filter(s => new Date(s.session_date) < now).map((s) => ({ date: s.session_date, type: 'session' })),
      ...notes.filter(n => new Date(n.created_at) < now).map((n) => ({ date: n.created_at, type: 'note' })),
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

  const handleStatusChange = async (status: ClientStatus) => {
    if (!client) return;
    
    try {
      const updateData: Record<string, unknown> = { status };
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = coachData?.id || null;
      }

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', client.id);

      if (error) throw error;
      
      toast({ 
        title: 'Status updated', 
        description: `Client status changed to ${status}.` 
      });
      refetch();
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: 'Failed to update client status.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleted = () => {
    toast({ title: 'Client deleted', description: 'The client has been removed.' });
    navigate('/clients');
  };

  const tabs = [
    { value: 'overview', label: 'Overview', icon: FileText },
    { value: 'sessions', label: 'Sessions', icon: Calendar },
    { value: 'assignments', label: 'Assignments', icon: ClipboardList },
    { value: 'predictions', label: 'Predictions', icon: Crosshair },
    { value: 'proof', label: 'Proof', icon: CheckCircle },
    { value: 'priorities', label: 'Priorities', icon: Star },
    { value: 'notes', label: 'Notes', icon: MessageSquare },
    { value: 'narrative-map', label: 'Map', icon: Map },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link to="/clients">
          <Button variant="ghost" className="gap-2 -ml-2 min-h-[44px]">
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground">Client not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            The client you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/clients">
            <Button className="mt-4">View All Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/clients">
        <Button variant="ghost" className="gap-2 -ml-2 min-h-[44px]">
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
      </Link>

      <ClientDetailHeader
        client={client}
        engagement={engagement}
        latestSnapshot={latestSnapshot}
        onAddNote={() => handleAction('Add Note')}
        onAddSession={() => setAddSessionModalOpen(true)}
        onStartEngagement={() => setEngagementWizardOpen(true)}
        onStatusChange={handleStatusChange}
        onDelete={() => setDeleteModalOpen(true)}
      />

      <StartEngagementWizard
        open={engagementWizardOpen}
        onOpenChange={setEngagementWizardOpen}
        clientEmail={client.email}
        onSuccess={refetch}
      />

      <DeleteClientModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        client={client}
        onDeleted={handleDeleted}
      />

      <AddSessionModal
        open={addSessionModalOpen}
        onOpenChange={setAddSessionModalOpen}
        clientEmail={client.email}
        engagementId={engagement?.id}
        nextSessionNumber={(sessions.length || 0) + 1}
        onSuccess={refetch}
      />

      <ClientSummaryCards 
        latestSnapshot={latestSnapshot} 
        lastActivity={lastActivity} 
        nextScheduledSession={nextScheduledSession}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn(
          "w-full",
          isMobile && "flex-nowrap justify-start gap-1"
        )}>
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className={cn(
                "gap-1.5",
                isMobile && "flex-shrink-0 px-3"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className={cn(isMobile && "hidden sm:inline")}>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <StorySection engagement={engagement} onUpdate={updateEngagement} onStartEngagement={() => setEngagementWizardOpen(true)} />
          <GoalsChallengesSection engagement={engagement} onUpdate={updateEngagement} />
          <FiresFocusSection engagement={engagement} latestSnapshot={latestSnapshot} onUpdate={updateEngagement} />
          <AssessmentsSection
            assessments={assessments}
            clientEmail={client?.email || ''}
            engagementId={engagement?.id}
            onRefresh={refetch}
          />
          <RecentActivity activities={recentActivities} />
          <ActivityFeed clientEmail={client?.email || ''} limit={5} />
        </TabsContent>

        <TabsContent value="predictions" className="mt-6">
          <PredictionsCard clientEmail={client?.email || ''} />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsTab
            sessions={sessions}
            clientEmail={client?.email || ''}
            engagementId={engagement?.id}
            onRefresh={refetch}
          />
        </TabsContent>
        
        <TabsContent value="assignments">
          <AssignmentsTab
            assignments={assignments}
            clientEmail={client?.email || ''}
            engagementId={engagement?.id}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="proof">
          <ImpactTab impacts={impactVerifications} />
        </TabsContent>

        <TabsContent value="priorities">
          <PrioritiesTab impacts={impactVerifications} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab notes={notes} memos={memos} sessions={sessions} clientEmail={client?.email || ''} onRefresh={refetch} />
        </TabsContent>
        
        <TabsContent value="narrative-map">
          <NarrativeMapTab engagement={engagement} clientName={client?.name} clientEmail={client?.email || ''} latestSnapshot={latestSnapshot} refetch={refetch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
