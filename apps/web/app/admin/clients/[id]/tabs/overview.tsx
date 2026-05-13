"use client";

import { useTranslations } from "next-intl";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDate } from "@/lib/utils";
import type { Client } from "@/types/api";

export function OverviewTab({ client }: { client: Client }) {
  const t = useTranslations("admin.clientDetail.overview");
  const tGoals = useTranslations("admin.clientDetail.goals");

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("identity")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <Row label={t("name")} value={client.name} />
          <Row label={t("sex")} value={client.sex ?? "—"} />
          <Row label={t("age")} value={client.age ?? "—"} />
          <Row
            label={t("experienceLevel")}
            value={client.experienceLevel ?? "—"}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("metrics")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <Row
            label={t("currentWeightKg")}
            value={client.currentWeightKg ? `${client.currentWeightKg} kg` : "—"}
          />
          <Row
            label={t("heightCm")}
            value={client.heightCm ? `${client.heightCm} cm` : "—"}
          />
          <Row
            label={t("goal")}
            value={client.goal ? tGoals(client.goal) : "—"}
          />
          <Row
            label={t("activityLevel")}
            value={client.activityLevel ?? "—"}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dates")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <Row label={t("startDate")} value={fmtDate(client.startDate)} />
          <Row label={t("targetDate")} value={fmtDate(client.targetDate)} />
          <Row label={t("createdAt")} value={fmtDate(client.createdAt)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notes")}</CardTitle>
        </CardHeader>
        <CardBody className="text-sm whitespace-pre-line text-text-2">
          {client.healthNotes || t("noNotes")}
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-3">{label}</span>
      <span className="text-text-1 font-medium">{value}</span>
    </div>
  );
}
