import { useMemo } from 'react';
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
  Film,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { useNavOrder } from '@/hooks/useNavOrder';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LucideIcon } from 'lucide-react';

const navItemsMap: Record<string, { icon: LucideIcon; label: string }> = {
  '/': { icon: LayoutDashboard, label: 'Dashboard' },
  '/calendar': { icon: Calendar, label: 'Calendar' },
  '/projects': { icon: FolderKanban, label: 'Projects' },
  '/tasks': { icon: CheckSquare, label: 'Tasks' },
  '/focus': { icon: Target, label: 'Focus' },
  '/clients': { icon: Users, label: 'Clients' },
  '/finance': { icon: DollarSign, label: 'Finance' },
  '/learning': { icon: BookOpen, label: 'Learning' },
  '/books-podcasts': { icon: Book, label: 'Books & Podcasts' },
  '/movies-series': { icon: Film, label: 'Movies & Series' },
  '/notes': { icon: FileText, label: 'Notes' },
  '/habits': { icon: Repeat, label: 'Habits' },
  '/analytics': { icon: BarChart3, label: 'Analytics' },
};

function SortableNavItem({ 
  path, 
  isActive, 
  sidebarCollapsed, 
  rtlEnabled 
}: { 
  path: string; 
  isActive: boolean; 
  sidebarCollapsed: boolean;
  rtlEnabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: path });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const item = navItemsMap[path];
  if (!item) return null;

  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center group relative',
        isDragging && 'opacity-50 z-50'
      )}
    >
      {!sidebarCollapsed && (
        <button
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-none p-1"
        >
          <GripVertical className="w-3 h-3" />
        </button>
      )}
      <NavLink
        to={path}
        className={cn(
          'flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
          sidebarCollapsed ? 'justify-center px-2' : 'ml-4'
        )}
      >
        {isActive && (
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full",
            rtlEnabled ? "right-0" : "left-0"
          )} />
        )}
        <Icon className={cn(
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
    </div>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, rtlEnabled } = useAppStore();
  const { navOrder, updateNavOrder } = useNavOrder();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const sortedNavItems = useMemo(() => {
    return navOrder.filter(path => navItemsMap[path]);
  }, [navOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedNavItems.indexOf(active.id as string);
      const newIndex = sortedNavItems.indexOf(over.id as string);
      const newOrder = arrayMove(sortedNavItems, oldIndex, newIndex);
      updateNavOrder(newOrder);
    }
  };

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedNavItems} strategy={verticalListSortingStrategy}>
            {sortedNavItems.map((path) => (
              <SortableNavItem
                key={path}
                path={path}
                isActive={location.pathname === path}
                sidebarCollapsed={sidebarCollapsed}
                rtlEnabled={rtlEnabled}
              />
            ))}
          </SortableContext>
        </DndContext>
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
