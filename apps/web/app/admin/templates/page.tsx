"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { apiData } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MessageTemplate } from "@/types/api";

const categoryOptions = [
  "checkin_reminder",
  "missed_checkin",
  "milestone",
  "welcome",
  "custom",
];

export default function AdminTemplatesPage() {
  const t = useTranslations("admin.templates");
  const locale = useLocale();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["templates", "all"],
    queryFn: () => apiData<MessageTemplate[]>(`/api/templates`),
  });

  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const create = useMutation({
    mutationFn: async (body: Partial<MessageTemplate>) =>
      apiData<MessageTemplate>(`/api/admin/templates`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setShowCreate(false);
    },
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<MessageTemplate>;
    }) =>
      apiData<MessageTemplate>(`/api/admin/templates/${id}`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) =>
      apiData<void>(`/api/admin/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-text-1">
            {t("title")}
          </h1>
          <p className="text-text-2 mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>{t("new")}</Button>
      </header>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(data ?? []).map((tpl) => (
            <Card key={tpl.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>
                    {locale === "ar" ? tpl.labelAr : tpl.labelEn}
                  </CardTitle>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-text-3">
                    {t(`categories.${tpl.category}`)}
                  </span>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <p className="text-xs text-text-3">/{tpl.slug}</p>
                <pre className="whitespace-pre-wrap break-words text-sm text-text-1 bg-surface-low rounded-md p-3 border border-border">
                  {locale === "ar" ? tpl.bodyAr : tpl.bodyEn}
                </pre>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={() => setEditing(tpl)}
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm(t("deleteConfirm"))) remove.mutate(tpl.id);
                    }}
                    className="text-danger hover:text-danger"
                  >
                    {t("delete")}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {showCreate ? (
        <TemplateDialog
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={(b) => create.mutate(b)}
          loading={create.isPending}
        />
      ) : null}
      {editing ? (
        <TemplateDialog
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(b) => update.mutate({ id: editing.id, body: b })}
          loading={update.isPending}
        />
      ) : null}
    </div>
  );
}

function TemplateDialog({
  mode,
  initial,
  onClose,
  onSubmit,
  loading,
}: {
  mode: "create" | "edit";
  initial?: MessageTemplate;
  onClose: () => void;
  onSubmit: (body: Partial<MessageTemplate>) => void;
  loading?: boolean;
}) {
  const t = useTranslations("admin.templates");
  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    category: initial?.category ?? "custom",
    labelEn: initial?.labelEn ?? "",
    labelAr: initial?.labelAr ?? "",
    bodyEn: initial?.bodyEn ?? "",
    bodyAr: initial?.bodyAr ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    isActive: initial?.isActive ?? true,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold text-text-1">
          {mode === "create" ? t("new") : t("edit")}
        </h2>

        <div className="grid sm:grid-cols-2 gap-3">
          {mode === "create" ? (
            <Input
              label={t("slug")}
              value={form.slug}
              onChange={(v) => setForm((f) => ({ ...f, slug: v }))}
            />
          ) : null}
          <Select
            label={t("category")}
            value={form.category}
            options={categoryOptions}
            onChange={(v) => setForm((f) => ({ ...f, category: v }))}
          />
          <Input
            label={t("labelEn")}
            value={form.labelEn}
            onChange={(v) => setForm((f) => ({ ...f, labelEn: v }))}
          />
          <Input
            label={t("labelAr")}
            value={form.labelAr}
            onChange={(v) => setForm((f) => ({ ...f, labelAr: v }))}
          />
        </div>

        <Textarea
          label={t("bodyEn")}
          value={form.bodyEn}
          onChange={(v) => setForm((f) => ({ ...f, bodyEn: v }))}
        />
        <Textarea
          label={t("bodyAr")}
          value={form.bodyAr}
          onChange={(v) => setForm((f) => ({ ...f, bodyAr: v }))}
        />

        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label={t("sortOrder")}
            type="number"
            value={String(form.sortOrder)}
            onChange={(v) =>
              setForm((f) => ({ ...f, sortOrder: parseInt(v || "0", 10) }))
            }
          />
          <label className="flex items-center gap-2 mt-6 text-sm text-text-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
            />
            {t("isActive")}
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            ←
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={loading}>
            {t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs uppercase tracking-[0.12em] text-text-3">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface-high px-3 py-2 text-sm text-text-1"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs uppercase tracking-[0.12em] text-text-3">
        {label}
      </span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface-high px-3 py-2 text-sm text-text-1 font-mono"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs uppercase tracking-[0.12em] text-text-3">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface-high px-3 py-2 text-sm text-text-1"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
