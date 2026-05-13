"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import type { Food, Envelope } from "@/types/api";

// Debounced food-database search picker used inside the meal editor.
export function FoodSearch({
  onPick,
}: {
  onPick: (food: Food, grams: number) => void;
}) {
  const t = useTranslations("admin.clientDetail.nutrition");
  const [q, setQ] = useState("");
  const [grams, setGrams] = useState(100);

  const { data } = useQuery({
    queryKey: ["food-search", q],
    queryFn: () =>
      api<Food[]>(
        `/api/food-database?pageSize=8${q ? `&search=${encodeURIComponent(q)}` : ""}`,
      ),
    enabled: q.length > 0,
  });
  const items = (data as Envelope<Food[]> | undefined)?.data ?? [];

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchFood")}
          className="flex-1"
        />
        <Input
          type="number"
          value={grams}
          onChange={(e) => setGrams(Number(e.target.value) || 0)}
          className="w-24"
          min={1}
        />
        <span className="self-center text-text-3 text-xs">g</span>
      </div>
      {q && items.length > 0 && (
        <ul className="max-h-48 overflow-auto rounded-md border border-border bg-bg divide-y divide-border">
          {items.map((f) => (
            <li key={f.id}>
              <button
                onClick={() => {
                  onPick(f, grams);
                  setQ("");
                }}
                className="w-full text-start px-3 py-2 text-sm hover:bg-surface"
              >
                <span className="font-medium text-text-1">{f.name}</span>
                <span className="text-text-3 ms-2 text-xs">
                  {f.caloriesPer100g} kcal · {f.proteinPer100g}p ·{" "}
                  {f.carbsPer100g}c · {f.fatPer100g}f / 100g
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
