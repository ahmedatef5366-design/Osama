"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type ReportData = {
  clientName: string;
  period: string;
  avgCompliance: number;
  weightChange: number;
  workoutsCompleted: number;
  checkinsCompleted: number;
};

type PDFReportButtonProps = {
  data: ReportData;
};

export function PDFReportButton({ data }: PDFReportButtonProps) {
  const t = useTranslations("admin.report");

  const generateReport = useCallback(() => {
    const doc = `
<!DOCTYPE html>
<html>
<head>
  <title>${t("title")} - ${data.clientName}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a202c; }
    h1 { color: #080B0F; border-bottom: 3px solid #C8F135; padding-bottom: 12px; }
    .meta { color: #6B7A8D; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .stat { background: #F5F7FA; border-radius: 12px; padding: 20px; }
    .stat-value { font-size: 2rem; font-weight: 800; color: #080B0F; }
    .stat-label { font-size: 0.875rem; color: #6B7A8D; margin-top: 4px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${t("title")}</h1>
  <p class="meta">${data.clientName} &bull; ${data.period}</p>
  <div class="grid">
    <div class="stat">
      <div class="stat-value">${data.avgCompliance}%</div>
      <div class="stat-label">${t("compliance")}</div>
    </div>
    <div class="stat">
      <div class="stat-value">${data.weightChange > 0 ? "+" : ""}${data.weightChange}kg</div>
      <div class="stat-label">${t("weightChange")}</div>
    </div>
    <div class="stat">
      <div class="stat-value">${data.workoutsCompleted}</div>
      <div class="stat-label">${t("workouts")}</div>
    </div>
    <div class="stat">
      <div class="stat-value">${data.checkinsCompleted}</div>
      <div class="stat-label">${t("checkins")}</div>
    </div>
  </div>
  <p style="margin-top:32px;font-size:0.75rem;color:#A0AEC0;">
    ${t("generatedBy")}
  </p>
</body>
</html>`;

    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.addEventListener("load", () => {
        win.print();
      });
    }
  }, [data, t]);

  return (
    <Button variant="ghost" size="sm" onClick={generateReport}>
      {t("export")}
    </Button>
  );
}
