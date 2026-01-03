import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Zap,
  Users,
  Wallet,
  GraduationCap,
  FileText,
  Flame,
  Calendar,
  Settings,
  Plus,
  Search,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickAdd: () => void;
}

const navigationItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Projects', icon: FolderOpen, path: '/projects' },
  { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { name: 'Focus Mode', icon: Zap, path: '/focus' },
  { name: 'Clients', icon: Users, path: '/clients' },
  { name: 'Finance', icon: Wallet, path: '/finance' },
  { name: 'Learning', icon: GraduationCap, path: '/learning' },
  { name: 'Notes', icon: FileText, path: '/notes' },
  { name: 'Habits', icon: Flame, path: '/habits' },
  { name: 'Calendar', icon: Calendar, path: '/calendar' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export function CommandPalette({ open, onOpenChange, onQuickAdd }: CommandPaletteProps) {
  const navigate = useNavigate();

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    onOpenChange(false);
  }, [navigate, onOpenChange]);

  const handleQuickAdd = useCallback(() => {
    onOpenChange(false);
    setTimeout(() => onQuickAdd(), 100);
  }, [onOpenChange, onQuickAdd]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={handleQuickAdd}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Quick Add (New Item)</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => handleSelect(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return { open, setOpen };
}
