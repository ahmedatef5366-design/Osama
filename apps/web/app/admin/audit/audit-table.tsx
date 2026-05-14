"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Envelope } from "@/types/api";

type AuditEntry = {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
};

const PAGE_SIZE = 50;

export function AuditTable() {
  const t = useTranslations("admin.audit");
  const tCols = useTranslations("admin.audit.columns");
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit", page, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (actionFilter) params.set("action", actionFilter);
      return api<AuditEntry[]>(`/api/admin/audit-log?${params}`);
    },
  });

  const entries = (data as Envelope<AuditEntry[]> | undefined)?.data ?? [];
  const total = (data as Envelope<AuditEntry[]> | undefined)?.meta?.total ?? 0;
  const hasMore = page * PAGE_SIZE < total;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          placeholder={t("filterAction")}
          className="max-w-xs"
        />
      </div>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-60 w-full" />
            </div>
          ) : entries.length === 0 ? (
            <p className="p-6 text-sm text-text-2">{t("empty")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-3 uppercase tracking-[0.12em] text-[11px]">
                  <th className="text-start font-medium py-3 px-4">
                    {tCols("when")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {tCols("actor")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {tCols("action")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {tCols("status")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {tCols("ip")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((e) => {
                  const meta = (e.metadata ?? {}) as Record<string, unknown>;
                  const status =
                    typeof meta.status === "number" ? (meta.status as number) : null;
                  return (
                    <tr key={e.id} className="hover:bg-surface-high">
                      <td className="py-3 px-4 text-text-2 text-xs tabular-nums">
                        {fmt(e.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-text-2 text-xs">
                        {e.userEmail || "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-text-1">
                        {e.action}
                      </td>
                      <td className="py-3 px-4">
                        {status !== null && (
                          <span
                            className={
                              "rounded-md px-2 py-0.5 text-xs font-medium " +
                              statusPill(status)
                            }
                          >
                            {status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-3 font-mono text-xs">
                        {e.ipAddress || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-text-3 text-xs">{t("page", { page })}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("prev")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("next")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusPill(s: number) {
  if (s >= 200 && s < 300) return "bg-success/15 text-success";
  if (s >= 300 && s < 400) return "bg-info/15 text-info";
  if (s >= 400 && s < 500) return "bg-warning/15 text-warning";
  return "bg-danger/15 text-danger";
}
