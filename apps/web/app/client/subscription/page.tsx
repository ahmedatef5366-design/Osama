"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { apiData } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Plan, Subscription } from "@/types/api";

export default function ClientSubscriptionPage() {
  const t = useTranslations("client.subscription");
  const locale = useLocale();

  const { data: sub, isLoading } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => apiData<Subscription>(`/api/subscription`),
  });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: () => apiData<Plan[]>(`/api/plans`),
  });

  const myPlan = plans?.find((p) => p.id === sub?.planId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-extrabold text-text-1">
          {t("title")}
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("currentPlan")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !sub ? (
            <p className="text-sm text-text-2">{t("noPlan")}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="text-2xl font-display font-bold text-text-1">
                    {locale === "ar" ? sub.planName.ar : sub.planName.en}
                  </div>
                  <div className="text-sm text-text-3">/{sub.planSlug}</div>
                </div>
                <span
                  className={
                    "px-3 py-1 rounded-md text-xs font-medium " +
                    statusPill(sub.status)
                  }
                >
                  {t(`status.${sub.status}`)}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {sub.expiresAt ? (
                  <Row label={t("renews")} value={fmt(sub.expiresAt)} />
                ) : null}
                {sub.trialUntil ? (
                  <Row label={t("trialUntil")} value={fmt(sub.trialUntil)} />
                ) : null}
              </div>

              {myPlan?.features && myPlan.features.length > 0 ? (
                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs uppercase tracking-[0.12em] text-text-3 mb-3">
                    {t("features")}
                  </h3>
                  <ul className="space-y-1.5">
                    {myPlan.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-text-1"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span>{locale === "ar" ? f.ar : f.en}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>
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
