"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { apiData } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Client,
  Plan,
  Subscription,
  SubscriptionHistoryEntry,
} from "@/types/api";

type Props = { client: Client };

export function SubscriptionTab({ client }: Props) {
  const t = useTranslations("admin.clientDetail.subscription");
  const locale = useLocale();
  const qc = useQueryClient();

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: () => apiData<Plan[]>(`/api/plans`),
  });

  const { data: sub, isLoading } = useQuery({
    queryKey: ["subscription", client.id],
    queryFn: () =>
      apiData<Subscription>(
        `/api/admin/subscriptions/${client.id}/history`,
      ).then(async () => {
        // We don't have a direct admin GET-by-client, so we hit /history
        // first to know the row exists, then pull the latest via list.
        const list = await apiData<(Subscription & { clientName?: string })[]>(
          `/api/admin/subscriptions`,
        );
        return list.find((s) => s.clientId === client.id) as Subscription;
      }),
  });

  const { data: history } = useQuery({
    queryKey: ["subscription-history", client.id],
    queryFn: () =>
      apiData<SubscriptionHistoryEntry[]>(
        `/api/admin/subscriptions/${client.id}/history`,
      ),
  });

  const upsert = useMutation({
    mutationFn: async (body: {
      planSlug?: string;
      status?: string;
      expiresAt?: string | null;
      trialUntil?: string | null;
      notes?: string;
    }) =>
      apiData<Subscription>(`/api/admin/subscriptions`, {
        method: "POST",
        body: { clientId: client.id, ...body },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription", client.id] });
      qc.invalidateQueries({ queryKey: ["subscription-history", client.id] });
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const cancel = useMutation({
    mutationFn: async (reason: string) =>
      apiData<Subscription>(
        `/api/admin/subscriptions/${client.id}/cancel`,
        { method: "POST", body: { reason } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription", client.id] });
      qc.invalidateQueries({ queryKey: ["subscription-history", client.id] });
    },
  });

  const [renewMonths, setRenewMonths] = useState(1);
  const [reason, setReason] = useState("");

  const today = new Date();
  const renewAt = new Date(today);
  renewAt.setMonth(renewAt.getMonth() + renewMonths);

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const lang = (k: string) => t(`statuses.${k}`);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {sub ? (
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Row
                label={t("currentPlan")}
                value={locale === "ar" ? sub.planName.ar : sub.planName.en}
              />
              <Row
                label={t("status")}
                value={
                  <span
                    className={
                      "px-2 py-0.5 rounded-md text-xs font-medium " +
                      statusPill(sub.status)
                    }
                  >
                    {lang(sub.status)}
                  </span>
                }
              />
              <Row label={t("expiresAt")} value={fmt(sub.expiresAt)} />
              <Row label={t("trialUntil")} value={fmt(sub.trialUntil)} />
              {sub.notes ? <Row label={t("notes")} value={sub.notes} /> : null}
            </div>
          ) : (
            <p className="text-sm text-text-2">{t("noPlan")}</p>
          )}

          <div className="border-t border-border pt-4 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.12em] text-text-3 mb-2">
                {sub ? t("changePlan") : t("assignPlan")}
              </label>
              <div className="grid gap-2">
                {plans?.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const expiresAt = new Date(today);
                      expiresAt.setMonth(expiresAt.getMonth() + renewMonths);
                      upsert.mutate({
                        planSlug: p.slug,
                        status: "active",
                        expiresAt: expiresAt.toISOString(),
                      });
                    }}
                    className="text-start rounded-md border border-border bg-surface-high px-3 py-2 hover:border-accent/40"
                  >
                    <div className="font-medium text-text-1 text-sm">
                      {locale === "ar" ? p.name.ar : p.name.en}
                    </div>
                    <div className="text-xs text-text-3">
                      {p.monthlyPriceEgp} EGP
                      {" · "}
                      {p.maxClients > 0
                        ? `${p.maxClients} clients`
                        : "unlimited"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-[0.12em] text-text-3 mb-2">
                {t("renewMonths")}
              </label>
              <input
                type="number"
                min={1}
                max={36}
                value={renewMonths}
                onChange={(e) => setRenewMonths(parseInt(e.target.value || "1", 10))}
                className="w-full rounded-md border border-border bg-surface-high px-3 py-2 text-sm text-text-1"
              />

              {sub && sub.status !== "canceled" ? (
                <div className="pt-4 border-t border-border space-y-2">
                  <label className="block text-xs uppercase tracking-[0.12em] text-text-3">
                    {t("reason")}
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface-high px-3 py-2 text-sm text-text-1"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => cancel.mutate(reason)}
                    disabled={cancel.isPending}
                    className="text-danger hover:text-danger"
                  >
                    {t("cancel")}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      {history && history.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("history")}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0"
              >
                <div>
                  <span className="text-text-1 font-medium">{h.planSlug}</span>
                  <span className="ml-2 text-xs text-text-3 uppercase tracking-[0.12em]">
                    {h.status}
                  </span>
                </div>
                <div className="text-xs text-text-3">{fmt(h.changedAt)}</div>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.12em] text-text-3">
        {label}
      </div>
      <div className="text-text-1 mt-0.5">{value}</div>
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
