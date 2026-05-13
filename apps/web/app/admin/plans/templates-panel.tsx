"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api, apiData } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate } from "@/lib/utils";
import type { Envelope, WorkoutTemplate } from "@/types/api";

export function TemplatesPanel() {
  const t = useTranslations("admin.plans");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["workout-templates"],
    queryFn: () => api<WorkoutTemplate[]>(`/api/workout-templates`),
  });
  const items =
    (data as Envelope<WorkoutTemplate[]> | undefined)?.data ?? [];

  const del = useMutation({
    mutationFn: async (id: string) =>
      apiData(`/api/workout-templates/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workout-templates"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("templates")}</CardTitle>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : items.length === 0 ? (
          <p className="text-text-3 text-sm py-6 text-center">
            {t("noTemplates")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 py-2 text-sm"
              >
                <span className="font-medium text-text-1">{it.name}</span>
                <span className="text-text-3 text-xs">
                  · {fmtDate(it.createdAt)}
                </span>
                {it.description && (
                  <span className="text-text-3 text-xs">
                    · {it.description}
                  </span>
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
