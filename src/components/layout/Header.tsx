import { useState, useEffect } from 'react';
import { Search, Moon, Sun, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { QuickAddDialog } from './QuickAddDialog';
import { NotificationDropdown, Notification } from '@/components/notifications/NotificationDropdown';
import { supabase } from '@/integrations/supabase/client';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  onCommandPalette?: () => void;
  onSearch?: () => void;
}

export function Header({ onCommandPalette, onSearch }: HeaderProps) {
  const { theme, setTheme } = useAppStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load avatar from profile
  useEffect(() => {
    const loadAvatar = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    loadAvatar();
  }, [user?.id]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClear = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Search / Command Palette Trigger */}
        <div className="flex-1 max-w-sm">
          <button
            onClick={onSearch || onCommandPalette}
            className="w-full relative flex items-center"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <div className="w-full pl-9 pr-12 h-9 bg-secondary border-0 rounded-md flex items-center text-sm text-muted-foreground hover:bg-secondary/80 transition-colors">
                Search... (press /)
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                <span>/</span>
              </div>
            </div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <QuickAddDialog
            trigger={
              <Button variant="default" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Add</span>
              </Button>
            }
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>

          <NotificationDropdown
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClear={handleClear}
            onClearAll={handleClearAll}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-lg p-0 ml-1">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl || undefined} alt="Profile" className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{user?.user_metadata?.full_name || 'User'}</p>
                <p className="text-muted-foreground text-xs">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
