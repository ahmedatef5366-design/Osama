"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MacroRingProps = {
  label: string;
  current: number;
  target: number;
  unit?: string;
  size?: number;
  strokeWidth?: number;
};

function colorForPercent(pct: number): string {
  if (pct > 100) return "var(--danger)";
  if (pct >= 80) return "var(--warning)";
  return "var(--accent)";
}

export function MacroRing({
  label,
  current,
  target,
  unit = "g",
  size = 100,
  strokeWidth = 8,
}: MacroRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = target > 0 ? (current / target) * 100 : 0;
  const clampedPercent = Math.min(percent, 100);
  const offset = circumference * (1 - clampedPercent / 100);
  const color = colorForPercent(percent);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-mono text-sm font-bold",
              percent > 100 ? "text-danger" : "text-text-1",
            )}
          >
            {Math.round(current)}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-text-2">{label}</span>
      <span className="text-[10px] text-text-3">
        / {Math.round(target)}
        {unit}
      </span>
    </div>
  );
}
