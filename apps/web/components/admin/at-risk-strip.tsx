"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { apiData } from "@/lib/api";
import type { AtRiskClient } from "@/types/api";

/**
 * "Needs your attention" strip on the admin dashboard. Reads
 * /api/admin/at-risk (clients with avg compliance < 60 over the last
 * 7 days) and shows up to 6 rows with quick "open profile" and
 * "message" actions. Hidden entirely on a clean board so the dashboard
 * doesn't sprout an empty card.
 */
export function AtRiskStrip() {
  const t = useTranslations("admin.dashboard.atRiskStrip");
  const [data, setData] = useState<AtRiskClient[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiData<AtRiskClient[]>("/api/admin/at-risk");
        if (alive) setData(res);
      } catch {
        if (alive) setData([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-surface-high" />;
  }

  if (!data || data.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface px-6 py-5">
        <h3 className="font-display text-lg font-semibold text-text-1">
          {t("title")}
        </h3>
        <p className="mt-2 text-sm text-success">{t("empty")}</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-warning/30 bg-warning-dim">
      <header className="flex items-start justify-between gap-3 border-b border-warning/20 px-6 py-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-text-1">
            {t("title")}
          </h3>
          <p className="mt-1 text-sm text-text-2">{t("subtitle")}</p>
        </div>
        <span className="rounded-full border border-warning/30 bg-bg/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.28em] text-warning">
          {data.length}
        </span>
      </header>
      <ul className="divide-y divide-warning/15">
        {data.slice(0, 6).map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text-1">{c.name}</p>
              <p className="mt-0.5 font-mono text-[11px] tabular-nums text-text-3">
                <span className="text-warning">{c.avgCompliance}%</span>{" "}
                {t("compliance")} · {c.checkinCount} {t("checks")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/clients/${c.id}`}
                className="rounded-md border border-border bg-bg px-3 py-1.5 text-xs font-medium text-text-1 transition-colors hover:border-border-hover"
              >
                {t("open")}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
