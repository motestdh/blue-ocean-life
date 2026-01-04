import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Target, 
  Calendar, 
  Users, 
  DollarSign, 
  BookOpen, 
  FileText, 
  Repeat, 
  Settings,
  ChevronLeft,
  Menu,
  Zap,
  BarChart3,
  Book,
  Film
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Target, label: 'Focus', path: '/focus' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: DollarSign, label: 'Finance', path: '/finance' },
  { icon: BookOpen, label: 'Learning', path: '/learning' },
  { icon: Book, label: 'Books & Podcasts', path: '/books-podcasts' },
  { icon: Film, label: 'Movies & Series', path: '/movies-series' },
  { icon: FileText, label: 'Notes', path: '/notes' },
  { icon: Repeat, label: 'Habits', path: '/habits' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, rtlEnabled } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed top-0 z-40 h-screen bg-sidebar/95 backdrop-blur-xl border-sidebar-border transition-all duration-300 ease-out flex flex-col',
        rtlEnabled ? 'right-0 border-l' : 'left-0 border-r',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-14 flex items-center border-b border-sidebar-border px-3',
        sidebarCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground gradient-text">Blitzit</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
        {!sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className={cn("h-4 w-4", rtlEnabled && "rotate-180")} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              {isActive && (
                <div className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full",
                  rtlEnabled ? "right-0" : "left-0"
                )} />
              )}
              <item.icon className={cn(
                'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                isActive ? 'text-primary' : 'group-hover:text-foreground'
              )} />
              {!sidebarCollapsed && (
                <span className={cn(
                  "text-sm font-medium",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Button (when collapsed) */}
      {sidebarCollapsed && (
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-full h-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Settings */}
      <div className="p-2 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative',
            location.pathname === '/settings' 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          {location.pathname === '/settings' && (
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full",
              rtlEnabled ? "right-0" : "left-0"
            )} />
          )}
          <Settings className={cn(
            "w-[18px] h-[18px]",
            location.pathname === '/settings' && "text-primary"
          )} />
          {!sidebarCollapsed && (
            <span className={cn(
              "text-sm font-medium",
              location.pathname === '/settings' && "text-primary"
            )}>
              Settings
            </span>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
