import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Client } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Eye, Home, Map, MessageCircle, Compass, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

// Preview components
import { PortalPreviewProvider } from '@/components/portal-preview/PortalPreviewContext';
import PreviewPortalHome from '@/components/portal-preview/PreviewPortalHome';
import PreviewPortalJourney from '@/components/portal-preview/PreviewPortalJourney';
import PreviewPortalMap from '@/components/portal-preview/PreviewPortalMap';
import PreviewPortalChat from '@/components/portal-preview/PreviewPortalChat';

type PreviewTab = 'home' | 'journey' | 'map' | 'chat';

const navItems = [
  { key: 'home' as const, icon: Home, label: 'Home' },
  { key: 'journey' as const, icon: Map, label: 'Journey' },
  { key: 'map' as const, icon: Compass, label: 'My Map' },
  { key: 'chat' as const, icon: MessageCircle, label: 'Chat' },
];

export default function ClientPortalPreview() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PreviewTab>('home');

  const isCoach = userRole === 'coach' || userRole === 'admin';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Redirect non-coaches
  useEffect(() => {
    if (!authLoading && user && !isCoach) {
      navigate('/portal');
    }
  }, [authLoading, user, isCoach, navigate]);

  // Fetch clients list
  useEffect(() => {
    async function fetchClients() {
      if (!isCoach) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('status', 'approved')
          .order('name');
        
        if (error) throw error;
        setClients(data || []);
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user && isCoach) {
      fetchClients();
    }
  }, [user, isCoach]);

  const selectedClient = clients.find(c => c.email === selectedClientEmail);
  const firstName = selectedClient?.name?.split(' ')[0] || 'Client';

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Coach Preview Banner */}
      <Card className="border-warning bg-warning/10 rounded-b-none">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-warning-foreground">Client Portal Preview Mode</p>
                <p className="text-sm text-muted-foreground">
                  {selectedClient 
                    ? `Viewing as: ${selectedClient.name}` 
                    : 'Select a client to preview their portal view'}
                </p>
              </div>
            </div>
            
            <div className="sm:ml-auto">
              <Select value={selectedClientEmail} onValueChange={setSelectedClientEmail}>
                <SelectTrigger className="w-full sm:w-72 bg-background">
                  <SelectValue placeholder="Select a client to preview..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.email}>
                      <div className="flex items-center gap-2">
                        <span>{client.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {client.email}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No client selected */}
      {!selectedClientEmail && (
        <Card className="border-dashed mt-6">
          <CardContent className="py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Select a Client
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose a client from the dropdown above to preview their portal experience.
              You'll see exactly what they see when they log in.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading clients */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Full Portal Preview */}
      {selectedClient && (
        <PortalPreviewProvider clientEmail={selectedClientEmail} clientData={selectedClient}>
          <div className="min-h-[calc(100vh-12rem)] bg-background border border-t-0 border-border rounded-b-lg overflow-hidden">
            {/* Simulated Portal Header */}
            <header className="sticky top-0 z-40 bg-card border-b border-border">
              <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                  {/* Logo */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                      <span className="text-sm font-serif text-primary-foreground font-bold">FG</span>
                    </div>
                    <span className="font-serif text-lg font-medium text-foreground hidden sm:block">
                      Finding Good
                    </span>
                  </div>

                  {/* Navigation */}
                  <nav className="flex items-center gap-1">
                    {navItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          activeTab === item.key
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                      </button>
                    ))}
                  </nav>

                  {/* User Menu (Display only) */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground hidden sm:block">
                      {firstName}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      className="text-muted-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {activeTab === 'home' && <PreviewPortalHome />}
                {activeTab === 'journey' && <PreviewPortalJourney />}
                {activeTab === 'map' && <PreviewPortalMap />}
                {activeTab === 'chat' && <PreviewPortalChat />}
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-6">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Powered by{' '}
                  <span className="font-serif font-medium text-foreground">Finding Good</span>
                </p>
              </div>
            </footer>
          </div>
        </PortalPreviewProvider>
      )}
    </div>
  );
}
