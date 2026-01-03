import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, Heart } from 'lucide-react';

interface Engagement {
  id: string;
  current_week: number;
  current_phase: string;
  status: string;
}

export default function MyMap() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    async function fetchEngagement() {
      if (!user?.email) return;

      try {
        const { data, error } = await supabase
          .from('coaching_engagements')
          .select('id, current_week, current_phase, status')
          .eq('client_email', user.email)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;
        setEngagement(data);
      } catch (err) {
        console.error('Error fetching engagement:', err);
        setError('Unable to load your map. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (user?.email) {
      fetchEngagement();
    }
  }, [user?.email]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 bg-white/80 backdrop-blur">
          <CardContent className="py-12 text-center">
            <p className="text-rose-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Warm decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 mb-6 shadow-lg">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600 bg-clip-text text-transparent mb-3">
            Your Narrative Integrity Map
          </h1>
          {engagement ? (
            <p className="text-lg text-amber-800/80">
              Week {engagement.current_week} of 12 • <span className="capitalize font-medium">{engagement.current_phase}</span> Phase
            </p>
          ) : (
            <p className="text-lg text-amber-800/60">Your personal journey awaits</p>
          )}
        </div>

        {/* Content */}
        {engagement ? (
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
        ) : (
          <Card className="border-rose-200/50 bg-white/70 backdrop-blur shadow-xl">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-rose-400" />
              </div>
              <h2 className="text-2xl font-semibold text-amber-900 mb-3">
                No Active Coaching Engagement
              </h2>
              <p className="text-amber-700/70 max-w-md mx-auto">
                You don't have an active coaching engagement. Contact your coach to get started 
                on your journey toward narrative integrity.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-amber-600/50 text-sm mt-8">
          Powered by FIRES Framework
        </p>
      </div>
    </div>
  );
}
