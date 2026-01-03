import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { RecordMemoButton } from '@/components/RecordMemoButton';
import { cn } from '@/lib/utils';
import { Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

export default function DashboardLayout() {
  const { user, loading, userRole } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  // Auto-close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h2 className="text-xl font-serif font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Your account is not associated with this system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-sidebar-foreground hover:bg-sidebar-accent min-h-[44px] min-w-[44px]"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <AppSidebar 
                collapsed={false} 
                onToggle={() => {}} 
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <span className="text-xs font-serif font-bold text-accent-foreground">FG</span>
            </div>
            <span className="font-serif font-semibold text-sidebar-foreground">Finding Good</span>
          </div>
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <AppSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      )}
      
      <main 
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          isMobile ? 'ml-0 pt-14' : (sidebarCollapsed ? 'ml-16' : 'ml-64')
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <RecordMemoButton />
    </div>
  );
}
