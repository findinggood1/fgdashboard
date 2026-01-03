import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Client } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Eye } from 'lucide-react';
import PortalHomePreview from '@/components/portal-preview/PortalHomePreview';

export default function ClientPortalPreview() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Banner */}
      <Card className="border-warning bg-warning/10">
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
        <Card className="border-dashed">
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

      {/* Portal Preview Content */}
      {selectedClient && (
        <PortalHomePreview clientEmail={selectedClientEmail} clientData={selectedClient} />
      )}
    </div>
  );
}
