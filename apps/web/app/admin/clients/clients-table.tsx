"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate } from "@/lib/utils";
import type { Client } from "@/types/api";

type Filter = "all" | "active" | "inactive";

export function ClientsTable() {
  const t = useTranslations("admin.clients");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "50" });
    if (search) params.set("search", search);
    if (filter !== "all") params.set("active", String(filter === "active"));
    return params.toString();
  }, [search, filter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["clients", query],
    queryFn: () => api<Client[]>(`/api/clients?${query}`),
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          type="search"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2 text-sm">
          {(["all", "active", "inactive"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-md px-3 py-1.5 transition-colors " +
                (filter === f
                  ? "bg-accent-dim text-accent"
                  : "text-text-2 hover:text-text-1 hover:bg-surface")
              }
            >
              {t(
                f === "all"
                  ? "filters.all"
                  : f === "active"
                  ? "filters.activeOnly"
                  : "filters.inactiveOnly",
              )}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-danger text-sm">{(error as Error).message}</p>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <p className="text-text-3 text-sm">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-start">
            <thead>
              <tr className="text-text-3 text-xs uppercase tracking-[0.12em]">
                <th className="px-4 py-3 text-start font-medium">{t("columns.name")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("columns.goal")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("columns.weight")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("columns.active")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("columns.joined")}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/clients/${c.id}`)}
                  className="border-t border-border hover:bg-surface/60 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-text-1">{c.name}</td>
                  <td className="px-4 py-3 text-text-2 text-sm">{c.goal ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-text-2 text-sm tabular-nums">
                    {c.currentWeightKg != null ? `${c.currentWeightKg.toFixed(1)} kg` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center gap-2 text-xs " +
                        (c.isActive ? "text-success" : "text-text-3")
                      }
                    >
                      <span
                        className={
                          "h-1.5 w-1.5 rounded-full " +
                          (c.isActive ? "bg-success" : "bg-text-3")
                        }
                      />
                      {c.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-2 text-sm">{fmtDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
