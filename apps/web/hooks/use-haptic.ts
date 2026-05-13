"use client";

import { useCallback } from "react";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error";

const patterns: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [30],
  heavy: [50],
  success: [10, 50, 20],
  error: [50, 30, 50, 30, 50],
};

export function useHaptic() {
  const vibrate = useCallback((pattern: HapticPattern = "light") => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(patterns[pattern]);
    }
  }, []);

  return { vibrate };
}
