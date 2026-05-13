"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useThemeStore } from "@/stores/theme";

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative flex h-8 w-14 items-center rounded-full border border-border bg-surface-high p-1 transition-colors hover:border-border-hover"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.div
        className="flex h-6 w-6 items-center justify-center rounded-full bg-accent"
        animate={{ x: theme === "dark" ? 0 : 22 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {theme === "dark" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080B0F" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080B0F" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        )}
      </motion.div>
    </button>
  );
}
