import React, { createContext, useContext, useState, useEffect } from "react";

export const THEMES = [
  {
    id: "light-lotus",
    name: "Warm Lotus",
    tagline: "Organic Linen & Sage",
    badge: "Default Zen",
    bg: "#FAF7F2",
    accent: "#2E6F45",
    subAccent: "#BA4E32",
    cardBg: "#FFFFFF",
    isDark: false,
    icon: "🌿"
  },
  {
    id: "light-sky",
    name: "Ocean Breeze",
    tagline: "Cool Sky & Coastal Azure",
    badge: "Refreshing",
    bg: "#F0F6F9",
    accent: "#0284C7",
    subAccent: "#D9465F",
    cardBg: "#FFFFFF",
    isDark: false,
    icon: "🌊"
  },
  {
    id: "light-sand",
    name: "Kyoto Sand",
    tagline: "Natural Tatami & Moss",
    badge: "Minimalist",
    bg: "#F5F3EC",
    accent: "#44654F",
    subAccent: "#936325",
    cardBg: "#FFFFFF",
    isDark: false,
    icon: "⛩️"
  },
  {
    id: "light-dawn",
    name: "Morning Dawn",
    tagline: "Rose Petal & Golden Hour",
    badge: "Warm & Uplifting",
    bg: "#FFF8F5",
    accent: "#B84D35",
    subAccent: "#B47118",
    cardBg: "#FFFFFF",
    isDark: false,
    icon: "🌸"
  },
  {
    id: "dark-sanctuary",
    name: "Midnight Sanctuary",
    tagline: "Deep Night Ambient",
    badge: "Night Mode",
    bg: "#0A0E13",
    accent: "#5BB381",
    subAccent: "#E8C170",
    cardBg: "#121922",
    isDark: true,
    icon: "🌙"
  }
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("meditation_guru_theme") || "light-lotus";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("meditation_guru_theme", currentTheme);
  }, [currentTheme]);

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
  };

  const activeThemeMeta = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ currentTheme, changeTheme, activeThemeMeta, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
