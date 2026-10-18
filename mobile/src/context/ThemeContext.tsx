import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeType = "light" | "dark";

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryDark: string;
  badgeBg: string;
  badgeText: string;
  inputBg: string;
  headerBg: string;
  statusBar: "dark" | "light";
}

const lightColors: ThemeColors = {
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  primary: "#0284c7",
  primaryDark: "#0369a1",
  badgeBg: "#e0f2fe",
  badgeText: "#0369a1",
  inputBg: "#f8fafc",
  headerBg: "#ffffff",
  statusBar: "dark",
};

const darkColors: ThemeColors = {
  bg: "#0b131b",
  card: "#13222e",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  border: "#1e3447",
  primary: "#38bdf8",
  primaryDark: "#0284c7",
  badgeBg: "#162c3d",
  badgeText: "#38bdf8",
  inputBg: "#0e1822",
  headerBg: "#13222e",
  statusBar: "light",
};

interface ThemeContextValue {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (t: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  colors: lightColors,
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEME_KEY = "@medax_mobile_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>("light");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === "dark" || saved === "light") {
        setThemeState(saved);
      }
    });
  }, []);

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    AsyncStorage.setItem(THEME_KEY, t);
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
