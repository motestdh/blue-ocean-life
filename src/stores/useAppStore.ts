import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Theme
  theme: 'light' | 'dark';
  primaryColor: string;
  sidebarCollapsed: boolean;
  
  // Focus state
  activeFocusTask: string | null;
  focusTimerRunning: boolean;
  focusTimeRemaining: number;
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  
  // Focus actions
  startFocus: (taskId: string) => void;
  pauseFocus: () => void;
  stopFocus: () => void;
  tickFocus: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'light',
      primaryColor: '#0EA5E9',
      sidebarCollapsed: false,
      activeFocusTask: null,
      focusTimerRunning: false,
      focusTimeRemaining: 25 * 60,

      // Theme actions
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Focus actions
      startFocus: (taskId) => set({ 
        activeFocusTask: taskId, 
        focusTimerRunning: true,
        focusTimeRemaining: 25 * 60,
      }),
      
      pauseFocus: () => set((state) => ({ 
        focusTimerRunning: !state.focusTimerRunning 
      })),
      
      stopFocus: () => set({ 
        activeFocusTask: null, 
        focusTimerRunning: false,
        focusTimeRemaining: 25 * 60,
      }),
      
      tickFocus: () => set((state) => {
        if (state.focusTimeRemaining <= 0) {
          return { focusTimerRunning: false };
        }
        return { focusTimeRemaining: state.focusTimeRemaining - 1 };
      }),
    }),
    {
      name: 'lifeos-storage',
      partialize: (state) => ({
        theme: state.theme,
        primaryColor: state.primaryColor,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
