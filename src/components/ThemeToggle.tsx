"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

interface ThemeToggleProps {
  variant?: "button" | "switch" | "segment";
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({
  variant = "button",
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, themeMode, setThemeMode, toggleTheme, isMounted } = useTheme();

  if (!isMounted) {
    if (variant === "segment") {
      return (
        <div
          aria-hidden="true"
          className={`h-9 w-full bg-[var(--bg-muted)] rounded-xl ${className}`}
        />
      );
    }
    return (
      <div
        aria-hidden="true"
        className={`w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] ${className}`}
      />
    );
  }

  if (variant === "segment") {
    return (
      <div
        role="group"
        aria-label="Color theme"
        className={`grid grid-cols-3 gap-1 p-1 bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-xl text-xs font-medium select-none ${className}`}
      >
        <button
          type="button"
          onClick={() => setThemeMode("light")}
          aria-pressed={themeMode === "light"}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
            themeMode === "light"
              ? "bg-[var(--bg-surface)] text-amber-600 dark:text-amber-400 shadow-xs border border-[var(--border-hairline)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
          }`}
          title="Light theme"
        >
          <Sun className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setThemeMode("dark")}
          aria-pressed={themeMode === "dark"}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
            themeMode === "dark"
              ? "bg-[var(--bg-surface)] text-rose-600 dark:text-rose-400 shadow-xs border border-[var(--border-hairline)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
          }`}
          title="Dark theme"
        >
          <Moon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setThemeMode("system")}
          aria-pressed={themeMode === "system"}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
            themeMode === "system"
              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-hairline)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
          }`}
          title={`System (${theme})`}
        >
          <Monitor className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  if (variant === "switch") {
    const isDark = theme === "dark";
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border border-[var(--border-strong)] ${
          isDark ? "bg-zinc-800" : "bg-amber-100"
        } ${className}`}
      >
        <span
          className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isDark
              ? "translate-x-5.5 bg-zinc-950 text-rose-400"
              : "translate-x-0.5 text-amber-500"
          }`}
        >
          {isDark ? (
            <Moon className="w-3 h-3" aria-hidden="true" />
          ) : (
            <Sun className="w-3 h-3" aria-hidden="true" />
          )}
        </span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer select-none active:scale-95 ${className}`}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun
          className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45"
          aria-hidden="true"
        />
      ) : (
        <Moon
          className="w-4 h-4 text-slate-700 transition-transform duration-300 group-hover:-rotate-12"
          aria-hidden="true"
        />
      )}

      {showLabel && (
        <span className="text-xs font-medium">{isDark ? "Light" : "Dark"}</span>
      )}
    </button>
  );
}
