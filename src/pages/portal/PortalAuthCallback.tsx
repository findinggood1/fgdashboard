import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function PortalAuthCallback() {
  const navigate = useNavigate();
  const { user, userRole, clientData, loading, roleLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [sessionHandled, setSessionHandled] = useState(false);

  // Log URL for debugging
  useEffect(() => {
    console.log('[PortalAuthCallback] window.location.href:', window.location.href);
  }, []);

  // Handle PKCE code exchange
  useEffect(() => {
    const handleCodeExchange = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const errorParam = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      if (errorParam) {
        console.error('[PortalAuthCallback] Auth error:', errorParam, errorDescription);
        setError(errorDescription || errorParam);
        return;
      }

      if (code) {
        console.log('[PortalAuthCallback] Exchanging code for session...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('[PortalAuthCallback] Session exchange error:', exchangeError);
          setError(exchangeError.message);
          return;
        }
        console.log('[PortalAuthCallback] Session exchange successful');
      }

      setSessionHandled(true);
    };

    handleCodeExchange();
  }, []);

  // Route based on role/status after session is ready
  useEffect(() => {
    if (!sessionHandled) return;
    if (loading || roleLoading) return;

    console.log('[PortalAuthCallback] Routing - user:', user?.email, 'role:', userRole, 'clientData:', clientData);

    if (!user) {
      console.log('[PortalAuthCallback] No user, redirecting to portal login');
      navigate('/portal/login', { replace: true });
      return;
    }

    // Coach or admin goes to dashboard
    if (userRole === 'coach' || userRole === 'admin') {
      console.log('[PortalAuthCallback] Coach/admin detected, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Client routing based on status
    if (userRole === 'client' && clientData) {
      switch (clientData.status) {
        case 'approved':
          console.log('[PortalAuthCallback] Approved client, redirecting to portal');
          navigate('/portal', { replace: true });
          break;
        case 'pending':
          console.log('[PortalAuthCallback] Pending client, redirecting to access-pending');
          navigate('/access-pending', { replace: true });
          break;
        case 'inactive':
        case 'deleted':
          console.log('[PortalAuthCallback] Inactive/deleted client, redirecting to access-revoked');
          navigate('/access-revoked', { replace: true });
          break;
        default:
          console.log('[PortalAuthCallback] Unknown status, redirecting to no-account');
          navigate('/no-account', { replace: true });
      }
      return;
    }

    // No client record found
    if (user && !clientData && !roleLoading) {
      console.log('[PortalAuthCallback] No client record, redirecting to no-account');
      navigate('/no-account', { replace: true });
    }
  }, [sessionHandled, user, userRole, clientData, loading, roleLoading, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Authentication Error</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => navigate('/portal/login', { replace: true })}
            className="text-primary underline text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
