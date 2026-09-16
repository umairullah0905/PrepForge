"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-900/50 text-zinc-400"
        aria-hidden="true"
      >
        <span className="h-4 w-4" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
      title={isDark ? "Switch to warm editorial light mode" : "Switch to developer dark mode"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-zinc-300 hover:text-amber-400 transition-colors" />
      ) : (
        <Moon className="h-4 w-4 text-zinc-600 hover:text-zinc-900 transition-colors" />
      )}
    </button>
  );
}
