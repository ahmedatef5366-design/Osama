"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, apiData, APIError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PublicInvite = {
  email: string;
  name: string;
  expiresAt: string;
};

export function InviteAcceptForm({ token }: { token: string }) {
  const t = useTranslations("invite");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const lookup = useQuery({
    queryKey: ["invite", token],
    queryFn: () => apiData<PublicInvite>(`/api/invites/${encodeURIComponent(token)}`),
    retry: false,
  });

  const accept = useMutation({
    mutationFn: async () =>
      api(`/api/invites/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        body: { password },
      }),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
    },
    onError: (e) => setError(e instanceof APIError ? e.message : String(e)),
  });

  if (lookup.isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardBody>
          <p className="text-text-2 text-sm">Loading…</p>
        </CardBody>
      </Card>
    );
  }

  if (lookup.isError) {
    const err = lookup.error;
    const code = err instanceof APIError ? err.code : null;
    return (
      <Card className="w-full max-w-md">
        <CardBody className="space-y-3">
          <h1 className="text-text-1 text-2xl font-semibold">
            {code === "invite_expired" ? t("expired") : t("notFound")}
          </h1>
          <Link
            href="/login"
            className="text-accent text-sm hover:underline"
          >
            {t("goToLogin")}
          </Link>
        </CardBody>
      </Card>
    );
  }

  const inv = lookup.data!;

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardBody className="space-y-3">
          <h1 className="text-text-1 text-2xl font-semibold">{t("title")}</h1>
          <p className="text-success text-sm">{t("success")}</p>
          <Link
            href="/login"
            className="text-accent text-sm hover:underline"
          >
            {t("goToLogin")}
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardBody className="space-y-4">
        <h1 className="text-text-1 text-2xl font-semibold">{t("title")}</h1>
        <p className="text-text-2 text-sm">{t("intro")}</p>

        <div className="space-y-3">
          <Field label={t("name")}>
            <Input value={inv.name} readOnly />
          </Field>
          <Field label={t("email")}>
            <Input value={inv.email} readOnly />
          </Field>
          <Field label={t("password")}>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="text-text-3 text-xs">{t("passwordHint")}</span>
          </Field>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <Button
          onClick={() => accept.mutate()}
          disabled={accept.isPending || password.length < 8}
          className="w-full"
        >
          {t("submit")}
        </Button>
      </CardBody>
    </Card>
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
