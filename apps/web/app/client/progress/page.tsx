"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api, apiData } from "@/lib/api";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/card";
import { WeightTrend } from "@/components/client/weight-trend";
import type { WeightEntry, Measurement } from "@/types/api";

type Tab = "weight" | "measurements";

export default function ProgressPage() {
  const t = useTranslations("client.progress");
  const [tab, setTab] = useState<Tab>("weight");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold text-text-1">
        {t("title")}
      </h1>

      <div className="flex gap-2">
        {(["weight", "measurements"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === k
                ? "bg-accent text-bg"
                : "bg-surface-high text-text-2 hover:text-text-1"
            }`}
          >
            {t(k)}
          </button>
        ))}
      </div>

      {tab === "weight" ? <WeightTab /> : <MeasurementsTab />}
    </div>
  );
}

function WeightTab() {
  const t = useTranslations("client.progress");
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiData<WeightEntry[]>("/api/weight");
      setEntries(data);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;
    setSaving(true);
    try {
      await api("/api/weight", {
        method: "POST",
        body: { weightKg: w, notes: notes || undefined },
      });
      setShowForm(false);
      setWeight("");
      setNotes("");
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{t("weight")}</CardTitle>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-colors hover:bg-accent/90"
        >
          {t("logWeight")}
        </button>
      </CardHeader>
      <CardBody>
        {showForm && (
          <div className="mb-4 space-y-3 rounded-lg bg-surface-high p-4">
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={t("weightKg")}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-1"
            />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notes")}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-1"
            />
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
              >
                {t("save")}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-sm text-text-2"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-surface-high" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-text-2 text-sm">{t("empty")}</p>
        ) : (
          <div className="space-y-4">
            <WeightTrend entries={entries} />
            <div className="space-y-2">
              {entries.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md bg-surface-high px-3 py-2"
                >
                  <div>
                    <span className="font-mono text-lg font-bold text-accent">
                      {e.weightKg}
                    </span>
                    <span className="ml-1 text-xs text-text-2">kg</span>
                    {e.notes && (
                      <p className="mt-0.5 text-xs text-text-3">{e.notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-text-3">
                    {new Date(e.loggedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function MeasurementsTab() {
  const t = useTranslations("client.progress");
  const [entries, setEntries] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiData<Measurement[]>("/api/measurements");
        setEntries(data);
      } catch {
        // noop
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fields = [
    "waist",
    "chest",
    "shoulders",
    "hips",
    "leftArm",
    "rightArm",
    "leftThigh",
    "rightThigh",
    "bodyFat",
  ] as const;

  const fieldMap: Record<
    (typeof fields)[number],
    keyof Measurement
  > = {
    waist: "waistCm",
    chest: "chestCm",
    shoulders: "shouldersCm",
    hips: "hipsCm",
    leftArm: "leftArmCm",
    rightArm: "rightArmCm",
    leftThigh: "leftThighCm",
    rightThigh: "rightThighCm",
    bodyFat: "bodyFatPercent",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("measurements")}</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-surface-high" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-text-2 text-sm">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-2">
                  <th className="px-2 py-1 text-left">Date</th>
                  {fields.map((f) => (
                    <th key={f} className="px-2 py-1 text-right">
                      {t(f)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-2 py-1.5 text-text-1">
                      {new Date(e.measuredAt).toLocaleDateString()}
                    </td>
                    {fields.map((f) => {
                      const val = e[fieldMap[f]];
                      return (
                        <td
                          key={f}
                          className="px-2 py-1.5 text-right font-mono text-text-1"
                        >
                          {val != null ? String(val) : "—"}
                        </td>
                      );
                    })}
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
