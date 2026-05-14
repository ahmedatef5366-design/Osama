"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type Job = "clients" | "checkins";

export function ExportsPanel() {
  const t = useTranslations("admin.exports");
  const [busy, setBusy] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(job: Job) {
    setError(null);
    setBusy(job);
    try {
      const url = `${API_BASE}/api/admin/exports/${job}.csv`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`download_failed_${res.status}`);
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `${job}-${stamp()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ExportCard
        title={t("clients")}
        hint={t("clientsHint")}
        cta={t("download")}
        busy={busy === "clients"}
        onClick={() => download("clients")}
      />
      <ExportCard
        title={t("checkins")}
        hint={t("checkinsHint")}
        cta={t("download")}
        busy={busy === "checkins"}
        onClick={() => download("checkins")}
      />
      {error && (
        <p className="text-danger text-sm md:col-span-2">{error}</p>
      )}
    </div>
  );
}

function ExportCard({
  title,
  hint,
  cta,
  busy,
  onClick,
}: {
  title: string;
  hint: string;
  cta: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <h3 className="text-text-1 font-semibold">{title}</h3>
        <p className="text-text-3 text-sm">{hint}</p>
        <Button onClick={onClick} disabled={busy} size="sm">
          {cta}
        </Button>
      </CardBody>
    </Card>
  );
}

function stamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`
  );
}
