"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t as tt, asLocale } from "@/lib/i18n-helpers";
import type { PricingContent } from "@/types/cms";

type PricingProps = {
  content: PricingContent;
  locale: string;
};

type Billing = "monthly" | "yearly";

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/**
 * Yearly-price helper. We don't store a separate yearly price in the
 * CMS to keep that schema simple — instead we display monthly×12 with a
 * 20% discount in the "Yearly" tab. The chip on the toggle calls this
 * out explicitly so the savings aren't hidden in fine-print.
 */
function deriveYearly(rawPrice: string): string {
  const match = rawPrice.match(/(\d[\d,.]*)/);
  if (!match || !match[1]) return rawPrice;
  const numericPart = match[1];
  const monthly = Number(numericPart.replace(/[,.]/g, ""));
  if (!Number.isFinite(monthly) || monthly <= 0) return rawPrice;
  const yearly = Math.round(monthly * 12 * 0.8);
  return rawPrice.replace(numericPart, yearly.toLocaleString("en-US"));
}

function applyBilling(rawPrice: string, billing: Billing): string {
  if (billing === "monthly") return rawPrice;
  const next = deriveYearly(rawPrice);
  return next
    .replace(/\/(mo|month|شهر)/i, billing === "yearly" ? "/yr" : "/mo")
    .replace(/شهر/g, "سنة");
}

export function Pricing({ content, locale }: PricingProps) {
  const pt = useTranslations("landing.pricing");
  const [billing, setBilling] = useState<Billing>("monthly");

  if (!content.visible || content.tiers.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="bg-surface py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-10 text-center sm:mb-14"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <span className="font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]">
            {pt("eyebrow")}
          </span>
          <h2 className="mt-3 font-display text-text-1 text-4xl sm:text-5xl font-extrabold">
            {tt(content.title, loc)}
          </h2>
          {content.subtitle ? (
            <p className="mx-auto mt-3 max-w-xl text-text-2 text-lg">{tt(content.subtitle, loc)}</p>
          ) : null}

          <div className="mt-8 inline-flex rounded-full border border-border bg-bg p-1">
            <BillingTab
              active={billing === "monthly"}
              onClick={() => setBilling("monthly")}
            >
              {pt("monthly")}
            </BillingTab>
            <BillingTab
              active={billing === "yearly"}
              onClick={() => setBilling("yearly")}
              hint={pt("save")}
            >
              {pt("yearly")}
            </BillingTab>
          </div>
        </motion.div>

        <motion.div
          className="grid gap-6 sm:grid-cols-3 sm:items-stretch"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {content.tiers.map((tier) => {
            const rawPrice = tt(tier.price, loc);
            const displayPrice = applyBilling(rawPrice, billing);
            return (
              <motion.article
                key={tier.id}
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border bg-bg p-6 transition",
                  tier.featured
                    ? "border-accent shadow-[0_0_48px_-16px_var(--accent-glow)] sm:-translate-y-2"
                    : "border-border hover:border-border-hover",
                )}
                variants={cardVariants}
              >
                {tier.featured ? (
                  <span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 font-mono text-bg text-[10px] uppercase tracking-[0.2em] shadow-[0_8px_24px_-8px_rgba(200,241,53,0.6)]">
                    {pt("popular")}
                  </span>
                ) : null}

                <header className="space-y-2">
                  <h3 className="font-display text-text-1 text-2xl font-bold">
                    {tt(tier.name, loc)}
                  </h3>
                  <p className="font-mono text-accent text-3xl tabular-nums">
                    {displayPrice}
                  </p>
                </header>

                <ul className="mt-6 space-y-3">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          f.included ? "bg-accent text-bg" : "border border-border text-text-3",
                        )}
                      >
                        {f.included ? (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="6" y1="12" x2="18" y2="12" />
                          </svg>
                        )}
                      </span>
                      <span className={f.included ? "text-text-1" : "text-text-3 line-through"}>
                        {tt(f.label, loc)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 sm:mt-auto">
                  <Link href="/login">
                    <Button variant={tier.featured ? "accent" : "ghost"} size="md" className="w-full">
                      {locale === "ar" ? "اختر هذا" : "Choose this"}
                    </Button>
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        <motion.p
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-10 text-center text-text-3 text-sm"
        >
          <ShieldIcon />
          <span className="ms-2 align-middle">{pt("moneyBack")}</span>
        </motion.p>
      </div>
    </section>
  );
}

function BillingTab({
  active,
  onClick,
  hint,
  children,
}: {
  active: boolean;
  onClick: () => void;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-full px-5 py-2 font-mono text-xs uppercase tracking-[0.22em] transition-colors",
        active ? "bg-accent text-bg" : "text-text-2 hover:text-text-1",
      )}
    >
      <span>{children}</span>
      {hint && !active ? (
        <span className="ms-2 rounded-full bg-accent/15 px-2 py-0.5 text-[9px] text-accent">
          {hint}
        </span>
      ) : null}
    </button>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block align-middle text-accent"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}
