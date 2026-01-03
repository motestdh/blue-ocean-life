import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed, theme, themeColor } = useAppStore();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    // Apply theme color
    ['green', 'blue', 'purple', 'orange', 'pink', 'cyan'].forEach(c => {
      document.documentElement.classList.remove(`theme-${c}`);
    });
    document.documentElement.classList.add(`theme-${themeColor}`);
  }, [theme, themeColor]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
