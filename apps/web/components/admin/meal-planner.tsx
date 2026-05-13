"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";

type MealItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Meal = {
  id: string;
  name: string;
  items: MealItem[];
};

type MealPlannerProps = {
  meals: Meal[];
  onUpdate: (meals: Meal[]) => void;
  foodDatabase: MealItem[];
};

function SortableItem({ item }: { item: MealItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center justify-between rounded-md border border-border bg-surface-high px-3 py-2 text-sm active:cursor-grabbing"
    >
      <span className="text-text-1">{item.name}</span>
      <span className="font-mono text-xs text-text-2">{item.calories}cal</span>
    </div>
  );
}

export function MealPlanner({ meals, onUpdate, foodDatabase }: MealPlannerProps) {
  const t = useTranslations("admin.mealPlanner");
  const [localMeals, setLocalMeals] = useState(meals);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = useCallback(
    (mealId: string) =>
      (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setLocalMeals((prev) => {
          const next = prev.map((meal) => {
            if (meal.id !== mealId) return meal;
            const oldIdx = meal.items.findIndex((i) => i.id === active.id);
            const newIdx = meal.items.findIndex((i) => i.id === over.id);
            if (oldIdx === -1 || newIdx === -1) return meal;
            return { ...meal, items: arrayMove(meal.items, oldIdx, newIdx) };
          });
          onUpdate(next);
          return next;
        });
      },
    [onUpdate],
  );

  const addItem = useCallback(
    (mealId: string, item: MealItem) => {
      setLocalMeals((prev) => {
        const next = prev.map((meal) => {
          if (meal.id !== mealId) return meal;
          return {
            ...meal,
            items: [...meal.items, { ...item, id: `${item.id}-${Date.now()}` }],
          };
        });
        onUpdate(next);
        return next;
      });
    },
    [onUpdate],
  );

  return (
    <div className="space-y-4">
      {localMeals.map((meal) => (
        <div key={meal.id} className="rounded-lg border border-border bg-surface p-4">
          <h4 className="mb-2 text-sm font-semibold text-text-1">{meal.name}</h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd(meal.id)}
          >
            <SortableContext
              items={meal.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {meal.items.map((item) => (
                  <SortableItem key={item.id} item={item} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {meal.items.length === 0 && (
            <p className="py-3 text-center text-xs text-text-3">{t("dragHere")}</p>
          )}
          <div className="mt-2 border-t border-border pt-2">
            <select
              className="input-base w-full rounded-md px-2 py-1 text-xs"
              defaultValue=""
              onChange={(e) => {
                const item = foodDatabase.find((f) => f.id === e.target.value);
                if (item) addItem(meal.id, item);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                {t("addFood")}
              </option>
              {foodDatabase.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.calories}cal)
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
