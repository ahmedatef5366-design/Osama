"use client";

import { cn } from "@/lib/utils";

type StreakHeatmapProps = {
  checkinDates: string[];
  weeks?: number;
};

function getLast7Weeks(): string[][] {
  const weeks: string[][] = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek - 42);

  for (let w = 0; w < 7; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      week.push(date.toISOString().slice(0, 10));
    }
    weeks.push(week);
  }
  return weeks;
}

export function StreakHeatmap({ checkinDates }: StreakHeatmapProps) {
  const checkinSet = new Set(checkinDates);
  const weeks = getLast7Weeks();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day) => {
            const hasCheckin = checkinSet.has(day);
            const isFuture = day > today;
            return (
              <div
                key={day}
                className={cn(
                  "h-3 w-3 rounded-[2px] transition-colors",
                  isFuture
                    ? "bg-surface-high"
                    : hasCheckin
                      ? "bg-accent"
                      : "bg-surface-high/60",
                )}
                title={`${day}: ${hasCheckin ? "checked in" : "no check-in"}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
