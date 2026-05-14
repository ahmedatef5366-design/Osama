"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Habit = "water" | "sleep" | "training" | "diet" | "cardio";
type HabitState = Record<Habit, boolean>;

type Props = {
  defaults: HabitState;
};

const ICONS: Record<Habit, (className: string) => JSX.Element> = {
  water: (className) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 3.5c4 5 6 8 6 11a6 6 0 1 1-12 0c0-3 2-6 6-11z" />
    </svg>
  ),
  sleep: (className) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 14a9 9 0 1 1-10-10 7 7 0 0 0 10 10z" />
    </svg>
  ),
  training: (className) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 8v8M18 8v8M3 12h3M18 12h3M9 6v12M15 6v12" />
    </svg>
  ),
  diet: (className) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 4 9 14 14 0 0 1-4 9 14 14 0 0 1-4-9 14 14 0 0 1 4-9z" />
    </svg>
  ),
  cardio: (className) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
};

/**
 * Plain-checklist habit tracker on /client/today. Persistence is
 * intentionally local-only — when the user opens /client/checkin the
 * form is pre-populated from the same habit ticks, then saved to the
 * server. This keeps the today-page fast and offline-friendly while
 * still rolling up into the canonical daily-checkin record.
 */
export function HabitsCard({ defaults }: Props) {
  const t = useTranslations("client.habits");
  const [state, setState] = useState<HabitState>(defaults);

  const toggle = (k: Habit) =>
    setState((prev) => ({ ...prev, [k]: !prev[k] }));

  const items: Array<{ k: Habit; label: string }> = [
    { k: "water", label: t("water") },
    { k: "sleep", label: t("sleep") },
    { k: "training", label: t("training") },
    { k: "diet", label: t("diet") },
    { k: "cardio", label: t("cardio") },
  ];

  const done = items.filter((i) => state[i.k]).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-text-1">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-text-2">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-10">
            <svg
              viewBox="0 0 36 36"
              className="-rotate-90"
              aria-hidden
              role="img"
            >
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--border)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-mono text-[10px] font-bold text-text-1">
              {pct}%
            </span>
          </div>
        </div>
      </header>

      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map(({ k, label }) => {
          const checked = state[k];
          return (
            <li key={k}>
              <button
                type="button"
                onClick={() => toggle(k)}
                aria-pressed={checked}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-start text-sm transition-all ${
                  checked
                    ? "border-accent/40 bg-accent/5 text-text-1"
                    : "border-border bg-surface-high text-text-2 hover:border-border-hover hover:text-text-1"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-lg ${
                    checked ? "bg-accent/15 text-accent" : "bg-bg text-text-3"
                  }`}
                  aria-hidden
                >
                  {ICONS[k]("h-4 w-4")}
                </span>
                <span className="flex-1 font-medium">{label}</span>
                <span
                  aria-hidden
                  className={`grid h-5 w-5 place-items-center rounded-md border transition-colors ${
                    checked
                      ? "border-accent bg-accent text-text-on-accent"
                      : "border-border bg-transparent text-transparent"
                  }`}
                >
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                  >
                    <path d="M2 6l3 3 5-6" />
                  </svg>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <footer className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-text-3">
        <span className="font-mono tabular-nums">
          {done}/{items.length}
        </span>
        <Link
          href="/client/checkin"
          className="text-accent hover:text-accent-soft"
        >
          {t("save")} →
        </Link>
      </footer>
    </section>
  );
}
