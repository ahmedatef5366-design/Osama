"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

type WorkoutSummaryProps = {
  visible: boolean;
  onDismiss: () => void;
  totalSets: number;
  totalExercises: number;
  durationMinutes: number;
  topWeight?: number;
};

export function WorkoutSummary({
  visible,
  onDismiss,
  totalSets,
  totalExercises,
  durationMinutes,
  topWeight,
}: WorkoutSummaryProps) {
  const t = useTranslations("client.workoutSummary");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed inset-x-4 bottom-24 z-40 rounded-xl border border-accent/30 bg-surface p-5 shadow-lg shadow-accent/10"
        >
          <h3 className="mb-3 font-display text-lg font-bold text-text-1">
            {t("title")}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <Stat label={t("exercises")} value={String(totalExercises)} />
            <Stat label={t("sets")} value={String(totalSets)} />
            <Stat label={t("duration")} value={`${durationMinutes}m`} />
            {topWeight != null && (
              <Stat label={t("topWeight")} value={`${topWeight}kg`} />
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="mt-4 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-bg transition-transform active:scale-[0.97]"
          >
            {t("done")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-high p-2">
      <p className="font-mono text-xl font-bold text-accent">{value}</p>
      <p className="text-[10px] text-text-2">{label}</p>
    </div>
  );
}
