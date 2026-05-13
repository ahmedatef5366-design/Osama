"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

type WaterTrackerProps = {
  cups: number;
  target?: number;
  onAdd: () => void;
};

export function WaterTracker({ cups, target = 8, onAdd }: WaterTrackerProps) {
  const t = useTranslations("client.water");
  const fillPercent = Math.min((cups / target) * 100, 100);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onAdd}
        className="relative flex h-16 w-12 items-end overflow-hidden rounded-lg border border-border bg-surface-high tap-target"
        aria-label={t("addCup")}
      >
        <motion.div
          className="w-full bg-info/40"
          initial={false}
          animate={{ height: `${fillPercent}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
        <svg
          className="absolute inset-0 m-auto"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--info)"
          strokeWidth="2"
        >
          <path d="M12 2v6M9 8h6M7 8l1.5 13a2 2 0 002 1h3a2 2 0 002-1L17 8" />
        </svg>
      </button>
      <div>
        <p className="font-mono text-lg font-bold text-text-1">
          {cups}/{target}
        </p>
        <p className="text-xs text-text-2">{t("cups")}</p>
      </div>
    </div>
  );
}
