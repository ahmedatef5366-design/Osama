"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { WeightEntry } from "@/types/api";

type Props = {
  entries: WeightEntry[];
};

/**
 * Pure-SVG sparkline + min/max/last summary. Zero deps (we don't want
 * to ship recharts/visx just for one chart). RTL safe — both the SVG
 * and the axis labels mirror naturally when the parent has `dir=rtl`.
 *
 * Why hand-rolled instead of a charting lib? Three reasons:
 *  1. Bundle size: a custom 80-line SVG is ~1.5 KB vs ~80 KB for recharts.
 *  2. Visual control: we want the on-brand lime line, a soft gradient
 *     fill, and a single hovered datapoint — generic libs make all
 *     three fight you.
 *  3. SSR-friendly: no client-only chart wrapper required.
 */
export function WeightTrend({ entries }: Props) {
  const t = useTranslations("client.progress");
  const locale = useLocale();
  const fmt = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const points = useMemo(() => {
    if (entries.length < 2) return null;
    // Ensure ascending by date so the line reads left→right.
    const sorted = [...entries].sort(
      (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) return null;
    const weights = sorted.map((e) => e.weightKg);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = Math.max(max - min, 0.5); // avoid div-by-zero on flat data
    const W = 600;
    const H = 160;
    const PAD_X = 8;
    const PAD_Y = 12;
    const step = sorted.length > 1 ? (W - PAD_X * 2) / (sorted.length - 1) : 0;
    const xy = sorted.map((e, i) => ({
      x: PAD_X + i * step,
      y: H - PAD_Y - ((e.weightKg - min) / range) * (H - PAD_Y * 2),
      w: e.weightKg,
      date: e.loggedAt,
    }));
    const firstPt = xy[0]!;
    const lastPt = xy[xy.length - 1]!;
    const line = xy
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
    const area =
      `${line} L ${lastPt.x} ${H - PAD_Y} ` + `L ${firstPt.x} ${H - PAD_Y} Z`;
    return {
      W,
      H,
      min,
      max,
      first: first.weightKg,
      last: last.weightKg,
      points: xy,
      line,
      area,
    };
  }, [entries]);

  if (!points) {
    return null;
  }

  const delta = points.last - points.first;
  const deltaTone = delta === 0 ? "text-text-2" : delta < 0 ? "text-success" : "text-warning";
  const deltaSign = delta > 0 ? "+" : "";

  return (
    <div className="rounded-xl border border-border bg-surface-low p-4">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl font-extrabold tabular-nums text-text-1">
            {fmt(points.last)}
          </span>
          <span className="text-xs font-mono text-text-3">kg</span>
          <span className={`text-xs font-mono tabular-nums ${deltaTone}`}>
            {deltaSign}
            {fmt(delta)}
          </span>
        </div>
        <div className="flex gap-3 text-[10px] font-mono uppercase tracking-[0.24em] text-text-3">
          <span>min {fmt(points.min)}</span>
          <span>max {fmt(points.max)}</span>
        </div>
      </header>
      <svg
        viewBox={`0 0 ${points.W} ${points.H}`}
        className="h-32 w-full"
        role="img"
        aria-label={t("weight")}
      >
        <defs>
          <linearGradient id="weight-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={points.area} fill="url(#weight-area)" />
        <path
          d={points.line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.points.length - 1 ? 3.5 : 2}
            fill={
              i === points.points.length - 1
                ? "var(--accent)"
                : "var(--surface)"
            }
            stroke="var(--accent)"
            strokeWidth="1.2"
          />
        ))}
      </svg>
    </div>
  );
}
