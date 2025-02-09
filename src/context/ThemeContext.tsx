import React, { createContext, useContext, useState } from 'react';
import { FontFamily, SUPPORTED_FONTS } from '../constants/fonts';

interface ThemeContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    try {
      const savedFont = localStorage.getItem('preferredFont');
      if (savedFont && Object.values(SUPPORTED_FONTS).includes(savedFont as FontFamily)) {
        return savedFont as FontFamily;
      }
    } catch (error) {
      console.error('Error reading font preference:', error);
    }
    return SUPPORTED_FONTS.arial;
  });

  const handleSetFontFamily = (font: FontFamily) => {
    try {
      localStorage.setItem('preferredFont', font);
      setFontFamily(font);
    } catch (error) {
      console.error('Error saving font preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ fontFamily, setFontFamily: handleSetFontFamily }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 