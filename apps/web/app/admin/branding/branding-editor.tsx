"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiData, APIError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Branding = {
  coachName: string;
  taglineAr: string;
  taglineEn: string;
  logoUrl: string;
  accentColor: string;
  whatsappNumber: string;
  supportEmail: string;
  instagramUrl: string;
  updatedAt: string;
};

const emptyForm: Branding = {
  coachName: "",
  taglineAr: "",
  taglineEn: "",
  logoUrl: "",
  accentColor: "#22d3ee",
  whatsappNumber: "",
  supportEmail: "",
  instagramUrl: "",
  updatedAt: "",
};

export function BrandingEditor() {
  const t = useTranslations("admin.branding");
  const qc = useQueryClient();
  const [form, setForm] = useState<Branding>(emptyForm);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["branding"],
    queryFn: () => apiData<Branding>("/api/branding"),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (payload: Partial<Branding>) =>
      api<Branding>("/api/admin/branding", { method: "PUT", body: payload }),
    onSuccess: () => {
      setSaved(true);
      setError(null);
      qc.invalidateQueries({ queryKey: ["branding"] });
      setTimeout(() => setSaved(false), 2400);
    },
    onError: (e) => setError(e instanceof APIError ? e.message : String(e)),
  });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-md" />;

  function set<K extends keyof Branding>(k: K, v: Branding[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit() {
    setError(null);
    mutation.mutate({
      coachName: form.coachName,
      taglineAr: form.taglineAr,
      taglineEn: form.taglineEn,
      logoUrl: form.logoUrl,
      accentColor: form.accentColor,
      whatsappNumber: form.whatsappNumber,
      supportEmail: form.supportEmail,
      instagramUrl: form.instagramUrl,
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <Card>
        <CardBody className="space-y-4">
          <Field label={t("coachName")}>
            <Input
              value={form.coachName}
              onChange={(e) => set("coachName", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("taglineEn")}>
              <Input
                value={form.taglineEn}
                onChange={(e) => set("taglineEn", e.target.value)}
              />
            </Field>
            <Field label={t("taglineAr")}>
              <Input
                value={form.taglineAr}
                onChange={(e) => set("taglineAr", e.target.value)}
              />
            </Field>
          </div>
          <Field label={t("logoUrl")}>
            <Input
              type="url"
              placeholder="https://…"
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("accentColor")}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="h-9 w-12 rounded-md border border-border bg-transparent"
                />
                <Input
                  value={form.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="font-mono"
                />
              </div>
            </Field>
            <Field label={t("whatsapp")}>
              <Input
                inputMode="tel"
                placeholder="+201234567890"
                value={form.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("supportEmail")}>
              <Input
                type="email"
                value={form.supportEmail}
                onChange={(e) => set("supportEmail", e.target.value)}
              />
            </Field>
            <Field label={t("instagram")}>
              <Input
                type="url"
                placeholder="https://instagram.com/…"
                value={form.instagramUrl}
                onChange={(e) => set("instagramUrl", e.target.value)}
              />
            </Field>
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={submit} disabled={mutation.isPending}>
              {t("save")}
            </Button>
            {saved && <span className="text-success text-sm">{t("saved")}</span>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h3 className="text-text-2 text-xs uppercase tracking-[0.16em]">
            {t("preview")}
          </h3>
          <div
            className="rounded-lg border border-border p-5"
            style={{
              boxShadow: `inset 0 0 0 2px ${form.accentColor}22`,
            }}
          >
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logoUrl}
                  alt=""
                  className="h-10 w-10 rounded-md object-cover bg-surface-high"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-md"
                  style={{ background: form.accentColor }}
                />
              )}
              <div>
                <div className="text-text-1 font-semibold">{form.coachName || "Coach"}</div>
                <div className="text-text-3 text-xs">{form.taglineEn || form.taglineAr}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-2">
              {form.whatsappNumber && (
                <span className="rounded-full bg-surface-high px-2 py-0.5">
                  wa: {form.whatsappNumber}
                </span>
              )}
              {form.supportEmail && (
                <span className="rounded-full bg-surface-high px-2 py-0.5">
                  {form.supportEmail}
                </span>
              )}
              {form.instagramUrl && (
                <span className="rounded-full bg-surface-high px-2 py-0.5">
                  ig
                </span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-text-2 text-xs uppercase tracking-[0.12em]">
        {label}
      </span>
      {children}
    </label>
  );
}
