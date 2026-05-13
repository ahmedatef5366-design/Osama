"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; key: "dashboard" | "clients" | "plans" | "nutrition" | "monitoring" | "cms" | "settings" };

const items: Item[] = [
  { href: "/admin/dashboard", key: "dashboard" },
  { href: "/admin/clients", key: "clients" },
  { href: "/admin/plans", key: "plans" },
  { href: "/admin/nutrition", key: "nutrition" },
  { href: "/admin/monitoring", key: "monitoring" },
  { href: "/admin/cms", key: "cms" },
  { href: "/admin/settings", key: "settings" },
];

export function Sidebar() {
  const path = usePathname();
  const t = useTranslations("nav");

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-e border-border bg-surface/40 px-4 py-6">
      <Link
        href="/admin/dashboard"
        className="font-display text-2xl font-extrabold text-text-1 px-2 mb-8"
      >
        Osama
      </Link>
      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-accent-dim text-accent"
                  : "text-text-2 hover:text-text-1 hover:bg-surface",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  active ? "bg-accent" : "bg-text-3 group-hover:bg-text-2",
                )}
              />
              {t(it.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
