"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { APIError, api, apiData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  Client,
  Food,
  MacroCalcResult,
  Meal,
  NutritionPlan,
  NutritionPlanFull,
} from "@/types/api";
import { FoodSearch } from "./food-search";

type FoodItem = { name: string; grams: number; kcal?: number; foodId?: string };

export function NutritionTab({ clientId }: { clientId: string }) {
  const t = useTranslations("admin.clientDetail.nutrition");
  const qc = useQueryClient();

  const { data: client } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => apiData<Client>(`/api/clients/${clientId}`),
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ["nutrition-plans", clientId],
    queryFn: () =>
      apiData<NutritionPlan[]>(`/api/clients/${clientId}/nutrition-plans`),
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const planId =
    selectedPlanId ?? plans?.find((p) => p.isActive)?.id ?? plans?.[0]?.id ?? null;

  const createPlan = useMutation({
    mutationFn: async (body: Partial<NutritionPlan> & { mode: string }) =>
      apiData<NutritionPlan>(`/api/clients/${clientId}/nutrition-plan`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nutrition-plans", clientId] });
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <PlansHeader
        plans={plans ?? []}
        selectedId={planId}
        onSelect={setSelectedPlanId}
        onCreate={() =>
          createPlan.mutate({
            mode: "fixed",
            isActive: (plans ?? []).length === 0,
          })
        }
        creating={createPlan.isPending}
      />

      {client && (
        <MacroCalculator
          client={client}
          onApply={(r) => {
            if (!planId) return;
            void api(`/api/nutrition-plans/${planId}`, {
              method: "PATCH",
              body: {
                caloriesTarget: r.caloriesTarget,
                proteinG: r.proteinG,
                carbsG: r.carbsG,
                fatG: r.fatG,
              },
            }).then(() =>
              qc.invalidateQueries({ queryKey: ["nutrition-plan", planId] }),
            );
          }}
        />
      )}

      {planId ? (
        <PlanEditor planId={planId} clientId={clientId} />
      ) : (
        <Card>
          <CardBody className="py-10 text-center text-text-3">
            {t("noPlanYet")}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function PlansHeader({
  plans,
  selectedId,
  onSelect,
  onCreate,
  creating,
}: {
  plans: NutritionPlan[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  creating: boolean;
}) {
  const t = useTranslations("admin.clientDetail.nutrition");
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{t("plans")}</CardTitle>
        <Button size="sm" onClick={onCreate} disabled={creating}>
          {creating ? "…" : t("newPlan")}
        </Button>
      </CardHeader>
      <CardBody className="flex flex-wrap gap-2">
        {plans.length === 0 ? (
          <span className="text-text-3 text-sm">{t("noPlanYet")}</span>
        ) : (
          plans.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm border transition-colors",
                p.id === selectedId
                  ? "border-accent text-accent bg-accent-dim"
                  : "border-border text-text-2 hover:text-text-1",
              )}
            >
              {p.mode} · {p.caloriesTarget ?? "?"} kcal{" "}
              {p.isActive ? `· ${t("active")}` : ""}
            </button>
          ))
        )}
      </CardBody>
    </Card>
  );
}

function PlanEditor({ planId, clientId }: { planId: string; clientId: string }) {
  const t = useTranslations("admin.clientDetail.nutrition");
  const qc = useQueryClient();
  const { data: plan, isLoading } = useQuery({
    queryKey: ["nutrition-plan", planId],
    queryFn: () => apiData<NutritionPlanFull>(`/api/nutrition-plans/${planId}`),
  });

  const patchPlan = useMutation({
    mutationFn: async (body: Partial<NutritionPlan>) =>
      apiData<NutritionPlan>(`/api/nutrition-plans/${planId}`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nutrition-plan", planId] });
      qc.invalidateQueries({ queryKey: ["nutrition-plans", clientId] });
    },
  });

  if (isLoading || !plan) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("targets")}</CardTitle>
        </CardHeader>
        <CardBody className="grid md:grid-cols-5 gap-4 text-sm">
          <Field
            label={t("mode")}
            value={plan.mode}
            onChange={(v) =>
              patchPlan.mutate({ mode: v === "flexible" ? "flexible" : "fixed" })
            }
            type="select"
            options={["fixed", "flexible"]}
          />
          <Field
            label={t("calories")}
            value={String(plan.caloriesTarget ?? "")}
            onChange={(v) =>
              patchPlan.mutate({ caloriesTarget: v ? Number(v) : undefined })
            }
          />
          <Field
            label={t("protein")}
            value={String(plan.proteinG ?? "")}
            onChange={(v) =>
              patchPlan.mutate({ proteinG: v ? Number(v) : undefined })
            }
          />
          <Field
            label={t("carbs")}
            value={String(plan.carbsG ?? "")}
            onChange={(v) =>
              patchPlan.mutate({ carbsG: v ? Number(v) : undefined })
            }
          />
          <Field
            label={t("fat")}
            value={String(plan.fatG ?? "")}
            onChange={(v) =>
              patchPlan.mutate({ fatG: v ? Number(v) : undefined })
            }
          />
        </CardBody>
      </Card>

      <MealList planId={planId} meals={plan.meals} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "select";
  options?: string[];
}) {
  return (
    <label className="space-y-1 text-text-2">
      <span className="text-xs uppercase tracking-[0.12em] text-text-3">
        {label}
      </span>
      {type === "select" && options ? (
        <select
          className="input-base w-full h-11 px-3 rounded-md"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function MealList({ planId, meals }: { planId: string; meals: Meal[] }) {
  const t = useTranslations("admin.clientDetail.nutrition");
  const qc = useQueryClient();

  const createMeal = useMutation({
    mutationFn: async () =>
      apiData<Meal>(`/api/nutrition-plans/${planId}/meals`, {
        method: "POST",
        body: {
          mealType: "meal",
          sortOrder: meals.length + 1,
          foodItems: [] as FoodItem[],
        },
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["nutrition-plan", planId] }),
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: string) =>
      api(`/api/meals/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["nutrition-plan", planId] }),
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{t("meals")}</CardTitle>
        <Button size="sm" onClick={() => createMeal.mutate()}>
          {t("addMeal")}
        </Button>
      </CardHeader>
      <CardBody className="space-y-3">
        {meals.length === 0 && (
          <p className="text-text-3 text-sm">{t("noMealsYet")}</p>
        )}
        {meals.map((m) => (
          <MealRow
            key={m.id}
            meal={m}
            planId={planId}
            onDelete={() => deleteMeal.mutate(m.id)}
          />
        ))}
      </CardBody>
    </Card>
  );
}

function MealRow({
  meal,
  planId,
  onDelete,
}: {
  meal: Meal;
  planId: string;
  onDelete: () => void;
}) {
  const t = useTranslations("admin.clientDetail.nutrition");
  const qc = useQueryClient();
  const items: FoodItem[] = Array.isArray(meal.foodItems)
    ? (meal.foodItems as FoodItem[])
    : [];

  const patch = useMutation({
    mutationFn: async (body: { mealType?: string; foodItems?: FoodItem[] }) =>
      api(`/api/meals/${meal.id}`, { method: "PATCH", body }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["nutrition-plan", planId] }),
  });

  const totals = items.reduce(
    (acc, it) => {
      const kcal = (it.kcal ?? 0) * (it.grams / 100);
      acc.kcal += kcal;
      return acc;
    },
    { kcal: 0 },
  );

  return (
    <div className="rounded-md border border-border bg-bg p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          value={meal.mealType}
          onChange={(e) => patch.mutate({ mealType: e.target.value })}
          className="max-w-[14rem]"
        />
        <span className="text-text-3 text-xs">
          {items.length} {t("items")} · {Math.round(totals.kcal)} kcal
        </span>
        <button
          onClick={onDelete}
          className="ms-auto text-text-3 hover:text-danger text-xs"
        >
          {t("removeMeal")}
        </button>
      </div>

      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-center gap-3 text-sm text-text-2 bg-surface rounded px-3 py-2"
          >
            <span className="flex-1 truncate">{it.name}</span>
            <span className="text-text-3 tabular-nums">{it.grams} g</span>
            <button
              className="text-text-3 hover:text-danger text-xs"
              onClick={() =>
                patch.mutate({
                  foodItems: items.filter((_, j) => j !== i),
                })
              }
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <FoodSearch
        onPick={(f, grams) =>
          patch.mutate({
            foodItems: [
              ...items,
              {
                name: f.name,
                grams,
                kcal: f.caloriesPer100g,
                foodId: f.id,
              },
            ],
          })
        }
      />
    </div>
  );
}

function MacroCalculator({
  client,
  onApply,
}: {
  client: Client;
  onApply: (r: MacroCalcResult) => void;
}) {
  const t = useTranslations("admin.clientDetail.nutrition.calc");
  const [activity, setActivity] = useState("moderately_active");
  const [goal, setGoal] = useState<"fat_loss" | "maintenance" | "muscle_gain">(
    client.goal === "fat_loss" || client.goal === "muscle_gain"
      ? (client.goal as "fat_loss" | "muscle_gain")
      : "maintenance",
  );
  const [result, setResult] = useState<MacroCalcResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!client.currentWeightKg || !client.heightCm || !client.age || !client.sex) {
      setErr(t("missingProfileData"));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await apiData<MacroCalcResult>("/api/macros/calc", {
        method: "POST",
        body: {
          weightKg: client.currentWeightKg,
          heightCm: client.heightCm,
          ageYears: client.age,
          sex: client.sex,
          activityLevel: activity,
          goal,
        },
      });
      setResult(r);
    } catch (e) {
      setErr(e instanceof APIError ? e.message : "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardBody className="grid md:grid-cols-4 gap-4 items-end">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.12em] text-text-3">
            {t("activity")}
          </span>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="input-base w-full h-11 px-3 rounded-md"
          >
            <option value="sedentary">sedentary</option>
            <option value="lightly_active">lightly_active</option>
            <option value="moderately_active">moderately_active</option>
            <option value="very_active">very_active</option>
            <option value="extra_active">extra_active</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.12em] text-text-3">
            {t("goal")}
          </span>
          <select
            value={goal}
            onChange={(e) =>
              setGoal(e.target.value as "fat_loss" | "maintenance" | "muscle_gain")
            }
            className="input-base w-full h-11 px-3 rounded-md"
          >
            <option value="fat_loss">fat_loss</option>
            <option value="maintenance">maintenance</option>
            <option value="muscle_gain">muscle_gain</option>
          </select>
        </label>
        <Button onClick={submit} disabled={busy}>
          {busy ? "…" : t("submit")}
        </Button>
        {result && (
          <Button variant="outline" onClick={() => onApply(result)}>
            {t("applyToPlan")}
          </Button>
        )}
        {err && (
          <p className="text-danger text-sm col-span-full">{err}</p>
        )}
        {result && (
          <dl className="col-span-full grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <Stat label="BMR" value={`${result.bmr}`} />
            <Stat label="TDEE" value={`${result.tdee}`} />
            <Stat label={t("calories")} value={`${result.caloriesTarget}`} />
            <Stat label={t("protein")} value={`${result.proteinG}g`} />
            <Stat label={t("fat")} value={`${result.fatG}g`} />
          </dl>
        )}
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg rounded-md px-3 py-2 border border-border">
      <div className="text-xs text-text-3 uppercase tracking-[0.12em]">{label}</div>
      <div className="text-text-1 font-semibold">{value}</div>
    </div>
  );
}
