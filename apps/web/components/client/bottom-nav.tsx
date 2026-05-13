"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  key: "today" | "progress" | "photos" | "checkin";
};

const items: Item[] = [
  { href: "/client/today", key: "today" },
  { href: "/client/progress", key: "progress" },
  { href: "/client/photos", key: "photos" },
  { href: "/client/checkin", key: "checkin" },
];

export function BottomNav() {
  const path = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="glass fixed inset-x-4 bottom-4 z-30 rounded-xl px-2 py-2">
      <ul className="grid grid-cols-4 gap-1">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-md py-2 text-xs transition-colors",
                  active ? "text-accent" : "text-text-2 hover:text-text-1",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    active ? "bg-accent" : "bg-text-3",
                  )}
                />
                {t(it.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
