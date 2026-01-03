import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, LogOut } from 'lucide-react';

export default function AccessRevoked() {
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
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-gray-500" />
            </div>
            
            <h2 className="text-xl font-serif font-medium text-foreground mb-2">
              Hi {firstName}, your access has been paused
            </h2>
            
            <p className="text-muted-foreground mb-6">
              Your portal access is currently inactive. This may happen at the end of a coaching engagement or if there's an account issue.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                <strong>Questions?</strong><br />
                Please contact your coach directly to discuss your account status or to restart your coaching journey.
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
