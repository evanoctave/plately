import { createContext, useContext, type ReactNode } from 'react';
import { palette, darkPalette, type Palette } from './index';
import { useSettings } from '../state/useSettings';

const ThemeContext = createContext<Palette>(palette);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const darkMode = useSettings((s) => s.darkMode);
  return (
    <ThemeContext.Provider value={(darkMode ? darkPalette : palette) as typeof palette}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Palette {
  return useContext(ThemeContext);
}
