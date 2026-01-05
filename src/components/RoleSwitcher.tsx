import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Shield, Users, Compass, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const viewConfig = {
  admin: {
    label: 'Admin View',
    icon: Shield,
    path: '/admin',
  },
  coach: {
    label: 'Coach View',
    icon: Users,
    path: '/clients',
  },
  client: {
    label: 'My Journey',
    icon: Compass,
    path: '/portal',
  },
} as const;

export function RoleSwitcher() {
  const { userRoles, activeView, switchView } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive current view from URL for accurate highlighting
  const currentViewFromRoute = (): 'admin' | 'coach' | 'client' => {
    if (location.pathname.startsWith('/portal')) return 'client';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'coach'; // /clients, /dashboard, /chat, etc.
  };

  // Count available roles
  const availableRoles = [
    userRoles.isAdmin && 'admin',
    userRoles.isCoach && 'coach',
    'client', // Everyone can be a client
  ].filter(Boolean) as ('admin' | 'coach' | 'client')[];

  // Don't show switcher if user has only one role
  if (availableRoles.length <= 1) {
    return null;
  }

  const displayView = currentViewFromRoute();
  const currentConfig = viewConfig[displayView];
  const CurrentIcon = currentConfig.icon;

  const handleSwitch = (view: 'admin' | 'coach' | 'client') => {
    console.log('[RoleSwitcher] handleSwitch called, view:', view, 'current activeView:', activeView);
    if (view === displayView) {
      console.log('[RoleSwitcher] Already on this view, skipping');
      return;
    }
    
    const targetPath = viewConfig[view].path;
    console.log('[RoleSwitcher] Switching view and navigating to:', targetPath);
    switchView(view);
    navigate(targetPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 h-9 px-3 bg-background/50 border-border/50"
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentConfig.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
        {availableRoles.map((role) => {
          const config = viewConfig[role];
          const Icon = config.icon;
          const isActive = role === displayView;
          
          return (
            <DropdownMenuItem
              key={role}
              onSelect={(e) => {
                e.preventDefault();
                console.log('[RoleSwitcher] onSelect fired for role:', role);
                handleSwitch(role);
              }}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                isActive && 'bg-primary/10'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive && 'text-primary')} />
              <span className={cn('flex-1', isActive && 'font-medium text-primary')}>
                {config.label}
              </span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
