"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/card";
import { CheckinCalendar } from "@/components/admin/checkin-calendar";
import { PageTransition } from "@/components/motion/page-transition";

type CheckinDay = {
  date: string;
  checkedIn: number;
  total: number;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function CalendarPage() {
  const t = useTranslations("admin.calendar");
  const [days, setDays] = useState<CheckinDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const res = await fetch(
          `${API}/api/admin/checkins/calendar?year=${year}&month=${month}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
            },
          },
        );
        if (res.ok) {
          const json = await res.json();
          setDays(json.Data ?? []);
        }
      } catch {
        /* offline */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-extrabold text-text-1">
          {t("pageTitle")}
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="skeleton h-48 rounded-md" />
              ) : (
                <CheckinCalendar days={days} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("legend")}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-success/40" />
                  <span className="text-text-2">{t("high")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-warning/40" />
                  <span className="text-text-2">{t("medium")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-danger/40" />
                  <span className="text-text-2">{t("low")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-surface-high" />
                  <span className="text-text-2">{t("noData")}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
