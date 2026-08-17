import React, { createContext, useContext, useState } from 'react';

export const lightTheme = {
  isDark: false,
  colors: {
    primary: '#ff4d6d',
    primaryDark: '#c9184a',
    primaryDeep: '#800f2f',
    primaryLight: '#ff758f',
    primaryPastel: '#ffb3c1',
    background: '#fff0f3',
    surface: '#ffffff',
    surfaceSubtle: '#fff5f7',
    textPrimary: '#590d22',
    textSecondary: '#a4133c',
    textMuted: '#c44569',
    textLight: '#ffffff',
    accent: '#ff0054',
    success: '#2ec4b6',
    border: '#ffd0d8',
    shadow: '#ff8fa3',
    overlay: 'rgba(89, 13, 34, 0.6)'
  }
};

export const darkTheme = {
  isDark: true,
  colors: {
    primary: '#ff2a6d',        // Rosa neón brillante
    primaryDark: '#ff0054',    // Carmín neón
    primaryDeep: '#ff758f',    // Rosa suave
    primaryLight: '#ff758f',
    primaryPastel: '#3d0c1e',  // Vino oscuro de fondo
    background: '#0f0206',     // Negro vino profundo
    surface: '#1c060f',        // Terciopelo vino oscuro
    surfaceSubtle: '#2a0a18',  // Superficie tenue nocturna
    textPrimary: '#ffffff',    // Blanco brillante
    textSecondary: '#ffb3c1',  // Rosa pastel
    textMuted: '#c44569',      // Texto tenue
    textLight: '#ffffff',
    accent: '#ff0054',
    success: '#2ec4b6',
    border: '#3d0c1e',         // Borde vino
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.85)'
  }
};

export const ThemeContext = createContext({
  theme: lightTheme,
  isDarkMode: false,
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// Exportación por defecto para retrocompatibilidad
export const theme = lightTheme;
