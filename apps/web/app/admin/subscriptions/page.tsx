"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { apiData } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubscriptionWithClient } from "@/types/api";

export default function AdminSubscriptionsPage() {
  const t = useTranslations("admin.subscriptions");
  const tStatus = useTranslations("admin.clientDetail.subscription.statuses");
  const locale = useLocale();

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () =>
      apiData<SubscriptionWithClient[]>(`/api/admin/subscriptions`),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-extrabold text-text-1">
          {t("title")}
        </h1>
        <p className="text-text-2 mt-1">{t("subtitle")}</p>
      </header>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !data || data.length === 0 ? (
            <p className="p-6 text-sm text-text-2">{t("empty")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-3 uppercase tracking-[0.12em] text-[11px]">
                  <th className="text-start font-medium py-3 px-4">
                    {t("th.client")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {t("th.plan")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {t("th.status")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {t("th.renews")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {t("th.trial")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-high">
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/clients/${s.clientId}`}
                        className="text-text-1 font-medium hover:text-accent"
                      >
                        {s.clientName}
                      </Link>
                      <div className="text-xs text-text-3">{s.clientEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-text-1">
                      {locale === "ar" ? s.planName.ar : s.planName.en}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={
                          "px-2 py-0.5 rounded-md text-xs font-medium " +
                          statusPill(s.status)
                        }
                      >
                        {tStatus(s.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-2">
                      {fmt(s.expiresAt)}
                    </td>
                    <td className="py-3 px-4 text-text-2">
                      {fmt(s.trialUntil)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function fmt(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function statusPill(s: string) {
  switch (s) {
    case "active":
      return "bg-success/15 text-success";
    case "trial":
      return "bg-info/15 text-info";
    case "expired":
      return "bg-warning/15 text-warning";
    case "canceled":
      return "bg-danger/15 text-danger";
    default:
      return "bg-surface-edge text-text-2";
  }
}
