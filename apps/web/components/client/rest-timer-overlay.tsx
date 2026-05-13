"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";

const SIZE = 200;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RestTimerOverlay() {
  const { isActive, remaining, progress, exerciseName, skipTimer } =
    useWorkoutTimer();
  const t = useTranslations("client.today");
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/90 backdrop-blur-xl"
        >
          {exerciseName && (
            <p className="mb-6 text-sm font-medium text-text-2">
              {exerciseName}
            </p>
          )}

          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            <svg
              width={SIZE}
              height={SIZE}
              className="-rotate-90"
              viewBox={`0 0 ${SIZE} ${SIZE}`}
            >
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--border)"
                strokeWidth={STROKE}
              />
              <motion.circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.3, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-6xl font-extrabold text-text-1">
                {remaining}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={skipTimer}
            className="mt-8 rounded-full border border-border px-6 py-2 text-sm text-text-2 transition-colors hover:border-accent hover:text-accent"
          >
            {t("skipRest")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
