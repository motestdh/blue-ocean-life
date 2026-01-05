import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { CommandPalette, useCommandPalette } from '@/components/CommandPalette';
import { QuickAddDialog } from './QuickAddDialog';
import { AIChatButton } from '@/components/ai/AIChatButton';
import { GlobalSearch, useGlobalSearch } from '@/components/search/GlobalSearch';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed, theme, themeColor, rtlEnabled, language } = useAppStore();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();
  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearch();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    // Apply theme color
    ['green', 'blue', 'purple', 'orange', 'pink', 'cyan', 'red', 'teal', 'gold', 'indigo', 'rose', 'emerald'].forEach(c => {
      document.documentElement.classList.remove(`theme-${c}`);
    });
    document.documentElement.classList.add(`theme-${themeColor}`);
    // Apply RTL
    document.documentElement.dir = rtlEnabled ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [theme, themeColor, rtlEnabled, language]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen blitzit-gradient flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen blitzit-gradient">
      <Sidebar />
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          // Hide sidebar margin on mobile (< md breakpoint)
          'md:transition-all',
          rtlEnabled 
            ? (sidebarCollapsed ? 'md:mr-16' : 'md:mr-60')
            : (sidebarCollapsed ? 'md:ml-16' : 'md:ml-60')
        )}
      >
        <Header 
          onCommandPalette={() => setCommandOpen(true)} 
          onSearch={() => setSearchOpen(true)}
        />
        <main className="p-3 md:p-6">
          {children}
        </main>
      </div>
      
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onQuickAdd={() => setQuickAddOpen(true)}
      />
      
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
      
      <QuickAddDialog 
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />
      
      <AIChatButton />
    </div>
  );
}
