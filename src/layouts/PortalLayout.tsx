import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { Home, Map, MessageCircle, LogOut, Loader2, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PortalLayout() {
  const { user, loading, roleLoading, userRole, clientData, signOut } = useAuth();

  console.log('[PortalLayout] State:', { 
    loading, 
    roleLoading, 
    userRole, 
    hasUser: !!user,
    clientStatus: clientData?.status 
  });

  // Wait for both auth loading and role loading to complete
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    console.log('[PortalLayout] No user, redirecting to /portal/login');
    return <Navigate to="/portal/login" replace />;
  }

  // If user is a coach or admin, redirect them to dashboard (not "no account")
  if (userRole === 'admin' || userRole === 'coach') {
    console.log('[PortalLayout] User is coach/admin, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // If userRole is null or not 'client', redirect to no-account
  if (userRole !== 'client') {
    console.log('[PortalLayout] userRole is not client:', userRole, ', redirecting to /no-account');
    return <Navigate to="/no-account" replace />;
  }

  // User is a client but we don't have their data yet
  if (!clientData) {
    console.log('[PortalLayout] Client role but no clientData, redirecting to /no-account');
    return <Navigate to="/no-account" replace />;
  }

  // Check client status
  if (clientData.status === 'pending') {
    console.log('[PortalLayout] Client status is pending');
    return <Navigate to="/access-pending" replace />;
  }

  if (clientData.status === 'inactive' || clientData.status === 'deleted') {
    console.log('[PortalLayout] Client status is inactive/deleted');
    return <Navigate to="/access-revoked" replace />;
  }

  const navItems = [
    { to: '/portal', icon: Home, label: 'Home', end: true },
    { to: '/portal/journey', icon: Map, label: 'Journey' },
    { to: '/portal/map', icon: Compass, label: 'My Map' },
    { to: '/portal/chat', icon: MessageCircle, label: 'Chat' },
  ];

  const firstName = clientData?.name?.split(' ')[0] || 'Client';

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 sm:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-xs sm:text-sm font-serif text-primary-foreground font-bold">FG</span>
              </div>
              <span className="font-serif text-base sm:text-lg font-medium text-foreground hidden sm:block">
                Finding Good
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-1">
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
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <RoleSwitcher />
              <span className="text-sm text-muted-foreground hidden sm:block">
                {firstName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px] rounded-lg transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                  <span className={cn('text-xs font-medium', isActive && 'text-primary')}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer - Hidden on mobile */}
      <footer className="hidden sm:block border-t border-border py-6">
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
