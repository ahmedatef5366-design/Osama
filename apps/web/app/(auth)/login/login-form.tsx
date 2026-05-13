"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { APIError, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@/types/api";

const schema = z.object({
  email: z.string().email("invalidEmail"),
  password: z.string().min(8, "invalidPassword"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const t = useTranslations("login");
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await api<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: values,
      });
      const role = res.data?.user.role;
      const dest =
        from && /^\/(admin|client)\b/.test(from)
          ? from
          : role === "admin"
          ? "/admin/dashboard"
          : "/client/today";
      router.replace(dest);
    } catch (err) {
      if (err instanceof APIError) {
        setSubmitError(
          err.status === 401
            ? t("errors.invalidCredentials")
            : err.message || t("errors.network"),
        );
      } else {
        setSubmitError(t("errors.network"));
      }
    }
  }

  return (
    <form
      className="w-full max-w-md space-y-6 rounded-xl border border-border bg-surface/80 backdrop-blur p-8 sm:p-10"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <header className="space-y-2">
        <h1 className="font-display text-text-1 text-4xl font-extrabold">{t("title")}</h1>
        <p className="text-text-2 text-sm">{t("subtitle")}</p>
      </header>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-text-2 text-xs uppercase tracking-[0.12em] font-medium">
            {t("email")}
          </span>
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!errors.email || undefined}
            {...register("email")}
          />
          {errors.email ? (
            <span className="block text-danger text-xs">
              {t(`errors.${errors.email.message}` as `errors.invalidEmail`)}
            </span>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-text-2 text-xs uppercase tracking-[0.12em] font-medium">
            {t("password")}
          </span>
          <Input
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password || undefined}
            {...register("password")}
          />
          {errors.password ? (
            <span className="block text-danger text-xs">
              {t(`errors.${errors.password.message}` as `errors.invalidPassword`)}
            </span>
          ) : null}
        </label>
      </div>

      {submitError ? (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-danger text-sm"
        >
          {submitError}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
