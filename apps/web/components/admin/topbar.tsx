"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { User } from "@/types/api";

export function Topbar({ user }: { user: User }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function onLogout() {
    setSigningOut(true);
    try {
      await api("/api/auth/logout", { method: "POST", throwOnError: false });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface/40 px-6">
      <div className="flex items-center gap-3">
        <span className="font-mono text-text-3 text-xs">admin</span>
        <span className="text-text-2 text-sm">{user.email}</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-surface-high px-1.5 py-0.5 text-[10px] text-text-3">
          Ctrl+K
        </kbd>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={onLogout} disabled={signingOut}>
          {t("logout")}
        </Button>
      </div>
    </header>
  );
}
