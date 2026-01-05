import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize theme from localStorage before render
const initializeTheme = () => {
  try {
    const stored = localStorage.getItem('lifeos-storage');
    if (!stored) return;

    const { state } = JSON.parse(stored);

    // Apply dark/light mode
    document.documentElement.classList.toggle('dark', state?.theme === 'dark');

    // Apply theme color (CSS variables)
    const THEME_COLOR_HSL: Record<string, string> = {
      blue: '199 89% 48%',
      green: '160 84% 39%',
      purple: '262 83% 58%',
      orange: '24 95% 53%',
      pink: '330 81% 60%',
      cyan: '180 70% 45%',
      red: '0 84% 60%',
      teal: '168 76% 42%',
      gold: '45 93% 47%',
      indigo: '239 84% 67%',
      rose: '350 89% 60%',
      emerald: '152 69% 45%',
    };

    if (state?.themeColor && THEME_COLOR_HSL[state.themeColor]) {
      const hsl = THEME_COLOR_HSL[state.themeColor];
      document.documentElement.style.setProperty('--primary', hsl);
      document.documentElement.style.setProperty('--accent', hsl);
      document.documentElement.style.setProperty('--ring', hsl);
      document.documentElement.style.setProperty('--sidebar-primary', hsl);
      document.documentElement.style.setProperty('--sidebar-ring', hsl);

      // Also keep class
      const allColors = Object.keys(THEME_COLOR_HSL);
      allColors.forEach((c) => document.documentElement.classList.remove(`theme-${c}`));
      document.documentElement.classList.add(`theme-${state.themeColor}`);
    }

    // Apply RTL + language
    if (state?.rtlEnabled) {
      document.documentElement.dir = 'rtl';
    }
    if (state?.language) {
      document.documentElement.lang = state.language;
    }
  } catch (e) {
    console.error('Failed to initialize theme:', e);
  }
};
initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
