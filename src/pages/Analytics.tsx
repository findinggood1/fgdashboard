import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Target, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

export default function Analytics() {
  const { userRole } = useAuth();
  const { stats, clientGrowth, sessionDistribution, toolUsage, loading } = useAnalytics();

  // Only admins can access this page
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-semibold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Practice-wide metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clients
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Engagements
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEngagements}</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sessions This Month
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sessionsThisMonth}</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Client Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgClientProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-serif">Client Growth</CardTitle>
            <CardDescription>Cumulative clients over time</CardDescription>
          </CardHeader>
          <CardContent>
            {clientGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={clientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clients" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No client data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-serif">Session Distribution</CardTitle>
            <CardDescription>Sessions by client</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sessionDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No session data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tool Usage */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif">Tool Usage Analytics</CardTitle>
          <CardDescription>Snapshots, Sessions, and Impact Verifications</CardDescription>
        </CardHeader>
        <CardContent>
          {toolUsage.some(t => t.count > 0) ? (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={toolUsage.filter(t => t.count > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {toolUsage.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center space-y-4">
                {toolUsage.map((tool, index) => (
                  <div key={tool.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{tool.name}</span>
                    </div>
                    <span className="text-lg font-bold">{tool.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <p>No tool usage data yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
