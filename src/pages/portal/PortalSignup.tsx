import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, UserPlus, AlertCircle, Clock, XCircle } from 'lucide-react';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ClientStatus = 'approved' | 'pending' | 'inactive' | 'deleted' | null;

export default function PortalSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [clientStatus, setClientStatus] = useState<ClientStatus>(null);
  const [statusChecked, setStatusChecked] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/portal', { replace: true });
    }
  }, [user, loading, navigate]);

  const checkClientStatus = async (emailToCheck: string): Promise<{ exists: boolean; status: ClientStatus }> => {
    const { data, error } = await supabase
      .from('clients')
      .select('status')
      .eq('email', emailToCheck.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('[PortalSignup] Error checking client:', error);
      throw new Error('Failed to verify account eligibility');
    }

    if (!data) {
      return { exists: false, status: null };
    }

    return { exists: true, status: data.status as ClientStatus };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setClientStatus(null);
    setStatusChecked(false);

    // Validate inputs
    const result = signupSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field as keyof typeof fieldErrors] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Check if email exists in clients table
      const { exists, status } = await checkClientStatus(email);
      setStatusChecked(true);

      if (!exists) {
        setClientStatus(null);
        return;
      }

      if (status !== 'approved') {
        setClientStatus(status);
        return;
      }

      // Step 2: Email is in clients table and approved - create Supabase Auth account
      const redirectUrl = `${window.location.origin}/portal`;
      
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (signUpError) {
        console.error('[PortalSignup] Sign up error:', signUpError);
        
        if (signUpError.message.includes('already registered')) {
          toast.error('An account with this email already exists. Try signing in instead.');
          return;
        }
        
        toast.error(signUpError.message || 'Failed to create account');
        return;
      }

      toast.success('Account created! Check your email to confirm, then sign in.');
      navigate('/portal/login');
    } catch (err) {
      console.error('[PortalSignup] Unexpected error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show status-specific messages
  if (statusChecked && clientStatus === null && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-serif font-semibold text-foreground">No Account Found</h1>
          </div>

          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  We couldn't find an account associated with <strong>{email}</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact your coach to get access to the client portal.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    setStatusChecked(false);
                    setClientStatus(null);
                  }}
                >
                  Try a different email
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link to="/portal/login" className="text-sm text-primary hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (statusChecked && clientStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-4">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-serif font-semibold text-foreground">Access Pending</h1>
          </div>

          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  Your account is pending approval. Your coach will activate your access soon.
                </p>
                <p className="text-sm text-muted-foreground">
                  You'll be able to create your account once approved.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    setStatusChecked(false);
                    setClientStatus(null);
                  }}
                >
                  Try a different email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (statusChecked && (clientStatus === 'inactive' || clientStatus === 'deleted')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-serif font-semibold text-foreground">Access Unavailable</h1>
          </div>

          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  Portal access for this account is no longer available.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact your coach if you believe this is an error.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    setStatusChecked(false);
                    setClientStatus(null);
                  }}
                >
                  Try a different email
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
          <h1 className="text-3xl font-serif font-semibold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Set up your client portal access</p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-soft border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-serif">Get Started</CardTitle>
            <CardDescription>
              Enter your email and create a password
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
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  disabled={isLoading}
                  className={`h-11 ${errors.email ? 'border-destructive' : ''}`}
                  autoComplete="email"
                  autoFocus
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  disabled={isLoading}
                  className={`h-11 ${errors.password ? 'border-destructive' : ''}`}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  disabled={isLoading}
                  className={`h-11 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/portal/login" className="text-primary hover:underline font-medium">
              Sign in
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
