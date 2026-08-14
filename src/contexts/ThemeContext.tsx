import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('alerta-game-theme') as ThemeMode;
    return saved || 'dark'; // Dark theme default
  });

  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const applyDark = () => {
      root.classList.add('dark');
      root.classList.remove('light');
      body.style.backgroundColor = '#020617'; // slate-950
      body.style.color = '#f8fafc'; // slate-50
      setIsDark(true);
    };

    const applyLight = () => {
      root.classList.remove('dark');
      root.classList.add('light');
      body.style.backgroundColor = '#f8fafc'; // slate-50
      body.style.color = '#0f172a'; // slate-900
      setIsDark(false);
    };

    if (theme === 'dark') {
      applyDark();
    } else if (theme === 'light') {
      applyLight();
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) applyDark();
      else applyLight();
    }

    localStorage.setItem('alerta-game-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
