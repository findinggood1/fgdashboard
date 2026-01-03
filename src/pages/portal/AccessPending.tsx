import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, LogOut } from 'lucide-react';

export default function AccessPending() {
  const { clientData, signOut } = useAuth();
  const firstName = clientData?.name?.split(' ')[0] || 'there';

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
            <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            
            <h2 className="text-xl font-serif font-medium text-foreground mb-2">
              Hi {firstName}, your access is pending
            </h2>
            
            <p className="text-muted-foreground mb-6">
              Your coach is reviewing your account. You'll receive an email once you're approved to access the client portal.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                <strong>What's next?</strong><br />
                Your coach will approve your account shortly. In the meantime, feel free to reach out to them if you have any questions.
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
