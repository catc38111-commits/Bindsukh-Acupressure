import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<Theme>('light');

  useEffect(() => {
    try {
      localStorage.setItem('bindsukh_theme', 'light');
      document.documentElement.classList.remove('dark');
    } catch (e) {
      console.warn('Error setting theme:', e);
    }
  }, []);

  const toggleTheme = () => {
    // Light mode is locked permanently
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
