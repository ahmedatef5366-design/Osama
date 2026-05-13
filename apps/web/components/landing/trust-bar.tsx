"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Locale } from "@/types/cms";

type Props = {
  locale: Locale;
};

const ITEM_KEYS = ["1", "2", "3", "4", "5"] as const;

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/**
 * Thin certification strip. Sits just below the hero to set the "this is
 * real" tone before the rest of the page rolls. Renders as monospaced
 * pill chips on a near-flat background so it reads like a press / trust
 * row, not a marketing slab.
 */
export function TrustBar({ locale: _locale }: Props) {
  const t = useTranslations("landing.trust");

  return (
    <section className="border-y border-border/60 bg-bg/60 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between"
        >
          <motion.span
            variants={itemVariants}
            className="font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]"
          >
            {t("eyebrow")}
          </motion.span>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-10">
            {ITEM_KEYS.map((k) => (
              <motion.li
                key={k}
                variants={itemVariants}
                className="font-mono text-text-2 text-[12px] uppercase tracking-[0.22em]"
              >
                {t(`items.${k}`)}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
