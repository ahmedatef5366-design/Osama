"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiData, APIError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Invite = {
  id: string;
  email: string;
  name: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
};

type CreateResponse = {
  invite: Invite;
  token: string;
  url: string;
};

export function InvitesManager() {
  const t = useTranslations("admin.invites");
  const tStatus = useTranslations("admin.invites.status");
  const tCols = useTranslations("admin.invites.columns");
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [expiresInHours, setExpiresInHours] = useState<number>(168);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["invites"],
    queryFn: () => apiData<Invite[]>("/api/admin/invites"),
  });

  const create = useMutation({
    mutationFn: async () =>
      apiData<CreateResponse>("/api/admin/invites", {
        method: "POST",
        body: {
          name,
          email,
          expiresInHours: Number.isFinite(expiresInHours)
            ? expiresInHours
            : undefined,
        },
      }),
    onSuccess: (resp) => {
      setError(null);
      // Build a fallback URL if the API didn't provide one.
      const url =
        resp.url ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/invite/${resp.token}`
          : `/invite/${resp.token}`);
      setCreatedLink(url);
      setName("");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: (e) => setError(e instanceof APIError ? e.message : String(e)),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) =>
      api(`/api/admin/invites/${id}/revoke`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites"] }),
  });

  async function copy() {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("name")}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sara"
              />
            </Field>
            <Field label={t("email")}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sara@example.com"
              />
            </Field>
            <Field label={t("expiresIn")}>
              <Input
                type="number"
                min={1}
                max={720}
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(parseInt(e.target.value, 10))}
              />
            </Field>
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !name || !email}
            >
              {t("create")}
            </Button>
          </div>

          {createdLink && (
            <div className="rounded-md border border-accent-dim bg-accent-dim/30 p-3 space-y-2">
              <p className="text-text-2 text-xs">{t("shareLink")}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-surface-high px-3 py-2 text-xs text-text-1">
                  {createdLink}
                </code>
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? t("copied") : t("copy")}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !data || data.length === 0 ? (
            <p className="p-6 text-sm text-text-2">{t("empty")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-3 uppercase tracking-[0.12em] text-[11px]">
                  <th className="text-start font-medium py-3 px-4">
                    {tCols("name")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {tCols("email")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {tCols("status")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {tCols("created")}
                  </th>
                  <th className="text-start font-medium py-3 px-4">
                    {tCols("expires")}
                  </th>
                  <th className="text-end font-medium py-3 px-4">
                    {tCols("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-high">
                    <td className="py-3 px-4 text-text-1">{inv.name}</td>
                    <td className="py-3 px-4 text-text-2">{inv.email}</td>
                    <td className="py-3 px-4">
                      <span className={"rounded-md px-2 py-0.5 text-xs font-medium " + pill(inv.status)}>
                        {tStatus(inv.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-2 text-xs">
                      {fmt(inv.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-text-2 text-xs">
                      {fmt(inv.expiresAt)}
                    </td>
                    <td className="py-3 px-4 text-end">
                      {inv.status === "pending" && (
                        <button
                          className="text-xs text-danger hover:underline"
                          onClick={() => {
                            if (window.confirm(t("revokeConfirm"))) {
                              revoke.mutate(inv.id);
                            }
                          }}
                        >
                          {t("revoke")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-text-2 text-xs uppercase tracking-[0.12em]">
        {label}
      </span>
      {children}
    </label>
  );
}

function pill(status: string) {
  switch (status) {
    case "accepted":
      return "bg-success/15 text-success";
    case "pending":
      return "bg-info/15 text-info";
    case "revoked":
      return "bg-danger/15 text-danger";
    case "expired":
      return "bg-warning/15 text-warning";
    default:
      return "bg-surface-edge text-text-2";
  }
}

function fmt(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}
