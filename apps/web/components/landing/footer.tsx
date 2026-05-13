"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { NewsletterForm } from "@/components/landing/newsletter-form";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { FooterContent } from "@/types/cms";

type FooterProps = {
  content: FooterContent;
  locale: string;
};

export function Footer({ content, locale }: FooterProps) {
  if (!content.visible) return null;
  const loc = asLocale(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-bg overflow-hidden snap-section">
      {/* Large CTA banner */}
      <div className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <motion.h2
            className="font-display text-text-1 text-6xl sm:text-7xl lg:text-8xl uppercase tracking-tight mb-6"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {loc === "ar" ? "\u062C\u0627\u0647\u0632 \u062A\u0628\u062F\u0623\u061F" : "READY TO START?"}
          </motion.h2>
          <motion.p
            className="mx-auto max-w-lg text-text-2 text-lg mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {t(content.tagline, loc)}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <MagneticButton className="inline-block">
              <Link
                href="/login"
                className="inline-block btn-accent rounded-full px-10 py-4 font-display text-xl uppercase tracking-wide"
              >
                {loc === "ar" ? "\u0627\u0628\u062F\u0623 \u0627\u0644\u0622\u0646" : "GET STARTED"}
              </Link>
            </MagneticButton>
          </motion.div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 sm:grid-cols-5">
            {/* Brand + newsletter */}
            <section className="sm:col-span-2">
              <p className="font-display text-text-1 text-4xl uppercase tracking-tight">OSAMA</p>
              <p className="mt-3 max-w-xs text-text-2 text-sm leading-relaxed">
                {t(content.tagline, loc)}
              </p>
              {content.newsletter ? (
                <div className="mt-6">
                  <NewsletterForm
                    placeholder={t(content.newsletter.placeholder, loc)}
                    cta={t(content.newsletter.cta, loc)}
                  />
                </div>
              ) : null}
            </section>

            {/* Link columns */}
            {content.columns.map((col, i) => (
              <section key={i}>
                <h3 className="mb-4 font-display text-text-1 text-sm uppercase tracking-[0.15em]">
                  {t(col.title, loc)}
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {col.links.map((l, j) => (
                    <li key={j}>
                      <Link
                        href={l.href}
                        className="text-text-2 transition-colors hover:text-accent font-body"
                      >
                        {t(l.label, loc)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
            <p className="text-text-3 text-xs font-mono">
              &copy; {year} &middot; {t(content.copyright, loc)}
            </p>
            <div className="flex items-center gap-5">
              {content.social?.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-2 text-sm font-body transition-colors hover:text-accent"
                >
                  {s.label}
                </a>
              )) ?? null}
              <LanguageSwitcher currentLocale={loc} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
