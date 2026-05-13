import { create } from "zustand";

type TimerState = {
  isActive: boolean;
  remaining: number;
  duration: number;
  exerciseName: string;
  start: (seconds: number, exercise: string) => void;
  stop: () => void;
  tick: () => void;
};

export const useTimerStore = create<TimerState>((set) => ({
  isActive: false,
  remaining: 0,
  duration: 0,
  exerciseName: "",
  start: (seconds, exercise) =>
    set({ isActive: true, remaining: seconds, duration: seconds, exerciseName: exercise }),
  stop: () => set({ isActive: false, remaining: 0 }),
  tick: () =>
    set((s) => {
      if (!s.isActive || s.remaining <= 0) return { isActive: false, remaining: 0 };
      return { remaining: s.remaining - 1 };
    }),
}));
