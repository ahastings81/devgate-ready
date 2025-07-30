import React, { createContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'amber';
interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    return saved || 'light';
  });

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'amber');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
