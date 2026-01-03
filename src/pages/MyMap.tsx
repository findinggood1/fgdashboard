import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Client, Superpower, WorldAskingInsight, WeeklyAction } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Heart, Sparkles, Target, Flame, AlertCircle } from 'lucide-react';

// Local interface for what we fetch from the DB
interface ClientMapEngagement {
  id: string;
  client_id: string;
  client_email: string;
  start_date: string;
  end_date: string | null;
  status: string;
  current_week: number;
  current_phase: string;
  zone_start: string | null;
  zone_current: string | null;
  zone_interpretations: any;
  superpowers: Superpower[] | null;
  world_asking: WorldAskingInsight[] | null;
  weekly_tracking: string | null;
  weekly_creating: string | null;
  weekly_actions: WeeklyAction[] | null;
  fires_focus: any;
  story_lived: string | null;
  story_told: string | null;
  story_living: string | null;
}

export default function MyMap() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>('');
  const [engagement, setEngagement] = useState<ClientMapEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCoach = userRole === 'coach' || userRole === 'admin';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Fetch clients list for coach dropdown
  useEffect(() => {
    async function fetchClients() {
      if (!isCoach) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setClients(data || []);
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    }

    if (user && isCoach) {
      fetchClients();
    }
  }, [user, isCoach]);

  // Set default email based on user role
  useEffect(() => {
    if (!user?.email) return;
    
    if (!isCoach) {
      // Client viewing their own map
      setSelectedClientEmail(user.email);
    }
  }, [user?.email, isCoach]);

  // Fetch engagement when client email is selected
  useEffect(() => {
    async function fetchEngagement() {
      if (!selectedClientEmail) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('coaching_engagements')
          .select(`
            id, client_id, client_email, start_date, end_date, status,
            current_week, current_phase, zone_start, zone_current,
            zone_interpretations, superpowers, world_asking,
            weekly_tracking, weekly_creating, weekly_actions,
            fires_focus, story_lived, story_told, story_living
          `)
          .eq('client_email', selectedClientEmail)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;
        setEngagement(data);
      } catch (err) {
        console.error('Error fetching engagement:', err);
        setError('Unable to load the map. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchEngagement();
  }, [selectedClientEmail]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const selectedClient = clients.find(c => c.email === selectedClientEmail);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Warm decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-12">
        {/* Coach Client Selector */}
        {isCoach && (
          <Card className="mb-8 border-amber-200/50 bg-white/70 backdrop-blur">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-amber-800">Testing Mode: Select a client to preview their map</span>
              </div>
              <div className="mt-3">
                <Select value={selectedClientEmail} onValueChange={setSelectedClientEmail}>
                  <SelectTrigger className="w-full max-w-md bg-white">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.email}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 mb-6 shadow-lg">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600 bg-clip-text text-transparent mb-3">
            Your Narrative Integrity Map
          </h1>
          {selectedClient && (
            <p className="text-amber-700 mb-2">{selectedClient.name}</p>
          )}
          {engagement ? (
            <p className="text-lg text-amber-800/80">
              Week {engagement.current_week} of 12 • <span className="capitalize font-medium">{engagement.current_phase}</span> Phase
            </p>
          ) : selectedClientEmail ? (
            <p className="text-lg text-amber-800/60">Your personal journey awaits</p>
          ) : null}
        </div>

        {/* No client selected for coach */}
        {isCoach && !selectedClientEmail && (
          <Card className="border-amber-200/50 bg-white/70 backdrop-blur shadow-xl">
            <CardContent className="py-16 text-center">
              <MapPin className="h-12 w-12 text-amber-400 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-amber-900 mb-3">
                Select a Client
              </h2>
              <p className="text-amber-700/70 max-w-md mx-auto">
                Choose a client from the dropdown above to view their Narrative Integrity Map.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && selectedClientEmail && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-rose-200/50 bg-white/70 backdrop-blur shadow-xl">
            <CardContent className="py-12 text-center">
              <p className="text-rose-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* No engagement found */}
        {!loading && selectedClientEmail && !engagement && !error && (
          <Card className="border-rose-200/50 bg-white/70 backdrop-blur shadow-xl">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-rose-400" />
              </div>
              <h2 className="text-2xl font-semibold text-amber-900 mb-3">
                No Active Engagement Found
              </h2>
              <p className="text-amber-700/70 max-w-md mx-auto">
                {isCoach 
                  ? "This client doesn't have an active coaching engagement."
                  : "You don't have an active coaching engagement. Contact your coach to get started on your journey toward narrative integrity."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Engagement Content */}
        {!loading && engagement && (
          <div className="space-y-8">
            {/* Story Sections */}
            {(engagement.story_lived || engagement.story_told || engagement.story_living) && (
              <Card className="border-amber-200/50 bg-white/70 backdrop-blur shadow-xl">
                <CardContent className="py-8">
                  <h2 className="text-xl font-semibold text-amber-900 mb-6 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" />
                    Your Story
                  </h2>
                  <div className="space-y-6">
                    {engagement.story_lived && (
                      <div>
                        <h3 className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-2">Story Lived</h3>
                        <p className="text-amber-900">{engagement.story_lived}</p>
                      </div>
                    )}
                    {engagement.story_told && (
                      <div>
                        <h3 className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-2">Story Told</h3>
                        <p className="text-amber-900">{engagement.story_told}</p>
                      </div>
                    )}
                    {engagement.story_living && (
                      <div>
                        <h3 className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-2">Story Living</h3>
                        <p className="text-amber-900">{engagement.story_living}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Superpowers */}
            {engagement.superpowers && engagement.superpowers.length > 0 && (
              <Card className="border-amber-200/50 bg-white/70 backdrop-blur shadow-xl">
                <CardContent className="py-8">
                  <h2 className="text-xl font-semibold text-amber-900 mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Your Superpowers
                  </h2>
                  <div className="space-y-4">
                    {engagement.superpowers.map((sp, index) => (
                      <div key={index} className="p-4 rounded-lg bg-amber-50/50 border border-amber-200/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                            {sp.fires_element}
                          </Badge>
                        </div>
                        <p className="font-medium text-amber-900">{sp.superpower}</p>
                        {sp.evidence && (
                          <p className="text-sm text-amber-700/70 mt-1">{sp.evidence}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* What Your Story Is Asking */}
            {engagement.world_asking && engagement.world_asking.length > 0 && (
              <Card className="border-amber-200/50 bg-white/70 backdrop-blur shadow-xl">
                <CardContent className="py-8">
                  <h2 className="text-xl font-semibold text-amber-900 mb-6 flex items-center gap-2">
                    <Target className="h-5 w-5 text-rose-500" />
                    What Your Story Is Asking of You
                  </h2>
                  <div className="space-y-4">
                    {engagement.world_asking.map((item, index) => (
                      <div key={index} className="p-4 rounded-lg bg-rose-50/50 border border-rose-200/50">
                        <p className="text-amber-900">{item?.insight || 'Insight pending...'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* This Week's Focus */}
            {(engagement.weekly_tracking || engagement.weekly_creating || (engagement.weekly_actions && engagement.weekly_actions.length > 0)) && (
              <Card className="border-amber-200/50 bg-white/70 backdrop-blur shadow-xl">
                <CardContent className="py-8">
                  <h2 className="text-xl font-semibold text-amber-900 mb-6 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    This Week's Focus
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {engagement.weekly_tracking && (
                      <div>
                        <h3 className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-2">What I'm Tracking</h3>
                        <p className="text-amber-900 p-3 rounded-lg bg-amber-50/50 border border-amber-200/50">
                          {engagement.weekly_tracking}
                        </p>
                      </div>
                    )}
                    {engagement.weekly_creating && (
                      <div>
                        <h3 className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-2">What I'm Creating</h3>
                        <p className="text-amber-900 p-3 rounded-lg bg-amber-50/50 border border-amber-200/50">
                          {engagement.weekly_creating}
                        </p>
                      </div>
                    )}
                  </div>

                  {engagement.weekly_actions && engagement.weekly_actions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-3">Weekly Actions</h3>
                      <div className="space-y-3">
                        {engagement.weekly_actions.map((action, index) => (
                          <div 
                            key={index} 
                            className={`p-4 rounded-lg border ${
                              action.status === 'completed' 
                                ? 'bg-green-50/50 border-green-200/50' 
                                : 'bg-orange-50/50 border-orange-200/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                action.status === 'completed'
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-orange-400'
                              }`}>
                                {action.status === 'completed' && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className={`text-amber-900 ${action.status === 'completed' ? 'line-through opacity-70' : ''}`}>
                                  {action.action}
                                </p>
                                {action.fires_element && (
                                  <Badge variant="outline" className="mt-2 bg-orange-100 text-orange-800 border-orange-300 text-xs">
                                    {action.fires_element}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Empty state when engagement exists but no content yet */}
            {!engagement.story_lived && !engagement.story_told && !engagement.story_living &&
             (!engagement.superpowers || engagement.superpowers.length === 0) &&
             (!engagement.world_asking || engagement.world_asking.length === 0) &&
             !engagement.weekly_tracking && !engagement.weekly_creating &&
             (!engagement.weekly_actions || engagement.weekly_actions.length === 0) && (
              <Card className="border-amber-200/50 bg-white/70 backdrop-blur shadow-xl">
                <CardContent className="py-16 text-center">
                  <Heart className="h-12 w-12 text-rose-400 mx-auto mb-6 animate-pulse" />
                  <h2 className="text-2xl font-semibold text-amber-900 mb-3">
                    Your journey map is being built...
                  </h2>
                  <p className="text-amber-700/70 max-w-md mx-auto">
                    Your coach is working on crafting your personalized Narrative Integrity Map. 
                    Check back soon to explore your story, superpowers, and weekly focus.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-amber-600/50 text-sm mt-8">
          Powered by FIRES Framework
        </p>
      </div>
    </div>
  );
}
