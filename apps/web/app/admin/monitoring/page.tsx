"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiData } from "@/lib/api";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/card";
import { StaggerReveal, RevealItem } from "@/components/motion";
import type {
  DashboardStats,
  ComplianceTrend,
  TopClient,
  AtRiskClient,
} from "@/types/api";

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <StatsSection />
      <div className="grid gap-6 lg:grid-cols-2">
        <ComplianceTrendSection />
        <TopClientsSection />
      </div>
      <AtRiskSection />
    </div>
  );
}

function StatsSection() {
  const t = useTranslations("admin.monitoring");
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiData<DashboardStats>("/api/admin/monitoring");
        setStats(data);
      } catch {
        // noop
      }
    })();
  }, []);

  const items: Array<{
    key: "activeClients" | "avgCompliance" | "atRisk" | "todayCheckins";
    value: number | undefined;
    suffix?: string;
  }> = [
    { key: "activeClients", value: stats?.activeClients },
    { key: "avgCompliance", value: stats?.avgCompliance, suffix: "%" },
    { key: "atRisk", value: stats?.atRiskClients },
    { key: "todayCheckins", value: stats?.todayCheckins },
  ];

  return (
    <div>
      <h1 className="mb-4 font-display text-4xl font-extrabold text-text-1">
        {t("title")}
      </h1>
      <StaggerReveal className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map(({ key, value, suffix }) => (
          <RevealItem key={key}>
            <Card>
              <CardBody className="text-center">
                <p className="font-mono text-3xl font-bold text-accent">
                  {value != null ? `${value}${suffix ?? ""}` : "—"}
                </p>
                <p className="mt-1 text-xs text-text-2">{t(key)}</p>
              </CardBody>
            </Card>
          </RevealItem>
        ))}
      </StaggerReveal>
    </div>
  );
}

function ComplianceTrendSection() {
  const t = useTranslations("admin.monitoring");
  const [trend, setTrend] = useState<ComplianceTrend[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiData<ComplianceTrend[]>(
          "/api/admin/monitoring/compliance-trend",
        );
        setTrend(data);
      } catch {
        // noop
      }
    })();
  }, []);

  const max = Math.max(...trend.map((d) => d.avgCompliance), 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("complianceTrend")}</CardTitle>
      </CardHeader>
      <CardBody>
        {trend.length === 0 ? (
          <p className="text-text-2 text-sm">{t("noData")}</p>
        ) : (
          <div className="flex h-40 items-end gap-1">
            {trend.map((d) => (
              <div
                key={d.day}
                className="group relative flex-1"
                title={`${d.day}: ${d.avgCompliance}%`}
              >
                <div
                  className="rounded-t bg-accent/80 transition-colors group-hover:bg-accent"
                  style={{
                    height: `${(d.avgCompliance / max) * 100}%`,
                    minHeight: 2,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function TopClientsSection() {
  const t = useTranslations("admin.monitoring");
  const [clients, setClients] = useState<TopClient[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiData<TopClient[]>(
          "/api/admin/monitoring/top-clients",
        );
        setClients(data);
      } catch {
        // noop
      }
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("topClients")}</CardTitle>
      </CardHeader>
      <CardBody>
        {clients.length === 0 ? (
          <p className="text-text-2 text-sm">{t("noData")}</p>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md bg-surface-high px-3 py-2"
              >
                <span className="text-sm font-medium text-text-1">
                  {c.name}
                </span>
                <span className="font-mono text-sm font-bold text-accent">
                  {c.avgCompliance}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function AtRiskSection() {
  const t = useTranslations("admin.monitoring");
  const [clients, setClients] = useState<AtRiskClient[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await apiData<AtRiskClient[]>("/api/admin/at-risk");
      setClients(data);
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("atRiskClients")}</CardTitle>
      </CardHeader>
      <CardBody>
        {clients.length === 0 ? (
          <p className="text-text-2 text-sm">{t("noData")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-2">
                  <th className="px-3 py-2 text-left">{t("clientName")}</th>
                  <th className="px-3 py-2 text-right">{t("compliance")}</th>
                  <th className="px-3 py-2 text-right">{t("checkins")}</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/50 text-text-1"
                  >
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2 text-right font-mono text-danger">
                      {c.avgCompliance}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {c.checkinCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
