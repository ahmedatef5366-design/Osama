"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api, apiData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  Envelope,
  ExerciseLibraryItem,
  WorkoutDay,
  WorkoutExercise,
  WorkoutPlan,
  WorkoutPlanFull,
} from "@/types/api";

export function WorkoutTab({ clientId }: { clientId: string }) {
  const t = useTranslations("admin.clientDetail.workout");
  const qc = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["workout-plans", clientId],
    queryFn: () =>
      apiData<WorkoutPlan[]>(`/api/clients/${clientId}/workout-plans`),
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const planId =
    selectedPlanId ?? plans?.find((p) => p.isActive)?.id ?? plans?.[0]?.id ?? null;

  const createPlan = useMutation({
    mutationFn: async () =>
      apiData<WorkoutPlan>(`/api/clients/${clientId}/workout-plan`, {
        method: "POST",
        body: {
          name: `Plan ${(plans?.length ?? 0) + 1}`,
          isActive: (plans ?? []).length === 0,
        },
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workout-plans", clientId] }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t("plans")}</CardTitle>
          <Button size="sm" onClick={() => createPlan.mutate()}>
            {t("newPlan")}
          </Button>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-2">
          {(plans ?? []).length === 0 ? (
            <span className="text-text-3 text-sm">{t("noPlanYet")}</span>
          ) : (
            (plans ?? []).map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm border transition-colors",
                  p.id === planId
                    ? "border-accent text-accent bg-accent-dim"
                    : "border-border text-text-2 hover:text-text-1",
                )}
              >
                {p.name}
                {p.isActive ? ` · ${t("active")}` : ""}
              </button>
            ))
          )}
        </CardBody>
      </Card>

      {planId && <PlanBuilder planId={planId} />}
    </div>
  );
}

function PlanBuilder({ planId }: { planId: string }) {
  const t = useTranslations("admin.clientDetail.workout");
  const qc = useQueryClient();
  const { data: plan, isLoading } = useQuery({
    queryKey: ["workout-plan", planId],
    queryFn: () => apiData<WorkoutPlanFull>(`/api/workout-plans/${planId}`),
  });

  const addDay = useMutation({
    mutationFn: async () =>
      apiData<WorkoutDay>(`/api/workout-plans/${planId}/days`, {
        method: "POST",
        body: {
          name: `Day ${(plan?.days?.length ?? 0) + 1}`,
          dayOrder: (plan?.days?.length ?? 0) + 1,
        },
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workout-plan", planId] }),
  });

  const saveTemplate = useMutation({
    mutationFn: async () =>
      apiData(`/api/workout-plans/${planId}/save-as-template`, {
        method: "POST",
        body: { name: plan?.name ?? "Template", description: "" },
      }),
  });

  if (isLoading || !plan) return <Skeleton className="h-48 w-full" />;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>{plan.name}</CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveTemplate.mutate()}
            disabled={saveTemplate.isPending}
          >
            {t("saveAsTemplate")}
          </Button>
          <Button size="sm" onClick={() => addDay.mutate()}>
            {t("addDay")}
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {plan.days.length === 0 && (
          <p className="text-text-3 text-sm">{t("noDaysYet")}</p>
        )}
        {plan.days.map((d) => (
          <DayCard key={d.id} day={d} planId={planId} />
        ))}
      </CardBody>
    </Card>
  );
}

function DayCard({
  day,
  planId,
}: {
  day: WorkoutDay & { exercises: WorkoutExercise[] };
  planId: string;
}) {
  const t = useTranslations("admin.clientDetail.workout");
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const patchExercise = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<WorkoutExercise>;
    }) => api(`/api/workout-exercises/${id}`, { method: "PATCH", body }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workout-plan", planId] }),
  });

  const deleteExercise = useMutation({
    mutationFn: async (id: string) =>
      api(`/api/workout-exercises/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workout-plan", planId] }),
  });

  const deleteDay = useMutation({
    mutationFn: async () =>
      api(`/api/workout-days/${day.id}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workout-plan", planId] }),
  });

  const addExercise = useMutation({
    mutationFn: async (body: Partial<WorkoutExercise>) =>
      apiData<WorkoutExercise>(`/api/workout-days/${day.id}/exercises`, {
        method: "POST",
        body,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workout-plan", planId] }),
  });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = day.exercises.findIndex((x) => x.id === active.id);
    const newIndex = day.exercises.findIndex((x) => x.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(day.exercises, oldIndex, newIndex);
    reordered.forEach((ex, i) => {
      if (ex.sortOrder !== i + 1) {
        patchExercise.mutate({ id: ex.id, body: { sortOrder: i + 1 } });
      }
    });
  };

  return (
    <div className="rounded-md border border-border bg-bg p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          defaultValue={day.name}
          onBlur={(e) =>
            api(`/api/workout-days/${day.id}`, {
              method: "PATCH",
              body: { name: e.target.value },
            }).then(() =>
              qc.invalidateQueries({ queryKey: ["workout-plan", planId] }),
            )
          }
          className="max-w-[14rem]"
        />
        <span className="text-text-3 text-xs">
          {day.exercises.length} {t("exercisesShort")}
        </span>
        <button
          onClick={() => deleteDay.mutate()}
          className="ms-auto text-text-3 hover:text-danger text-xs"
        >
          {t("removeDay")}
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={day.exercises.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {day.exercises.map((ex) => (
              <SortableExerciseRow
                key={ex.id}
                exercise={ex}
                onPatch={(body) => patchExercise.mutate({ id: ex.id, body })}
                onDelete={() => deleteExercise.mutate(ex.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <ExerciseAdder
        onPick={(libId) =>
          addExercise.mutate({
            exerciseId: libId,
            sets: 3,
            reps: "10",
            sortOrder: day.exercises.length + 1,
          })
        }
      />
    </div>
  );
}

function SortableExerciseRow({
  exercise,
  onPatch,
  onDelete,
}: {
  exercise: WorkoutExercise;
  onPatch: (body: Partial<WorkoutExercise>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-surface rounded px-3 py-2 text-sm"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="drag"
        className="cursor-grab text-text-3 hover:text-text-1 px-1"
      >
        ⋮⋮
      </button>
      <span className="flex-1 truncate text-text-1">
        {exercise.customName ?? exercise.exerciseId ?? "—"}
      </span>
      <Input
        value={String(exercise.sets ?? "")}
        onChange={(e) => onPatch({ sets: Number(e.target.value) || undefined })}
        className="w-14 h-8 text-xs"
        placeholder="sets"
      />
      <Input
        value={exercise.reps ?? ""}
        onChange={(e) => onPatch({ reps: e.target.value })}
        className="w-16 h-8 text-xs"
        placeholder="reps"
      />
      <Input
        value={String(exercise.restSeconds ?? "")}
        onChange={(e) =>
          onPatch({ restSeconds: Number(e.target.value) || undefined })
        }
        className="w-16 h-8 text-xs"
        placeholder="rest"
      />
      <button
        onClick={onDelete}
        className="text-text-3 hover:text-danger text-xs"
      >
        ×
      </button>
    </li>
  );
}

function ExerciseAdder({ onPick }: { onPick: (libId: string) => void }) {
  const t = useTranslations("admin.clientDetail.workout");
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["exercise-library", q],
    queryFn: () =>
      api<ExerciseLibraryItem[]>(
        `/api/exercise-library?pageSize=8${q ? `&search=${encodeURIComponent(q)}` : ""}`,
      ),
    enabled: q.length > 0,
  });
  const items = (data as Envelope<ExerciseLibraryItem[]> | undefined)?.data ?? [];

  return (
    <div className="space-y-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("searchExercise")}
      />
      {q && items.length > 0 && (
        <ul className="max-h-48 overflow-auto rounded-md border border-border bg-bg divide-y divide-border">
          {items.map((it) => (
            <li key={it.id}>
              <button
                onClick={() => {
                  onPick(it.id);
                  setQ("");
                }}
                className="w-full text-start px-3 py-2 text-sm hover:bg-surface"
              >
                <span className="font-medium text-text-1">{it.name}</span>
                {it.muscleGroup && (
                  <span className="text-text-3 ms-2 text-xs">
                    {it.muscleGroup}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
