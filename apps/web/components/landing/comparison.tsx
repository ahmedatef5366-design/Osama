"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Locale } from "@/types/cms";

type Props = {
  locale: Locale;
};

const ROW_KEYS = ["1", "2", "3", "4", "5"] as const;

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const columnVariants: Variants = {
  hidden: { opacity: 0, x: 0 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/**
 * Side-by-side "alone vs with us" strip. Reads cleanly in both LTR and
 * RTL because the column order is governed by document direction, not
 * absolute positioning. The accent rail on the "with me" side draws the
 * eye to the desirable column.
 */
export function Comparison({ locale: _locale }: Props) {
  const t = useTranslations("landing.comparison");

  return (
    <section className="relative bg-surface py-24 sm:py-32" id="compare">
      <div className="mx-auto max-w-7xl px-6">
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
          <h2 className="mt-3 font-display text-text-1 text-4xl sm:text-5xl font-extrabold leading-[1.05]">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-xl text-text-2 text-base sm:text-lg">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <motion.div
            variants={columnVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="relative rounded-2xl border border-border bg-bg p-8 sm:p-10"
          >
            <div className="mb-8 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-border text-text-3">
                <CrossIcon />
              </span>
              <h3 className="font-display text-text-2 text-xl sm:text-2xl font-semibold">
                {t("aloneTitle")}
              </h3>
            </div>
            <motion.ul
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="space-y-4"
            >
              {ROW_KEYS.map((k) => (
                <motion.li
                  key={k}
                  variants={rowVariants}
                  className="flex items-start gap-3 text-text-3 text-sm sm:text-base"
                >
                  <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/70 text-text-3">
                    <CrossIcon small />
                  </span>
                  <span className="line-through decoration-border decoration-[1.5px]">
                    {t(`alone.${k}`)}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div
            variants={columnVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-surface-high via-bg to-bg p-8 sm:p-10 shadow-[0_30px_80px_-40px_rgba(200,241,53,0.45)]"
          >
            <div className="pointer-events-none absolute inset-y-0 start-0 w-[3px] bg-gradient-to-b from-accent via-accent/70 to-transparent" />
            <div className="mb-8 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-accent">
                <CheckIcon />
              </span>
              <h3 className="font-display text-text-1 text-xl sm:text-2xl font-semibold">
                {t("withTitle")}
              </h3>
            </div>
            <motion.ul
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="space-y-4"
            >
              {ROW_KEYS.map((k) => (
                <motion.li
                  key={k}
                  variants={rowVariants}
                  className="flex items-start gap-3 text-text-1 text-sm sm:text-base"
                >
                  <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-bg">
                    <CheckIcon small />
                  </span>
                  <span>{t(`withMe.${k}`)}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CheckIcon({ small = false }: { small?: boolean }) {
  const size = small ? 10 : 16;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon({ small = false }: { small?: boolean }) {
  const size = small ? 10 : 16;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
