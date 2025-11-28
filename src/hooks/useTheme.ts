/**
 * Custom Hook: useTheme
 * Theme management with system preference detection
 */

import { useEffect } from 'react';
import { useAppStore, selectTheme } from '@/src/store';

export function useTheme() {
  const theme = useAppStore(selectTheme);
  const toggleTheme = useAppStore(state => state.toggleTheme);
  const setTheme = useAppStore(state => state.setTheme);

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const isDark = theme === 'dark';

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };
}
