"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiData } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutPlanFull } from "@/types/api";

export default function TodayPage() {
  return <TodayContent />;
}

function TodayContent() {
  const t = useTranslations("client.today");
  const [plan, setPlan] = useState<WorkoutPlanFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const client = await apiData<{ id: string }>("/api/clients/me");
        const data = await apiData<WorkoutPlanFull>(
          `/api/clients/${client.id}/workout-plan`,
        );
        setPlan(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dayIndex = new Date().getDay();
  const todayDay = plan?.days?.find((d) => d.dayOrder === dayIndex);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold text-text-1">
        {t("title")}
      </h1>

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
          <h2 className="text-lg font-semibold text-text-1">
            {todayDay.name}
          </h2>
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
