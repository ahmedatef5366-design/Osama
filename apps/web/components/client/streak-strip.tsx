"use client";

import { useLocale, useTranslations } from "next-intl";
import type { CheckinSummary } from "@/types/api";

type Props = {
  summary: CheckinSummary | null;
  loading: boolean;
};

/**
 * Five-cell strip pinned at the top of the client today-page. Reads the
 * /api/checkin/summary roll-up and renders streak + weekly compliance +
 * 3 secondary metrics. The first cell shows a flame icon whose intensity
 * scales with the current streak: cold (≤0), warm (1–6), hot (≥7).
 */
export function StreakStrip({ summary, loading }: Props) {
  const t = useTranslations("client.todaySummary");
  const locale = useLocale();
  const fmt = (n: number) => n.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");

  if (loading && !summary) {
    return (
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse bg-surface-high" />
        ))}
      </div>
    );
  }

  const s = summary;
  const streak = s?.currentStreak ?? 0;
  const flameTone =
    streak >= 7 ? "text-accent" : streak >= 1 ? "text-warning" : "text-text-3";

  const cells: Array<{
    key: string;
    label: string;
    value: string;
    sub?: string;
    accent?: boolean;
  }> = [
    {
      key: "streak",
      label: t("streak"),
      value: fmt(streak),
      sub: s ? `${t("longest")}: ${fmt(s.longestStreak)}` : undefined,
      accent: streak > 0,
    },
    {
      key: "checks",
      label: t("weekChecks"),
      value: s ? `${fmt(s.weekCheckins)}/7` : "—",
    },
    {
      key: "compliance",
      label: t("weekCompliance"),
      value: s ? `${fmt(s.weekCompliance)}%` : "—",
    },
    {
      key: "water",
      label: t("weekWater"),
      value: s ? fmt(s.weekWaterCups) : "—",
    },
    {
      key: "sleep",
      label: t("weekSleep"),
      value: s ? fmt(s.weekSleepHours) : "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-5">
      {cells.map((cell, i) => (
        <div
          key={cell.key}
          className="relative flex flex-col justify-between gap-3 bg-surface px-5 py-5 transition-colors hover:bg-surface-high"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-text-3">
              {cell.label}
            </span>
            {i === 0 ? (
              <FlameGlyph className={`h-4 w-4 ${flameTone}`} />
            ) : null}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-display text-3xl font-extrabold tabular-nums ${
                cell.accent ? "text-accent" : "text-text-1"
              }`}
            >
              {cell.value}
            </span>
            {cell.sub ? (
              <span className="text-[10px] text-text-3 font-mono">
                {cell.sub}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function FlameGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 2c1.6 4 4 5 4 8a4 4 0 1 1-8 0c0-1.5.5-2 1-3" />
      <path d="M9 16a3 3 0 0 0 6 0c0-1-.5-2-1.5-2.5C13 13.8 13 13 13 12" />
    </svg>
  );
}
