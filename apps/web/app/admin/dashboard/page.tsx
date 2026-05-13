"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiData } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types/api";

export default function AdminDashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const t = useTranslations("admin.dashboard");
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
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-extrabold text-text-1">
        {t("title")}
      </h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((s) => (
          <Card key={s.key}>
            <CardHeader>
              <CardTitle>{t(`stats.${s.key}`)}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="font-display text-4xl font-extrabold text-text-1">
                {s.value != null ? `${s.value}${s.suffix ?? ""}` : "—"}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
