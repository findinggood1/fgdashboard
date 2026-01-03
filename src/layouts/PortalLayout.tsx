import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Map, MessageCircle, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PortalLayout() {
  const { user, loading, clientData, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check client status
  if (!clientData) {
    return <Navigate to="/no-account" replace />;
  }

  if (clientData.status === 'pending') {
    return <Navigate to="/access-pending" replace />;
  }

  if (clientData.status === 'inactive' || clientData.status === 'deleted') {
    return <Navigate to="/access-revoked" replace />;
  }

  const navItems = [
    { to: '/portal', icon: Home, label: 'Home', end: true },
    { to: '/portal/journey', icon: Map, label: 'Journey' },
    { to: '/portal/chat', icon: MessageCircle, label: 'Chat' },
  ];

  const firstName = clientData?.name?.split(' ')[0] || 'Client';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-sm font-serif text-primary-foreground font-bold">FG</span>
              </div>
              <span className="font-serif text-lg font-medium text-foreground hidden sm:block">
                Finding Good
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {firstName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <span className="font-serif font-medium text-foreground">Finding Good</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
