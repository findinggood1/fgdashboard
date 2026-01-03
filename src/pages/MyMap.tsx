import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Client, Superpower, WorldAskingInsight, WeeklyAction, ZoneInterpretation } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Heart, Sparkles, Target, Flame, AlertCircle, Quote, Compass } from 'lucide-react';

// Local interface for what we fetch from the DB
interface ClientMapEngagement {
  id: string;
  client_email: string;
  start_date: string;
  end_date: string | null;
  status: string;
  current_week: number;
  current_phase: string;
  story_present: string | null;
  story_past: string | null;
  story_potential: string | null;
  zone_interpretation: ZoneInterpretation | null;
  superpowers_claimed: Superpower[] | null;
  superpowers_emerging: Superpower[] | null;
  superpowers_hidden: Superpower[] | null;
  world_asking: WorldAskingInsight[] | string[] | null;
  weekly_tracking: string | null;
  weekly_creating: string | null;
  weekly_actions: WeeklyAction[] | null;
  fires_focus: any;
  anchor_quote: string | null;
  ai_insights_generated_at: string | null;
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

      console.log('Fetching engagement for client:', selectedClientEmail);
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('coaching_engagements')
          .select(`
            id, client_email, start_date, end_date, status,
            current_week, current_phase, story_present, story_past, story_potential,
            zone_interpretation, superpowers_claimed, superpowers_emerging, superpowers_hidden,
            world_asking, weekly_tracking, weekly_creating, weekly_actions,
            fires_focus, anchor_quote, ai_insights_generated_at
          `)
          .eq('client_email', selectedClientEmail)
          .eq('status', 'active')
          .maybeSingle();

        console.log('Engagement query result:', { data, error });

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
            {/* The Story - 3Ps Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-amber-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                The Story
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Present */}
                <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/50 shadow-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-amber-200/50 flex items-center justify-center">
                        <Quote className="h-4 w-4 text-amber-700" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Present</span>
                    </div>
                    <p className="text-amber-900 italic leading-relaxed">
                      {engagement.story_present ? `"${engagement.story_present}"` : (
                        <span className="text-amber-500 not-italic">Not yet defined</span>
                      )}
                    </p>
                  </CardContent>
                </Card>

                {/* Past */}
                <Card className="border-rose-200/50 bg-gradient-to-br from-rose-50 to-pink-50/50 shadow-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-rose-200/50 flex items-center justify-center">
                        <Quote className="h-4 w-4 text-rose-700" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Past</span>
                    </div>
                    <p className="text-amber-900 italic leading-relaxed">
                      {engagement.story_past ? `"${engagement.story_past}"` : (
                        <span className="text-amber-500 not-italic">Not yet defined</span>
                      )}
                    </p>
                  </CardContent>
                </Card>

                {/* Potential */}
                <Card className="border-orange-200/50 bg-gradient-to-br from-orange-50 to-amber-50/50 shadow-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-orange-200/50 flex items-center justify-center">
                        <Quote className="h-4 w-4 text-orange-700" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Potential</span>
                    </div>
                    <p className="text-amber-900 italic leading-relaxed">
                      {engagement.story_potential ? `"${engagement.story_potential}"` : (
                        <span className="text-amber-500 not-italic">Not yet defined</span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Zone Section */}
            {engagement.zone_interpretation && (() => {
              const zoneData = engagement.zone_interpretation;
              const currentZone = zoneData.zone || zoneData.current_zone;
              
              if (!currentZone) return null;
              
              // Zone-specific colors
              const zoneColors: Record<string, { bg: string; border: string; text: string; accent: string; badge: string }> = {
                'Performing': { 
                  bg: 'from-amber-50 to-yellow-50', 
                  border: 'border-amber-300', 
                  text: 'text-amber-900',
                  accent: 'text-amber-600',
                  badge: 'bg-amber-500'
                },
                'Discovering': { 
                  bg: 'from-blue-50 to-sky-50', 
                  border: 'border-blue-300', 
                  text: 'text-blue-900',
                  accent: 'text-blue-600',
                  badge: 'bg-blue-500'
                },
                'Coasting': { 
                  bg: 'from-green-50 to-emerald-50', 
                  border: 'border-green-300', 
                  text: 'text-green-900',
                  accent: 'text-green-600',
                  badge: 'bg-green-500'
                },
                'Drifting': { 
                  bg: 'from-slate-50 to-gray-50', 
                  border: 'border-slate-300', 
                  text: 'text-slate-900',
                  accent: 'text-slate-600',
                  badge: 'bg-slate-500'
                },
                'Owning': { 
                  bg: 'from-purple-50 to-violet-50', 
                  border: 'border-purple-300', 
                  text: 'text-purple-900',
                  accent: 'text-purple-600',
                  badge: 'bg-purple-500'
                },
              };
              
              // Capitalize zone name for lookup
              const zoneKey = currentZone.charAt(0).toUpperCase() + currentZone.slice(1).toLowerCase();
              const colors = zoneColors[zoneKey] || zoneColors['Performing'];
              
              return (
                <Card className={`${colors.border} bg-gradient-to-br ${colors.bg} shadow-xl overflow-hidden`}>
                  <CardContent className="py-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-xl ${colors.badge} flex items-center justify-center shadow-lg`}>
                        <Compass className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className={`text-2xl font-bold ${colors.text} mb-1`}>
                          {zoneKey.toUpperCase()}
                        </h2>
                        {zoneData.headline && (
                          <p className={`text-sm font-medium ${colors.accent}`}>
                            {zoneData.headline}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {zoneData.description && (
                      <div className="mb-6">
                        <p className={`${colors.text} leading-relaxed`}>
                          {zoneData.description}
                        </p>
                      </div>
                    )}
                    
                    {zoneData.the_work && (
                      <div className={`p-4 rounded-lg bg-white/60 border ${colors.border}/50 mb-4`}>
                        <h3 className={`text-xs font-semibold uppercase tracking-wider ${colors.accent} mb-2`}>
                          The Work
                        </h3>
                        <p className={`${colors.text} font-medium`}>
                          {zoneData.the_work}
                        </p>
                      </div>
                    )}
                    
                    {zoneData.custom_note && (
                      <div className={`p-4 rounded-lg bg-white/40 border ${colors.border}/30`}>
                        <h3 className={`text-xs font-semibold uppercase tracking-wider ${colors.accent} mb-2`}>
                          Coach Note
                        </h3>
                        <p className={`${colors.text} italic`}>
                          {zoneData.custom_note}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
            {/* Superpowers */}
            {(engagement.superpowers_claimed?.length || engagement.superpowers_emerging?.length || engagement.superpowers_hidden?.length) && (
              <Card className="border-amber-200/50 bg-white/70 backdrop-blur shadow-xl">
                <CardContent className="py-8">
                  <h2 className="text-xl font-semibold text-amber-900 mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Your Superpowers
                  </h2>
                  <div className="space-y-6">
                    {engagement.superpowers_claimed && engagement.superpowers_claimed.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-amber-700 mb-3">Claimed</h3>
                        <div className="space-y-3">
                          {engagement.superpowers_claimed.map((sp, index) => (
                            <div key={index} className="p-4 rounded-lg bg-amber-50/50 border border-amber-200/50">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                  {sp.fires_element}
                                </Badge>
                              </div>
                              <p className="font-medium text-amber-900">{sp.superpower}</p>
                              {sp.description && (
                                <p className="text-sm text-amber-700/70 mt-1">{sp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {engagement.superpowers_emerging && engagement.superpowers_emerging.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-blue-700 mb-3">Emerging</h3>
                        <div className="space-y-3">
                          {engagement.superpowers_emerging.map((sp, index) => (
                            <div key={index} className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                  {sp.fires_element}
                                </Badge>
                              </div>
                              <p className="font-medium text-blue-900">{sp.superpower}</p>
                              {sp.description && (
                                <p className="text-sm text-blue-700/70 mt-1">{sp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {engagement.superpowers_hidden && engagement.superpowers_hidden.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-purple-700 mb-3">Hidden</h3>
                        <div className="space-y-3">
                          {engagement.superpowers_hidden.map((sp, index) => (
                            <div key={index} className="p-4 rounded-lg bg-purple-50/50 border border-purple-200/50">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                                  {sp.fires_element}
                                </Badge>
                              </div>
                              <p className="font-medium text-purple-900">{sp.superpower}</p>
                              {sp.description && (
                                <p className="text-sm text-purple-700/70 mt-1">{sp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
            {!engagement.story_present && !engagement.story_past && !engagement.story_potential &&
             (!engagement.superpowers_claimed || engagement.superpowers_claimed.length === 0) &&
             (!engagement.superpowers_emerging || engagement.superpowers_emerging.length === 0) &&
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
