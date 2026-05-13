"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api, apiData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Envelope, ExerciseLibraryItem } from "@/types/api";

export function ExerciseLibraryPanel() {
  const t = useTranslations("admin.plans");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    muscleGroup: "",
    equipment: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["exercise-library", search],
    queryFn: () =>
      api<ExerciseLibraryItem[]>(
        `/api/exercise-library?pageSize=30${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      ),
  });
  const items =
    (data as Envelope<ExerciseLibraryItem[]> | undefined)?.data ?? [];

  const create = useMutation({
    mutationFn: async () =>
      apiData<ExerciseLibraryItem>(`/api/exercise-library`, {
        method: "POST",
        body: {
          name: form.name,
          nameAr: form.nameAr || undefined,
          muscleGroup: form.muscleGroup || undefined,
          equipment: form.equipment || undefined,
        },
      }),
    onSuccess: () => {
      setForm({ name: "", nameAr: "", muscleGroup: "", equipment: "" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["exercise-library"] });
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) =>
      api(`/api/exercise-library/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["exercise-library"] }),
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
        <CardTitle>{t("exerciseLibrary")}</CardTitle>
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? t("cancel") : t("newExercise")}
        </Button>
      </CardHeader>
      <CardBody className="space-y-3">
        <Input
          type="search"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        {open && (
          <div className="border border-border rounded-md p-3 bg-surface space-y-2">
            <div className="grid md:grid-cols-2 gap-2">
              <Input
                placeholder="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="nameAr"
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              />
              <Input
                placeholder="muscleGroup"
                value={form.muscleGroup}
                onChange={(e) =>
                  setForm({ ...form, muscleGroup: e.target.value })
                }
              />
              <Input
                placeholder="equipment"
                value={form.equipment}
                onChange={(e) => setForm({ ...form, equipment: e.target.value })}
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => create.mutate()} disabled={!form.name}>
                {t("save")}
              </Button>
            </div>
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : items.length === 0 ? (
          <p className="text-text-3 text-sm py-6 text-center">{t("noResults")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 py-2 text-sm"
              >
                <span className="font-medium text-text-1">{it.name}</span>
                {it.nameAr && (
                  <span className="text-text-3 text-xs">{it.nameAr}</span>
                )}
                {it.muscleGroup && (
                  <span className="text-text-3 text-xs">· {it.muscleGroup}</span>
                )}
                {it.equipment && (
                  <span className="text-text-3 text-xs">· {it.equipment}</span>
                )}
                <button
                  onClick={() => del.mutate(it.id)}
                  className="ms-auto text-text-3 hover:text-danger text-xs"
                >
                  {t("delete")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
