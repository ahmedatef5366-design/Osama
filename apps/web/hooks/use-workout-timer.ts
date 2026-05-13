"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTimerStore } from "@/stores/timer";

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Web Audio not available
  }
}

function vibrate() {
  try {
    navigator.vibrate([200, 100, 200, 100, 400]);
  } catch {
    // Vibration API not available
  }
}

export function useWorkoutTimer() {
  const {
    isActive,
    remaining,
    duration,
    exerciseName,
    start,
    stop,
    tick,
  } = useTimerStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      tick();
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, tick]);

  useEffect(() => {
    if (isActive && remaining <= 0) {
      stop();
      playBeep();
      setTimeout(playBeep, 150);
      setTimeout(playBeep, 300);
      vibrate();
    }
  }, [isActive, remaining, stop]);

  const startTimer = useCallback(
    (seconds: number, exercise?: string) => {
      start(seconds, exercise ?? "");
    },
    [start],
  );

  const skipTimer = useCallback(() => {
    stop();
  }, [stop]);

  return {
    isActive,
    remaining,
    duration,
    exerciseName,
    progress: duration > 0 ? remaining / duration : 0,
    startTimer,
    skipTimer,
  };
}
