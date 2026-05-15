"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Locale } from "@/types/cms";

type Props = {
  locale: Locale;
};

const STEP_KEYS = ["1", "2", "3"] as const;

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

/**
 * "How it works" — a tight 3-step strip. The line above each card pulses
 * one beat after the card slides in to draw the eye through the sequence
 * in the intended reading order.
 */
export function Methodology({ locale: _locale }: Props) {
  const t = useTranslations("landing.methodology");

  return (
    <section className="relative bg-bg py-16 sm:py-24 md:py-32" id="methodology">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-14 sm:mb-20 max-w-3xl"
        >
          <span className="font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]">
            {t("eyebrow")}
          </span>
          <h2 className="mt-3 font-display text-text-1 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.05]">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-xl text-text-2 text-base sm:text-lg">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.ol
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3"
        >
          {STEP_KEYS.map((k, i) => (
            <motion.li
              key={k}
              variants={cardVariants}
              className="group relative flex flex-col gap-6 bg-bg p-8 sm:p-10 transition-colors duration-300 hover:bg-surface/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-text-3 text-[10px] uppercase tracking-[0.3em]">
                  {t(`steps.${k}.label`)}
                </span>
                <span
                  aria-hidden
                  className="font-display text-text-3/40 text-5xl leading-none transition-colors duration-300 group-hover:text-accent/70"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="h-px w-12 bg-accent/70" />

              <h3 className="font-display text-text-1 text-2xl sm:text-3xl">
                {t(`steps.${k}.title`)}
              </h3>
              <p className="text-text-2 text-sm sm:text-base leading-relaxed">
                {t(`steps.${k}.body`)}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
