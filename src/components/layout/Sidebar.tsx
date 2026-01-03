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
  Zap
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
  { icon: FileText, label: 'Notes', path: '/notes' },
  { icon: Repeat, label: 'Habits', path: '/habits' },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center border-b border-sidebar-border px-4',
        sidebarCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">LifeOS</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {sidebarCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 flex-shrink-0',
                isActive ? 'text-primary-foreground' : 'text-sidebar-foreground group-hover:text-primary'
              )} />
              {!sidebarCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent',
            sidebarCollapsed && 'justify-center px-2',
            location.pathname === '/settings' && 'bg-sidebar-accent'
          )}
        >
          <Settings className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium text-sm">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
