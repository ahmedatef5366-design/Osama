"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type CheckinDay = {
  date: string;
  checkedIn: number;
  total: number;
};

type CheckinCalendarProps = {
  days: CheckinDay[];
};

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay();
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(startDay).fill(null) as null[];

  for (let d = 1; d <= lastDate; d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

export function CheckinCalendar({ days }: CheckinCalendarProps) {
  const t = useTranslations("admin.calendar");
  const now = new Date();
  const dayMap = useMemo(() => {
    const m = new Map<string, CheckinDay>();
    for (const d of days) m.set(d.date, d);
    return m;
  }, [days]);

  const weeks = getMonthGrid(now.getFullYear(), now.getMonth());
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-text-2">{t("title")}</h3>
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map((d) => (
          <span key={d} className="text-[10px] font-medium text-text-3 pb-1">
            {d}
          </span>
        ))}
        {weeks.flat().map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const iso = date.toISOString().slice(0, 10);
          const entry = dayMap.get(iso);
          const ratio = entry && entry.total > 0 ? entry.checkedIn / entry.total : 0;
          const isToday = iso === now.toISOString().slice(0, 10);

          return (
            <div
              key={iso}
              className={cn(
                "flex h-8 items-center justify-center rounded text-xs transition-colors",
                isToday && "ring-1 ring-accent",
                ratio >= 0.8
                  ? "bg-success/20 text-success"
                  : ratio >= 0.5
                    ? "bg-warning/20 text-warning"
                    : ratio > 0
                      ? "bg-danger/20 text-danger"
                      : "text-text-3",
              )}
              title={entry ? `${entry.checkedIn}/${entry.total}` : iso}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
