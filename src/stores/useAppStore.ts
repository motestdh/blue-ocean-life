import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeColor = 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'cyan';
type Language = 'en' | 'ar';

interface NotificationSettings {
  taskReminders: boolean;
  habitCheckins: boolean;
  projectUpdates: boolean;
  financialAlerts: boolean;
}

interface AppState {
  // Theme
  theme: 'light' | 'dark';
  themeColor: ThemeColor;
  sidebarCollapsed: boolean;
  
  // Language & RTL
  language: Language;
  rtlEnabled: boolean;
  
  // Notifications
  notificationsEnabled: boolean;
  notificationSettings: NotificationSettings;
  
  // Focus state
  activeFocusTask: string | null;
  focusTimerRunning: boolean;
  focusTimeRemaining: number;
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setThemeColor: (color: ThemeColor) => void;
  toggleSidebar: () => void;
  setLanguage: (lang: Language) => void;
  setRtlEnabled: (enabled: boolean) => void;
  
  // Notification actions
  setNotificationsEnabled: (enabled: boolean) => void;
  updateNotificationSetting: (key: keyof NotificationSettings, value: boolean) => void;
  
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
      theme: 'dark',
      themeColor: 'blue',
      sidebarCollapsed: false,
      language: 'en',
      rtlEnabled: false,
      notificationsEnabled: false,
      notificationSettings: {
        taskReminders: true,
        habitCheckins: true,
        projectUpdates: true,
        financialAlerts: true,
      },
      activeFocusTask: null,
      focusTimerRunning: false,
      focusTimeRemaining: 25 * 60,

      // Theme actions
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      
      setThemeColor: (color) => {
        set({ themeColor: color });
        const root = document.documentElement;
        ['green', 'blue', 'purple', 'orange', 'pink', 'cyan'].forEach(c => {
          root.classList.remove(`theme-${c}`);
        });
        root.classList.add(`theme-${color}`);
      },
      
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Language actions
      setLanguage: (lang) => {
        set({ language: lang, rtlEnabled: lang === 'ar' });
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      },
      
      setRtlEnabled: (enabled) => {
        set({ rtlEnabled: enabled });
        document.documentElement.dir = enabled ? 'rtl' : 'ltr';
      },

      // Notification actions
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      
      updateNotificationSetting: (key, value) => set((state) => ({
        notificationSettings: {
          ...state.notificationSettings,
          [key]: value,
        },
      })),

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
        themeColor: state.themeColor,
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
        rtlEnabled: state.rtlEnabled,
        notificationsEnabled: state.notificationsEnabled,
        notificationSettings: state.notificationSettings,
      }),
    }
  )
);
