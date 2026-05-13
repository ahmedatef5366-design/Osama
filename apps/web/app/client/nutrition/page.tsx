"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiData } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MacroRing } from "@/components/client/macro-ring";
import type { NutritionPlan } from "@/types/api";
import type { FoodLogEntry, DailyMacros } from "@/types/food-log";

export default function NutritionPage() {
  return <NutritionContent />;
}

function NutritionContent() {
  const t = useTranslations("client.nutrition");
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const client = await apiData<{ id: string }>("/api/clients/me");
        const [planData, logData] = await Promise.all([
          apiData<NutritionPlan>(
            `/api/clients/${client.id}/nutrition-plan`,
          ).catch(() => null),
          apiData<FoodLogEntry[]>(
            `/api/food-log?date=${new Date().toISOString().slice(0, 10)}`,
          ).catch(() => []),
        ]);
        setPlan(planData);
        setLogs(logData ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const daily: DailyMacros = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calculatedCalories,
      protein: acc.protein + l.calculatedProtein,
      carbs: acc.carbs + l.calculatedCarbs,
      fat: acc.fat + l.calculatedFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold text-text-1">
        {t("title")}
      </h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-surface-high"
            />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardBody>
            <p className="text-text-2 text-sm">{t("error")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("macros")}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-4 gap-2">
                <MacroRing
                  label={t("calories")}
                  current={daily.calories}
                  target={plan?.caloriesTarget ?? 2000}
                  unit="kcal"
                  size={80}
                />
                <MacroRing
                  label={t("protein")}
                  current={daily.protein}
                  target={plan?.proteinG ?? 150}
                />
                <MacroRing
                  label={t("carbs")}
                  current={daily.carbs}
                  target={plan?.carbsG ?? 200}
                />
                <MacroRing
                  label={t("fat")}
                  current={daily.fat}
                  target={plan?.fatG ?? 60}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("todayLog")}</CardTitle>
            </CardHeader>
            <CardBody>
              {logs.length === 0 ? (
                <p className="text-sm text-text-2">{t("noLogs")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {logs.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-1">
                          {entry.customFoodName ?? t("food")}
                        </p>
                        <p className="text-xs text-text-3">
                          {entry.weightGrams}g · {entry.mealType}
                        </p>
                      </div>
                      <span className="font-mono text-sm text-accent">
                        {Math.round(entry.calculatedCalories)} kcal
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
