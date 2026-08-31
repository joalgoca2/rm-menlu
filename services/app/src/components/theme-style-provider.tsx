"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeStyle = "gold" | "modern" | "professional";

interface ThemeStyleContextType {
  themeStyle: ThemeStyle;
  setThemeStyle: (style: ThemeStyle) => void;
}

const ThemeStyleContext = createContext<ThemeStyleContextType>({
  themeStyle: "gold",
  setThemeStyle: () => null,
});

const STORAGE_KEY = "app-theme-style";

export function ThemeStyleProvider({
  children,
  defaultStyle = "gold",
}: {
  children: React.ReactNode;
  defaultStyle?: ThemeStyle;
}) {
  const [themeStyle, setThemeStyleState] = useState<ThemeStyle>(defaultStyle);

  useEffect(() => {
    const envDefault =
      (process.env.NEXT_PUBLIC_DEFAULT_THEME_STYLE as ThemeStyle) ||
      defaultStyle;
    const savedStyle = localStorage.getItem(STORAGE_KEY) as ThemeStyle | null;
    const activeStyle = savedStyle || envDefault;

    setThemeStyleState(activeStyle);
    document.documentElement.setAttribute("data-theme-style", activeStyle);
  }, [defaultStyle]);

  const setThemeStyle = (style: ThemeStyle) => {
    setThemeStyleState(style);
    localStorage.setItem(STORAGE_KEY, style);
    document.documentElement.setAttribute("data-theme-style", style);
  };

  return (
    <ThemeStyleContext.Provider value={{ themeStyle, setThemeStyle }}>
      {children}
    </ThemeStyleContext.Provider>
  );
}

export function useThemeStyle() {
  return useContext(ThemeStyleContext);
}
