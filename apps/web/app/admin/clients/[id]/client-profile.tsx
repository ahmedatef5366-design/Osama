"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { apiData } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Client } from "@/types/api";
import { OverviewTab } from "./tabs/overview";
import { WorkoutTab } from "./tabs/workout";
import { NutritionTab } from "./tabs/nutrition";
import { ProgressTab } from "./tabs/progress";
import { ContactTab } from "./tabs/contact";
import { SubscriptionTab } from "./tabs/subscription";

type TabKey =
  | "overview"
  | "workout"
  | "nutrition"
  | "progress"
  | "contact"
  | "subscription";

const tabs: Array<{ key: TabKey }> = [
  { key: "overview" },
  { key: "workout" },
  { key: "nutrition" },
  { key: "progress" },
  { key: "contact" },
  { key: "subscription" },
];

export function ClientProfile({ clientId }: { clientId: string }) {
  const t = useTranslations("admin.clientDetail");
  const [tab, setTab] = useState<TabKey>("overview");

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => apiData<Client>(`/api/clients/${clientId}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-text-2">
        <Link href="/admin/clients" className="hover:text-text-1">
          {t("backToList")}
        </Link>
        <span aria-hidden>/</span>
        <span>{client?.name ?? "…"}</span>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : client ? (
        <ClientHeader client={client} />
      ) : null}

      <nav className="flex gap-2 border-b border-border" role="tablist">
        {tabs.map(({ key }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors",
              tab === key
                ? "border-accent text-text-1"
                : "border-transparent text-text-2 hover:text-text-1",
            )}
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </nav>

      <div role="tabpanel">
        {tab === "overview" && client && <OverviewTab client={client} />}
        {tab === "workout" && <WorkoutTab clientId={clientId} />}
        {tab === "nutrition" && <NutritionTab clientId={clientId} />}
        {tab === "progress" && <ProgressTab clientId={clientId} />}
        {tab === "contact" && client && <ContactTab client={client} />}
        {tab === "subscription" && client && <SubscriptionTab client={client} />}
      </div>
    </div>
  );
}

function ClientHeader({ client }: { client: Client }) {
  const t = useTranslations("admin.clientDetail");
  return (
    <Card>
      <CardBody className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-extrabold text-text-1">
            {client.name}
          </h1>
          <p className="text-sm text-text-2">
            {client.goal ? t(`goals.${client.goal}`) : "—"} ·{" "}
            {client.isActive ? t("active") : t("inactive")}
          </p>
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm">
          <Stat label={t("stats.weight")} value={client.currentWeightKg ? `${client.currentWeightKg} kg` : "—"} />
          <Stat label={t("stats.height")} value={client.heightCm ? `${client.heightCm} cm` : "—"} />
          <Stat label={t("stats.age")} value={client.age ?? "—"} />
          <Stat label={t("stats.startDate")} value={fmtDate(client.startDate)} />
        </dl>
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-text-3 uppercase tracking-[0.12em] text-xs">{label}</dt>
      <dd className="text-text-1 font-medium">{value}</dd>
    </div>
  );
}
