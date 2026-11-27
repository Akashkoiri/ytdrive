"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "ytdrive-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeToDOM(mode: ThemeMode, resolvedTheme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.setAttribute("data-theme", resolvedTheme);
  root.style.colorScheme = resolvedTheme;

  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute("content", mode === "system" ? "light dark" : mode);
  }
}

const themeListeners = new Set<() => void>();

function subscribeTheme(callback: () => void) {
  themeListeners.add(callback);

  const mediaQuery =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

  const handleMediaChange = () => {
    callback();
  };

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorageChange);
  mediaQuery?.addEventListener("change", handleMediaChange);

  return () => {
    themeListeners.delete(callback);
    window.removeEventListener("storage", handleStorageChange);
    mediaQuery?.removeEventListener("change", handleMediaChange);
  };
}

function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Fallback if localStorage is inaccessible
  }
  return "system";
}

const emptySubscribe = () => () => {};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const themeMode = useSyncExternalStore<ThemeMode>(
    subscribeTheme,
    getStoredThemeMode,
    () => "dark"
  );

  const theme: Theme = !isMounted
    ? "dark"
    : themeMode === "system"
    ? getSystemTheme()
    : themeMode;

  useEffect(() => {
    if (isMounted) {
      applyThemeToDOM(themeMode, theme);
    }
  }, [themeMode, theme, isMounted]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    try {
      if (mode === "system") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, mode);
      }
    } catch {
      // ignore storage error
    }

    const resolved = mode === "system" ? getSystemTheme() : mode;
    applyThemeToDOM(mode, resolved);
    themeListeners.forEach((listener) => listener());
  }, []);

  const toggleTheme = useCallback(() => {
    const sys = getSystemTheme();
    const target: Theme = theme === "dark" ? "light" : "dark";
    setThemeMode(target === sys ? "system" : target);
  }, [theme, setThemeMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        toggleTheme,
        isMounted,
      }}
    >
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
