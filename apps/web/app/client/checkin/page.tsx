"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api, apiData } from "@/lib/api";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/card";
import type { DailyCheckin } from "@/types/api";

export default function CheckinPage() {
  const t = useTranslations("client.checkin");
  const [tab, setTab] = useState<"form" | "history">("form");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold text-text-1">
        {t("title")}
      </h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("form")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "form"
              ? "bg-accent text-bg"
              : "bg-surface-high text-text-2 hover:text-text-1"
          }`}
        >
          {t("title")}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "history"
              ? "bg-accent text-bg"
              : "bg-surface-high text-text-2 hover:text-text-1"
          }`}
        >
          {t("history")}
        </button>
      </div>

      {tab === "form" ? <CheckinForm /> : <CheckinHistory />}
    </div>
  );
}

function CheckinForm() {
  const t = useTranslations("client.checkin");
  const [workoutStatus, setWorkoutStatus] = useState("completed");
  const [dietCompliance, setDietCompliance] = useState(80);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [sleepHours, setSleepHours] = useState("7");
  const [waterCups, setWaterCups] = useState("8");
  const [cardioDone, setCardioDone] = useState(false);
  const [cardioMinutes, setCardioMinutes] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api("/api/checkin", {
        method: "POST",
        body: {
          checkinDate: new Date().toISOString().split("T")[0],
          workoutStatus,
          dietCompliance,
          sleepQuality,
          sleepHours: parseFloat(sleepHours) || undefined,
          waterIntakeCups: parseInt(waterCups) || undefined,
          cardioDone,
          cardioMinutes: cardioDone
            ? parseInt(cardioMinutes) || undefined
            : undefined,
          clientNote: notes || undefined,
        },
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-text-2">
            {t("workoutStatus")}
          </label>
          <div className="flex gap-2">
            {(["completed", "partial", "skipped"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setWorkoutStatus(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  workoutStatus === s
                    ? "bg-accent text-bg"
                    : "bg-surface-high text-text-2"
                }`}
              >
                {t(s)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-2">
            {t("dietCompliance")}: {dietCompliance}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={dietCompliance}
            onChange={(e) => setDietCompliance(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-2">
            {t("sleepQuality")}: {sleepQuality}/10
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={sleepQuality}
            onChange={(e) => setSleepQuality(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-text-2">
              {t("sleepHours")}
            </label>
            <input
              type="number"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-1"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-2">
              {t("waterCups")}
            </label>
            <input
              type="number"
              value={waterCups}
              onChange={(e) => setWaterCups(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-1"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-text-2">
            <input
              type="checkbox"
              checked={cardioDone}
              onChange={(e) => setCardioDone(e.target.checked)}
              className="accent-accent"
            />
            {t("cardio")}
          </label>
          {cardioDone && (
            <input
              type="number"
              value={cardioMinutes}
              onChange={(e) => setCardioMinutes(e.target.value)}
              placeholder={t("cardioMinutes")}
              className="mt-2 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-1"
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-2">{t("notes")}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-1"
            rows={2}
          />
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-bg transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? t("submitting") : saved ? t("submitted") : t("submit")}
        </button>
      </CardBody>
    </Card>
  );
}

function CheckinHistory() {
  const t = useTranslations("client.checkin");
  const [items, setItems] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiData<DailyCheckin[]>("/api/checkin/history");
      setItems(data);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("history")}</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded bg-surface-high" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-text-2 text-sm">No check-ins yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-md bg-surface-high p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-1">
                    {item.checkinDate}
                  </span>
                  <span className="text-xs text-text-3">
                    {item.workoutStatus}
                  </span>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-text-2">
                  {item.dietCompliance != null && (
                    <span>
                      {t("dietCompliance")}: {item.dietCompliance}%
                    </span>
                  )}
                  {item.sleepHours != null && (
                    <span>
                      {t("sleepHours")}: {item.sleepHours}h
                    </span>
                  )}
                  {item.waterIntakeCups != null && (
                    <span>
                      {t("waterCups")}: {item.waterIntakeCups}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
