import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, userRole, clientData, loading, roleLoading } = useAuth();
  const navigate = useNavigate();

  // Handle routing after auth state is determined
  useEffect(() => {
    if (loading || roleLoading || !user) return;

    // Route based on user role
    if (userRole === 'admin' || userRole === 'coach') {
      navigate('/dashboard', { replace: true });
    } else if (userRole === 'client') {
      // Client routing based on status
      if (clientData?.status === 'approved') {
        navigate('/portal', { replace: true });
      } else if (clientData?.status === 'pending') {
        navigate('/access-pending', { replace: true });
      } else if (clientData?.status === 'inactive' || clientData?.status === 'deleted') {
        navigate('/access-revoked', { replace: true });
      }
    } else if (userRole === null && user) {
      // User exists but no role found
      navigate('/no-account', { replace: true });
    }
  }, [user, userRole, clientData, loading, roleLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message || 'Failed to sign in');
      setIsLoading(false);
      return;
    }

    toast.success('Welcome back!');
    // Navigation is handled by useEffect after auth state updates
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <span className="text-2xl font-serif text-primary-foreground font-bold">FG</span>
          </div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Finding Good</h1>
          <p className="text-muted-foreground mt-2">Welcome back</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-soft border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-serif">Sign In</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Contact your administrator
        </p>
      </div>
    </div>
  );
}
