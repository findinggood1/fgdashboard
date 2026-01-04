import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().trim().email('Please enter a valid email address');

export default function PortalLogin() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [linkSent, setLinkSent] = useState(false);
  const { user, userRole, clientData, loading, roleLoading } = useAuth();
  const navigate = useNavigate();

  // Handle routing after auth state is determined
  useEffect(() => {
    if (loading || roleLoading || !user) return;

    console.log('[PortalLogin] Auth state:', { userRole, clientStatus: clientData?.status });

    // Route based on user role
    if (userRole === 'admin' || userRole === 'coach') {
      navigate('/dashboard', { replace: true });
    } else if (userRole === 'client') {
      if (clientData?.status === 'approved') {
        navigate('/portal', { replace: true });
      } else if (clientData?.status === 'pending') {
        navigate('/access-pending', { replace: true });
      } else if (clientData?.status === 'inactive' || clientData?.status === 'deleted') {
        navigate('/access-revoked', { replace: true });
      }
    } else if (userRole === null && user) {
      navigate('/no-account', { replace: true });
    }
  }, [user, userRole, clientData, loading, roleLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(undefined);

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.errors[0]?.message || 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin + '/portal'
        }
      });

      if (error) {
        console.error('[PortalLogin] Magic link error:', error);
        toast.error(error.message || 'Failed to send login link');
        return;
      }

      setLinkSent(true);
      toast.success('Login link sent to your email!');
    } catch (err) {
      console.error('[PortalLogin] Unexpected error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (linkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-semibold text-foreground">Check Your Email</h1>
            <p className="text-muted-foreground mt-2">
              We sent a login link to
            </p>
            <p className="text-foreground font-medium mt-1">{email}</p>
          </div>

          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Click the link in your email to sign in.
                  The link will expire in 1 hour.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLinkSent(false)}
                >
                  Send Another Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <span className="text-2xl font-serif text-primary-foreground font-bold">FG</span>
          </div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Client Portal</h1>
          <p className="text-muted-foreground mt-2">Sign in to access your portal</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-soft border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-serif">Welcome Back</CardTitle>
            <CardDescription>
              Enter your email to receive a login link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(undefined);
                  }}
                  disabled={isLoading}
                  className={`h-11 ${emailError ? 'border-destructive' : ''}`}
                  autoComplete="email"
                  autoFocus
                />
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Login Link
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            First time?{' '}
            <Link to="/portal/signup" className="text-primary hover:underline font-medium">
              Create account
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Are you a coach?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
