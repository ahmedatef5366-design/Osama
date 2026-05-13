"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { apiData } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakStrip } from "@/components/client/streak-strip";
import { HabitsCard } from "@/components/client/habits-card";
import type { CheckinSummary, WorkoutPlanFull } from "@/types/api";

export default function TodayPage() {
  return <TodayContent />;
}

function TodayContent() {
  const t = useTranslations("client.today");
  const tSum = useTranslations("client.todaySummary");
  const locale = useLocale();
  const [plan, setPlan] = useState<WorkoutPlanFull | null>(null);
  const [summary, setSummary] = useState<CheckinSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [me, sum] = await Promise.allSettled([
          apiData<{ id: string }>("/api/clients/me"),
          apiData<CheckinSummary>("/api/checkin/summary"),
        ]);
        if (!alive) return;
        if (sum.status === "fulfilled") setSummary(sum.value);
        if (me.status === "fulfilled") {
          try {
            const data = await apiData<WorkoutPlanFull>(
              `/api/clients/${me.value.id}/workout-plan`,
            );
            if (alive) setPlan(data);
          } catch {
            if (alive) setError(true);
          }
        } else {
          setError(true);
        }
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const dayIndex = new Date().getDay();
  const todayDay = plan?.days?.find((d) => d.dayOrder === dayIndex);

  // Today's habit checklist mirrors the metrics the daily check-in form
  // collects (water, sleep, training, diet, cardio). Ticking habits here
  // is local-only — they're persisted when the user opens /client/checkin.
  const habitDefaults = useMemo(
    () => ({
      water: false,
      sleep: false,
      training: false,
      diet: false,
      cardio: false,
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-text-3">
            {new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="font-display text-4xl font-extrabold text-text-1 mt-1">
            {t("title")}
          </h1>
        </div>
        {summary && !summary.checkedInToday ? (
          <Link
            href="/client/checkin"
            className="btn-accent rounded-md px-4 py-2 text-sm font-semibold"
          >
            {tSum("checkinCta")}
          </Link>
        ) : null}
      </header>

      <StreakStrip summary={summary} loading={loading} />

      <HabitsCard defaults={habitDefaults} />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-surface-high"
            />
          ))}
        </div>
      ) : error || !plan ? (
        <Card>
          <CardBody>
            <p className="text-text-2 text-sm">{t("noActivePlan")}</p>
          </CardBody>
        </Card>
      ) : !todayDay ? (
        <Card>
          <CardBody>
            <p className="text-text-2 text-sm">{t("restDay")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-1">{todayDay.name}</h2>
          {todayDay.exercises.map((ex) => (
            <Card key={ex.id}>
              <CardHeader>
                <CardTitle>{ex.customName ?? "Exercise"}</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-3 text-sm text-text-2">
                  {ex.sets != null && (
                    <span>
                      {ex.sets} {t("sets")}
                    </span>
                  )}
                  {ex.reps && (
                    <span>
                      {ex.reps} {t("reps")}
                    </span>
                  )}
                  {ex.restSeconds != null && (
                    <span>
                      {ex.restSeconds}
                      {t("secs")} {t("rest")}
                    </span>
                  )}
                </div>
                {ex.notes && (
                  <p className="mt-2 text-xs text-text-3">{ex.notes}</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
