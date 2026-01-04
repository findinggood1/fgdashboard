import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AddClientModal } from '@/components/clients/AddClientModal';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { Smartphone } from 'lucide-react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  UserPlus,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Camera,
  Target,
  Play,
  CheckCircle,
  ClipboardList,
  AlertTriangle,
  Clock,
  ArrowRight,
  BarChart3,
  PieChart,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASE_LABELS: Record<string, string> = {
  name: 'NAME',
  validate: 'VALIDATE',
  communicate: 'COMMUNICATE',
};

const ZONE_COLORS: Record<string, string> = {
  green: 'bg-success text-success-foreground',
  yellow: 'bg-warning text-warning-foreground',
  red: 'bg-destructive text-destructive-foreground',
  blue: 'bg-primary text-primary-foreground',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { userRole, coachData } = useAuth();
  const { stats, upcomingSessions, activityFeed, attentionClients, analytics, portalLoginStats, loading } = useDashboard();
  const { addClient } = useClients();
  const [showAddClient, setShowAddClient] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);

  const isAdmin = userRole === 'admin';
  const today = new Date();

  const handleAddClient = async (data: { email: string; name: string; phone?: string; notes?: string }) => {
    try {
      await addClient(data);
      toast.success('Client added successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add client');
      throw err;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'snapshot': return Camera;
      case 'impact': return Target;
      case 'session': return Play;
      case 'engagement_started': return Play;
      case 'engagement_completed': return CheckCircle;
      case 'assessment': return ClipboardList;
      default: return Clock;
    }
  };

  const getAttentionBadge = (reason: string, week?: number) => {
    switch (reason) {
      case 'inactive':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">14+ days inactive</Badge>;
      case 'final_week':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Week {week} of 12</Badge>;
      case 'overdue_assignment':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Overdue assignment</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">
            Welcome back{coachData?.name ? `, ${coachData.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clients
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClients}</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Engagements
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEngagements}</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sessions This Week
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sessionsThisWeek}</div>
          </CardContent>
        </Card>

        {/* Portal Login Stats */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Portal Logins
            </CardTitle>
            <Smartphone className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portalLoginStats?.clientsLoggedIn || 0}
              <span className="text-sm font-normal text-muted-foreground">
                /{portalLoginStats?.totalClients || 0}
              </span>
            </div>
            {portalLoginStats?.lastLogin && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                Last: {portalLoginStats.lastLogin.name.split(' ')[0]} • {formatDistanceToNow(new Date(portalLoginStats.lastLogin.timestamp), { addSuffix: true })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Sessions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-serif">Upcoming Sessions</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Calendar className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No upcoming sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/clients/${encodeURIComponent(session.clientEmail)}`)}
                  >
                    <div>
                      <p className="font-medium text-sm">{session.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        Session {session.sessionNumber} • {format(new Date(session.sessionDate), 'EEE, MMM d')}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="font-serif">Recent Activity</CardTitle>
            <CardDescription>Latest updates from your clients</CardDescription>
          </CardHeader>
          <CardContent>
            {activityFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (() => {
              const limit = 5;
              const items = activityExpanded ? activityFeed : activityFeed.slice(0, limit);
              const hasMore = activityFeed.length > limit;

              return (
                <>
                  <div className="space-y-3">
                    {items.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/clients/${encodeURIComponent(activity.clientEmail)}`)}
                        >
                          <div className="p-2 rounded-full bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{activity.clientName}</span>
                              {' '}
                              <span className="text-muted-foreground">{activity.description}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {hasMore && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setActivityExpanded((v) => !v)}
                    >
                      {activityExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          See more ({activityFeed.length - limit} more)
                        </>
                      )}
                    </Button>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Clients Needing Attention */}
      {attentionClients.length > 0 && (
        <Card className="shadow-soft border-warning/30">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Clients Needing Attention
            </CardTitle>
            <CardDescription>Clients who may need follow-up</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {attentionClients.map((client) => (
                <div
                  key={client.email}
                  className="p-4 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/clients/${encodeURIComponent(client.email)}`)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm truncate">{client.name}</p>
                    {getAttentionBadge(client.reason, client.engagementWeek)}
                  </div>
                  {client.lastActivity && (
                    <p className="text-xs text-muted-foreground">
                      Last activity: {format(new Date(client.lastActivity), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowAddClient(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add New Client
            </Button>
            <Button variant="outline" onClick={() => navigate('/clients')} className="gap-2">
              <Users className="h-4 w-4" />
              View All Clients
            </Button>
            <Button variant="outline" onClick={() => navigate('/chat')} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Coach Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Section (Collapsible) */}
      {analytics && (
        <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <Card className="shadow-soft">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle className="font-serif">Analytics Overview</CardTitle>
                  </div>
                  {analyticsOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Snapshots Comparison */}
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Snapshots</p>
                    </div>
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-2xl font-bold">{analytics.snapshotsThisMonth}</p>
                        <p className="text-xs text-muted-foreground">This month</p>
                      </div>
                      <div className="text-muted-foreground">
                        <p className="text-lg">{analytics.snapshotsLastMonth}</p>
                        <p className="text-xs">Last month</p>
                      </div>
                    </div>
                  </div>

                  {/* Engagements by Phase */}
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Engagements by Phase</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">NAME</span>
                        <Badge variant="outline">{analytics.engagementsByPhase.name}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">VALIDATE</span>
                        <Badge variant="outline">{analytics.engagementsByPhase.validate}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">COMMUNICATE</span>
                        <Badge variant="outline">{analytics.engagementsByPhase.communicate}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Zone Distribution */}
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <PieChart className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Zone Distribution</p>
                    </div>
                    {analytics.zoneDistribution.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No data yet</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.zoneDistribution.map((z) => (
                          <div key={z.zone} className="flex items-center justify-between">
                            <Badge className={cn('capitalize', ZONE_COLORS[z.zone] || 'bg-muted')}>
                              {z.zone}
                            </Badge>
                            <span className="text-sm font-medium">{z.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Admin Overview */}
      {isAdmin && (
        <Card className="shadow-soft border-accent/30">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              Admin Overview
            </CardTitle>
            <CardDescription>System-wide metrics and management tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate('/events')} className="gap-2">
                <Calendar className="h-4 w-4" />
                Manage Events
              </Button>
              <Button variant="outline" onClick={() => navigate('/analytics')} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        open={showAddClient}
        onOpenChange={setShowAddClient}
        onSubmit={handleAddClient}
      />
    </div>
  );
}
