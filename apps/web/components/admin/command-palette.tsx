"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

type CommandItem = {
  id: string;
  label: string;
  href: string;
  group: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("admin.command");

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const items: CommandItem[] = [
    { id: "dashboard", label: t("dashboard"), href: "/admin/dashboard", group: t("pages") },
    { id: "clients", label: t("clients"), href: "/admin/clients", group: t("pages") },
    { id: "monitoring", label: t("monitoring"), href: "/admin/monitoring", group: t("pages") },
    { id: "plans", label: t("plans"), href: "/admin/plans", group: t("pages") },
    { id: "nutrition", label: t("nutritionPage"), href: "/admin/nutrition", group: t("pages") },
    { id: "cms", label: t("cms"), href: "/admin/cms", group: t("pages") },
    { id: "inbox", label: t("inbox"), href: "/admin/inbox", group: t("pages") },
    { id: "calendar", label: t("calendar"), href: "/admin/calendar", group: t("pages") },
  ];

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-bg/60 pt-[20vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label={t("placeholder")} className="flex flex-col">
              <Command.Input
                placeholder={t("placeholder")}
                className="w-full border-b border-border bg-transparent px-4 py-3 text-text-1 placeholder:text-text-3 focus:outline-none"
              />
              <Command.List className="max-h-72 overflow-y-auto p-2">
                <Command.Empty className="px-4 py-8 text-center text-sm text-text-2">
                  {t("noResults")}
                </Command.Empty>
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-1 transition-colors data-[selected=true]:bg-accent-dim data-[selected=true]:text-accent"
                  >
                    {item.label}
                  </Command.Item>
                ))}
              </Command.List>
              <div className="border-t border-border px-4 py-2 text-[10px] text-text-3">
                {t("hint")}
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
