"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { apiData, api } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Client,
  ClientContact,
  MessageTemplate,
} from "@/types/api";

type Props = { client: Client };

// Coach-facing contact panel. Stores phone / WhatsApp / Instagram on the
// client row and surfaces deep-link buttons that pre-fill a chosen
// template. Nothing is sent through the platform — we only generate the
// wa.me URL and let the coach review-then-send.
export function ContactTab({ client }: Props) {
  const t = useTranslations("admin.clientDetail.contact");
  const locale = useLocale();
  const qc = useQueryClient();

  const { data: contact, isLoading } = useQuery({
    queryKey: ["client-contact", client.id],
    queryFn: () => apiData<ClientContact>(`/api/clients/${client.id}/contact`),
  });

  const { data: templates } = useQuery({
    queryKey: ["templates", "active"],
    queryFn: () => apiData<MessageTemplate[]>(`/api/templates?active=1`),
  });

  const [form, setForm] = useState<ClientContact>({
    phone: "",
    whatsapp: "",
    instagram: "",
  });
  useEffect(() => {
    if (contact) {
      setForm({
        phone: contact.phone ?? "",
        whatsapp: contact.whatsapp ?? "",
        instagram: contact.instagram ?? "",
      });
    }
  }, [contact]);

  const save = useMutation({
    mutationFn: async (next: ClientContact) =>
      apiData<ClientContact>(`/api/clients/${client.id}/contact`, {
        method: "PATCH",
        body: next,
      }),
    onSuccess: (next) => {
      qc.setQueryData(["client-contact", client.id], next);
    },
  });

  const waNumber = useMemo(() => {
    const raw = form.whatsapp ?? "";
    // wa.me wants digits only (E.164 without the +). We strip everything
    // else for the link, but keep the human-readable value in storage.
    return raw.replace(/[^\d]/g, "");
  }, [form.whatsapp]);

  const igHandle = (form.instagram ?? "").replace(/^@/, "");

  const buildWhatsAppURL = (template?: MessageTemplate) => {
    if (!waNumber) return null;
    const body = template
      ? interpolate(locale === "ar" ? template.bodyAr : template.bodyEn, client)
      : "";
    const text = body ? `?text=${encodeURIComponent(body)}` : "";
    return `https://wa.me/${waNumber}${text}`;
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-text-2">{t("subtitle")}</p>

          <Field
            label={t("phone")}
            hint={t("phoneHint")}
            value={form.phone ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="+201001234567"
            inputMode="tel"
            autoComplete="tel"
          />
          <Field
            label={t("whatsapp")}
            hint={t("whatsappHint")}
            value={form.whatsapp ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, whatsapp: v }))}
            placeholder="201001234567"
            inputMode="tel"
            autoComplete="off"
          />
          <Field
            label={t("instagram")}
            hint={t("instagramHint")}
            value={form.instagram ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, instagram: v }))}
            placeholder="osama_coach"
            autoComplete="off"
          />

          <div className="flex items-center justify-end gap-3">
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
              {t("save")}
            </Button>
            {save.isSuccess ? (
              <span className="text-xs text-success">{t("savedToast")}</span>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("templates")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {templates && templates.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {templates.map((tpl) => {
                const url = buildWhatsAppURL(tpl);
                return (
                  <a
                    key={tpl.id}
                    href={url ?? "#"}
                    target={url ? "_blank" : undefined}
                    rel={url ? "noopener noreferrer" : undefined}
                    aria-disabled={!url}
                    className={
                      "block rounded-lg border p-4 transition-colors " +
                      (url
                        ? "border-border bg-surface-high hover:border-accent/40 hover:bg-surface-edge cursor-pointer"
                        : "border-border bg-surface-low opacity-50 cursor-not-allowed")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-text-1 text-sm">
                        {locale === "ar" ? tpl.labelAr : tpl.labelEn}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-text-3">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-text-2 line-clamp-2">
                      {locale === "ar" ? tpl.bodyAr : tpl.bodyEn}
                    </p>
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-2">{t("templatesEmpty")}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <a
              href={buildWhatsAppURL() ?? "#"}
              target={waNumber ? "_blank" : undefined}
              rel={waNumber ? "noopener noreferrer" : undefined}
              aria-disabled={!waNumber}
              className={
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium " +
                (waNumber
                  ? "bg-success/15 text-success hover:bg-success/25"
                  : "bg-surface-edge text-text-3 cursor-not-allowed")
              }
              title={waNumber ? "" : t("noWhatsapp")}
            >
              <WhatsAppGlyph />
              {t("openWhatsApp")}
            </a>
            <a
              href={igHandle ? `https://instagram.com/${igHandle}` : "#"}
              target={igHandle ? "_blank" : undefined}
              rel={igHandle ? "noopener noreferrer" : undefined}
              aria-disabled={!igHandle}
              className={
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium " +
                (igHandle
                  ? "bg-info/15 text-info hover:bg-info/25"
                  : "bg-surface-edge text-text-3 cursor-not-allowed")
              }
            >
              <InstagramGlyph />
              {t("openInstagram")}
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  inputMode,
  autoComplete,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs uppercase tracking-[0.12em] text-text-3">
        {label}
      </span>
      <input
        type="text"
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-surface-high px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      {hint ? <span className="block text-[11px] text-text-3">{hint}</span> : null}
    </label>
  );
}

function interpolate(body: string, client: Client): string {
  return body
    .replace(/\{name\}/g, client.name ?? "")
    .replace(/\{weight\}/g, client.currentWeightKg ? `${client.currentWeightKg}` : "")
    .replace(/\{streak\}/g, "")
    .replace(/\{days\}/g, "")
    .replace(/\{date\}/g, new Date().toLocaleDateString());
}

function WhatsAppGlyph() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="opacity-80"
    >
      <path d="M20.52 3.48A11.93 11.93 0 0 0 12.07 0C5.49 0 .14 5.34.14 11.92c0 2.1.55 4.16 1.59 5.97L0 24l6.27-1.64a11.94 11.94 0 0 0 5.78 1.47h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.46-8.43Zm-8.45 18.34h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.62-.23-.37a9.9 9.9 0 0 1-1.51-5.29c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.03 7.02 2.91a9.86 9.86 0 0 1 2.9 7.02c0 5.47-4.45 9.91-9.96 9.91Zm5.43-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.47.13-.62.13-.13.3-.34.45-.51.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.18-.24-.58-.49-.5-.66-.5-.17-.01-.37-.01-.57-.01-.2 0-.51.07-.78.37s-1.02 1-1.02 2.43 1.05 2.82 1.2 3.02c.15.2 2.08 3.18 5.05 4.45.7.3 1.25.48 1.68.62.71.23 1.35.2 1.86.12.57-.08 1.76-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-80"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// suppress unused-import warning if api stays unused
void api;
