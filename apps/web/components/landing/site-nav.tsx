"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
import type { Locale } from "@/types/cms";

type Props = {
  locale: Locale;
};

const SECTIONS = [
  { id: "coach", key: "coach" },
  { id: "features", key: "features" },
  { id: "transformations", key: "work" },
  { id: "calculator", key: "calculator" },
  { id: "pricing", key: "pricing" },
  { id: "faq", key: "faq" },
] as const;

/**
 * Sticky top navigation. Renders transparent over the hero, then snaps to
 * a translucent panel with a hairline border once the user has scrolled
 * past the fold. The accent dot pulses subtly to draw the eye without
 * being distracting.
 */
export function SiteNav({ locale }: Props) {
  const t = useTranslations("landing.nav");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out " +
        (scrolled
          ? "border-b border-border bg-bg/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent")
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 sm:py-4">
        <Link
          href="/"
          aria-label={t("brand")}
          className="group inline-flex items-center gap-2 font-display text-text-1 text-base sm:text-lg font-semibold"
        >
          <span className="relative grid h-6 w-6 place-items-center">
            <span className="absolute inset-0 rounded-full bg-accent/15" />
            <span className="relative h-2 w-2 rounded-full bg-accent transition-transform duration-300 group-hover:scale-125" />
          </span>
          <span className="tracking-tight">{t("brand")}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 font-mono text-text-2 text-[12px] uppercase tracking-[0.18em]">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="relative py-1 transition-colors duration-200 hover:text-text-1"
            >
              <span>{t(s.key)}</span>
              <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-start scale-x-0 bg-accent transition-transform duration-300 hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale} />
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 font-medium text-bg text-sm shadow-[0_6px_24px_-8px_rgba(200,241,53,0.6)] transition-transform duration-200 hover:scale-[1.03]"
          >
            <span>{t("login")}</span>
            <Arrow />
          </Link>
          <button
            type="button"
            aria-label="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden grid h-9 w-9 place-items-center rounded-md border border-border text-text-1"
          >
            <motion.span
              animate={open ? "open" : "closed"}
              className="relative block h-3 w-4"
            >
              <motion.span
                className="absolute left-0 right-0 top-0 h-px bg-current"
                variants={{ closed: { y: 0, rotate: 0 }, open: { y: 6, rotate: 45 } }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="absolute left-0 right-0 bottom-0 h-px bg-current"
                variants={{ closed: { y: 0, rotate: 0 }, open: { y: -6, rotate: -45 } }}
                transition={{ duration: 0.2 }}
              />
            </motion.span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="lg:hidden overflow-hidden border-t border-border bg-bg/95 backdrop-blur"
          >
            <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 font-mono text-text-1 text-sm uppercase tracking-[0.18em]">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-md py-2 hover:bg-surface"
                  >
                    {t(s.key)}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-bg"
                  onClick={() => setOpen(false)}
                >
                  <span>{t("login")}</span>
                  <Arrow />
                </Link>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function Arrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="rtl:rotate-180"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
