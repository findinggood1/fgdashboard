import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  LogOut,
  Map,
  Bot,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

export function AppSidebar({ collapsed, onToggle, onNavigate }: AppSidebarProps) {
  const { userRole, coachData, signOut } = useAuth();
  const location = useLocation();

  const isAdmin = userRole === 'admin';
  const isCoach = userRole === 'coach' || userRole === 'admin';

  const navItems = [
    { 
      to: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard',
      show: true 
    },
    { 
      to: '/clients', 
      icon: Users, 
      label: 'Clients',
      show: isCoach 
    },
    { 
      to: '/events', 
      icon: Calendar, 
      label: 'Events',
      show: isAdmin 
    },
    { 
      to: '/analytics', 
      icon: BarChart3, 
      label: 'Analytics',
      show: isAdmin 
    },
    { 
      to: '/chat', 
      icon: MessageSquare, 
      label: 'AI Prep',
      show: isCoach 
    },
    { 
      to: '/coach/chat', 
      icon: Bot, 
      label: 'Coach AI Chat',
      show: isCoach 
    },
    { 
      to: '/my/map', 
      icon: Map, 
      label: 'Client Map View',
      show: isCoach 
    },
    { 
      to: '/portal-preview', 
      icon: Eye, 
      label: 'Client Portal View',
      show: isCoach 
    },
  ].filter(item => item.show);

  const handleNavClick = () => {
    onNavigate?.();
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
              <span className="text-sm font-serif font-bold text-accent-foreground">FG</span>
            </div>
            <span className="font-serif font-semibold text-sidebar-foreground">Finding Good</span>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center mx-auto">
            <span className="text-sm font-serif font-bold text-accent-foreground">FG</span>
          </div>
        )}
      </div>

      {/* Toggle Button - Hidden in mobile sheet */}
      {onToggle && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border shadow-sm hover:bg-sidebar-accent hidden md:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn(
            'h-4 w-4 text-sidebar-foreground transition-transform',
            collapsed && 'rotate-180'
          )} />
        </Button>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={cn(
                'sidebar-item min-h-[44px]',
                isActive && 'sidebar-item-active'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && coachData && (
          <div className="mb-3 px-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{coachData.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{coachData.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              {isAdmin ? 'Admin' : 'Coach'}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            'w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent min-h-[44px]',
            collapsed && 'justify-center px-2'
          )}
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}
