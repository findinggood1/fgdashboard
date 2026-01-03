import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserX, LogOut } from 'lucide-react';

export default function NoAccount() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <span className="text-2xl font-serif text-primary-foreground font-bold">FG</span>
          </div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Finding Good</h1>
        </div>

        <Card className="shadow-soft border-border/50">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
              <UserX className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-xl font-serif font-medium text-foreground mb-2">
              Account Not Found
            </h2>
            
            <p className="text-muted-foreground mb-4">
              We couldn't find a coach or client account associated with{' '}
              <span className="font-medium text-foreground">{user?.email}</span>
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                <strong>Looking to get started?</strong><br />
                If you're interested in coaching with Finding Good, please visit our website or contact a coach to set up your account.
              </p>
            </div>

            <Button variant="outline" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
