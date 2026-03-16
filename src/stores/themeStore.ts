import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeMode, lightTheme, darkTheme, applyTheme, type Theme } from '../theme/theme';

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      theme: lightTheme,

      toggleTheme: () => {
        const newMode = get().mode === 'light' ? 'dark' : 'light';
        const newTheme = newMode === 'light' ? lightTheme : darkTheme;
        applyTheme(newTheme);
        set({ mode: newMode, theme: newTheme });
      },

      setTheme: (mode: ThemeMode) => {
        const newTheme = mode === 'light' ? lightTheme : darkTheme;
        applyTheme(newTheme);
        set({ mode, theme: newTheme });
      },
    }),
    {
      name: 'aionx-theme',
      partialize: (state) => ({ mode: state.mode }),
      merge: (persisted, current) => {
        const mode = (persisted as Partial<ThemeState> | undefined)?.mode ?? current.mode;
        return {
          ...current,
          mode,
          theme: mode === 'light' ? lightTheme : darkTheme,
        };
      },
    }
  )
);
