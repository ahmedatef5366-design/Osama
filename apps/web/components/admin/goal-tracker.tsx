"use client";

import { motion } from "framer-motion";

type Milestone = {
  id: string;
  label: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
};

type GoalTrackerProps = {
  clientName: string;
  goal: string;
  startDate: string;
  targetDate: string;
  progressPct: number;
  milestones: Milestone[];
};

export function GoalTracker({ clientName, goal, startDate, targetDate, progressPct, milestones }: GoalTrackerProps) {
  const completedCount = milestones.filter((m) => m.completed).length;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-3 text-xs font-mono uppercase tracking-wider">Goal Tracker</p>
          <h3 className="font-display text-text-1 text-xl uppercase tracking-tight mt-1">{clientName}</h3>
          <p className="text-text-2 text-sm mt-0.5">{goal}</p>
        </div>
        <div className="text-end">
          <p className="font-display text-accent text-3xl">{progressPct}%</p>
          <p className="text-text-3 text-xs font-mono">complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-text-3 font-mono mb-2">
          <span>{startDate}</span>
          <span>{targetDate}</span>
        </div>
        <div className="h-2 rounded-full bg-surface-high overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div>
        <p className="text-text-2 text-xs font-mono uppercase tracking-wider mb-3">
          Milestones ({completedCount}/{milestones.length})
        </p>
        <div className="space-y-2">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                m.completed ? "bg-success/10" : "bg-surface-high"
              }`}
            >
              <span className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                m.completed ? "border-success bg-success text-bg" : "border-border"
              }`}>
                {m.completed ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : null}
              </span>
              <span className={`flex-1 ${m.completed ? "text-text-2 line-through" : "text-text-1"}`}>
                {m.label}
              </span>
              <span className="text-text-3 text-xs font-mono">
                {m.completed ? m.completedDate : m.targetDate}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
