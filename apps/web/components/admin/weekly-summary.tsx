"use client";

import { motion } from "framer-motion";

type WeeklySummaryProps = {
  clientName: string;
  weekLabel: string;
  weightStart: number;
  weightEnd: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  avgCalories: number;
  targetCalories: number;
  avgProtein: number;
  targetProtein: number;
  checkinDays: number;
  notes: string[];
};

export function WeeklySummary({
  clientName,
  weekLabel,
  weightStart,
  weightEnd,
  workoutsCompleted,
  workoutsPlanned,
  avgCalories,
  targetCalories,
  avgProtein,
  targetProtein,
  checkinDays,
  notes,
}: WeeklySummaryProps) {
  const weightDelta = weightEnd - weightStart;
  const workoutPct = workoutsPlanned > 0 ? Math.round((workoutsCompleted / workoutsPlanned) * 100) : 0;
  const caloriePct = targetCalories > 0 ? Math.round((avgCalories / targetCalories) * 100) : 0;
  const proteinPct = targetProtein > 0 ? Math.round((avgProtein / targetProtein) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-3 text-xs font-mono uppercase tracking-wider">Weekly Summary</p>
          <h3 className="font-display text-text-1 text-xl uppercase tracking-tight mt-1">{clientName}</h3>
          <p className="text-text-2 text-xs font-mono mt-0.5">{weekLabel}</p>
        </div>
        <div className="text-end">
          <p className={`font-display text-2xl ${weightDelta < 0 ? "text-success" : weightDelta > 0 ? "text-warning" : "text-text-1"}`}>
            {weightDelta > 0 ? "+" : ""}{weightDelta.toFixed(1)} kg
          </p>
          <p className="text-text-3 text-xs font-mono">
            {weightStart} &rarr; {weightEnd}
          </p>
        </div>
      </div>

      {/* Metric bars */}
      <div className="space-y-4">
        <MetricBar label="Workouts" value={`${workoutsCompleted}/${workoutsPlanned}`} pct={workoutPct} />
        <MetricBar label="Avg calories" value={`${avgCalories}/${targetCalories}`} pct={caloriePct} />
        <MetricBar label="Avg protein" value={`${avgProtein}g/${targetProtein}g`} pct={proteinPct} />
        <MetricBar label="Check-ins" value={`${checkinDays}/7 days`} pct={Math.round((checkinDays / 7) * 100)} />
      </div>

      {/* Coach notes */}
      {notes.length > 0 ? (
        <div>
          <p className="text-text-3 text-xs font-mono uppercase tracking-wider mb-2">Coach Notes</p>
          <ul className="space-y-1.5">
            {notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-text-2 text-sm">
                <span className="text-accent mt-1 shrink-0">&bull;</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function MetricBar({ label, value, pct }: { label: string; value: string; pct: number }) {
  const color = pct >= 90 ? "bg-success" : pct >= 70 ? "bg-accent" : pct >= 50 ? "bg-warning" : "bg-danger";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-2">{label}</span>
        <span className="text-text-1 font-mono">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-high overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
