"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";

type ClientStats = {
  id: string;
  name: string;
  avgCompliance: number;
  currentWeight: number;
  startWeight: number;
  checkinStreak: number;
};

type ClientComparisonProps = {
  clientA: ClientStats;
  clientB: ClientStats;
};

export function ClientComparison({ clientA, clientB }: ClientComparisonProps) {
  const t = useTranslations("admin.comparison");

  const metrics: Array<{
    key: string;
    valueA: number | string;
    valueB: number | string;
    unit?: string;
    higherIsBetter?: boolean;
  }> = [
    {
      key: "compliance",
      valueA: clientA.avgCompliance,
      valueB: clientB.avgCompliance,
      unit: "%",
      higherIsBetter: true,
    },
    {
      key: "weightChange",
      valueA: +(clientA.currentWeight - clientA.startWeight).toFixed(1),
      valueB: +(clientB.currentWeight - clientB.startWeight).toFixed(1),
      unit: "kg",
    },
    {
      key: "streak",
      valueA: clientA.checkinStreak,
      valueB: clientB.checkinStreak,
      unit: "d",
      higherIsBetter: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={clientA.name} size="sm" />
          <span className="text-sm font-medium text-text-1">{clientA.name}</span>
        </div>
        <span className="text-xs text-text-3">{t("vs")}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-1">{clientB.name}</span>
          <Avatar name={clientB.name} size="sm" />
        </div>
      </div>

      {metrics.map((m) => (
        <div key={m.key} className="space-y-1">
          <p className="text-center text-xs text-text-2">{t(m.key)}</p>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-right font-mono text-sm font-bold text-text-1">
              {m.valueA}{m.unit}
            </span>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-high">
              <div
                className="h-full bg-accent transition-all"
                style={{
                  width: `${Math.min(100, (Number(m.valueA) / (Number(m.valueA) + Number(m.valueB) || 1)) * 100)}%`,
                }}
              />
            </div>
            <span className="flex-1 font-mono text-sm font-bold text-text-1">
              {m.valueB}{m.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
