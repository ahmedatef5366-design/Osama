"use client";

import { motion } from "framer-motion";

type WeekDay = {
  day: string;
  completed: boolean;
  partial?: boolean;
};

type CompletionRateProps = {
  clientName: string;
  weeklyRate: number;
  monthlyRate: number;
  currentStreak: number;
  thisWeek: WeekDay[];
};

export function CompletionRate({ clientName, weeklyRate, monthlyRate, currentStreak, thisWeek }: CompletionRateProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-3 text-xs font-mono uppercase tracking-wider">Workout Completion</p>
          <h3 className="font-display text-text-1 text-xl uppercase tracking-tight mt-1">{clientName}</h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1">
          <span className="text-accent text-xs font-mono">{currentStreak} day streak</span>
        </div>
      </div>

      {/* Weekly dots */}
      <div>
        <p className="text-text-3 text-xs font-mono mb-2">This Week</p>
        <div className="flex gap-2">
          {thisWeek.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={`size-8 rounded-lg flex items-center justify-center text-xs font-mono ${
                  d.completed
                    ? "bg-accent text-bg"
                    : d.partial
                      ? "bg-warning/20 text-warning border border-warning/30"
                      : "bg-surface-high text-text-3"
                }`}
              >
                {d.completed ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : d.partial ? (
                  "~"
                ) : (
                  ""
                )}
              </div>
              <span className="text-text-3 text-[10px] font-mono">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 gap-4">
        <RateCircle label="This week" rate={weeklyRate} />
        <RateCircle label="This month" rate={monthlyRate} />
      </div>
    </div>
  );
}

function RateCircle({ label, rate }: { label: string; rate: number }) {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-20">
        <svg viewBox="0 0 80 80" className="size-full -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--surface-high)" strokeWidth="4" />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-text-1 text-lg">{rate}%</span>
        </div>
      </div>
      <span className="text-text-3 text-xs font-mono">{label}</span>
    </div>
  );
}
