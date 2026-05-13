"use client";

import { useState, useRef, useCallback, type TouchEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  videoUrl?: string;
};

type ExerciseSwipeProps = {
  exercises: Exercise[];
  renderExercise: (exercise: Exercise, index: number) => React.ReactNode;
};

const SWIPE_THRESHOLD = 50;

export function ExerciseSwipe({ exercises, renderExercise }: ExerciseSwipeProps) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(0);
  const touchDelta = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch) touchStart.current = touch.clientX;
    touchDelta.current = 0;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch) touchDelta.current = touch.clientX - touchStart.current;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (touchDelta.current > SWIPE_THRESHOLD && current > 0) {
      setCurrent((c) => c - 1);
    } else if (
      touchDelta.current < -SWIPE_THRESHOLD &&
      current < exercises.length - 1
    ) {
      setCurrent((c) => c + 1);
    }
    touchDelta.current = 0;
  }, [current, exercises.length]);

  return (
    <div>
      <div
        className="overflow-hidden touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
          >
            {exercises[current] && renderExercise(exercises[current], current)}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {exercises.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-6 bg-accent" : "w-1.5 bg-text-3"
            }`}
            aria-label={`Exercise ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
