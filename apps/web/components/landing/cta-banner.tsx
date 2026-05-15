"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * Tall closing CTA between FAQ and Footer. Uses the accent-on-surface
 * treatment that mirrors the hero CTA so the page feels like it loops.
 */
export function CtaBanner() {
  const t = useTranslations("landing.cta");

  return (
    <section className="relative bg-bg py-16 sm:py-24 md:py-32" id="cta-banner">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-high via-surface to-bg p-6 sm:rounded-3xl sm:p-10 md:p-16"
        >
          <div className="pointer-events-none absolute -inset-px bg-[radial-gradient(circle_at_top_right,rgba(200,241,53,0.16),transparent_60%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:40px_40px]" />

          <div className="relative flex flex-col items-start gap-6">
            <span className="font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]">
              {t("eyebrow")}
            </span>
            <h2 className="max-w-3xl font-display text-text-1 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
              {t("title")}
            </h2>
            <p className="max-w-xl text-text-2 text-base sm:text-lg">
              {t("subtitle")}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3 font-medium text-bg shadow-[0_10px_40px_-12px_rgba(200,241,53,0.6)] transition-transform duration-200 hover:scale-[1.03]"
              >
                <span>{t("primary")}</span>
                <Arrow />
              </Link>
              <a
                href="#methodology"
                className="font-mono text-text-2 text-xs uppercase tracking-[0.28em] underline-offset-4 transition-colors duration-200 hover:text-text-1 hover:underline"
              >
                {t("secondary")}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
