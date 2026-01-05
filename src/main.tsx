import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize theme from localStorage before render
const initializeTheme = () => {
  try {
    const stored = localStorage.getItem('lifeos-storage');
    if (stored) {
      const { state } = JSON.parse(stored);
      // Apply dark/light mode
      if (state?.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Apply theme color
      if (state?.themeColor) {
        const allColors = ['green', 'blue', 'purple', 'orange', 'pink', 'cyan', 'red', 'teal', 'gold', 'indigo', 'rose', 'emerald'];
        allColors.forEach(c => document.documentElement.classList.remove(`theme-${c}`));
        document.documentElement.classList.add(`theme-${state.themeColor}`);
      }
      // Apply RTL
      if (state?.rtlEnabled) {
        document.documentElement.dir = 'rtl';
      }
      if (state?.language) {
        document.documentElement.lang = state.language;
      }
    }
  } catch (e) {
    console.error('Failed to initialize theme:', e);
  }
};

initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
