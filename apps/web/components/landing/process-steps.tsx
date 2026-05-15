"use client";

import { motion, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { ProcessStepsContent } from "@/types/cms";

type ProcessStepsProps = {
  content: ProcessStepsContent;
  locale: string;
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const stepVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/**
 * Ordered explainer card. Each step uses a localized index numeral (Arabic
 * vs Western digits) so RTL pages don't display Western digits mid-flow.
 */
export function ProcessSteps({ content, locale }: ProcessStepsProps) {
  if (!content.visible || content.steps.length === 0) return null;
  const loc = asLocale(locale);
  const title = t(content.title, loc);
  if (!title) return null;

  return (
    <section className="bg-surface py-16 sm:py-24 md:py-32" id="process-steps">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-12 sm:mb-16 max-w-3xl"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {content.eyebrow ? (
            <span className="font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]">
              {t(content.eyebrow, loc)}
            </span>
          ) : null}
          <h2 className="mt-3 font-display text-text-1 text-3xl sm:text-4xl md:text-5xl font-extrabold">
            {title}
          </h2>
          {content.subtitle ? (
            <p className="mt-4 text-text-2 text-base sm:text-lg">{t(content.subtitle, loc)}</p>
          ) : null}
        </motion.div>

        <motion.ol
          className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4"
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {content.steps.map((step, i) => (
            <motion.li
              key={i}
              variants={stepVariants}
              className="relative flex flex-col gap-4 rounded-2xl border border-border bg-bg p-6 sm:p-7"
            >
              <span className="font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]">
                {loc === "ar" ? `الخطوة ${toArabicDigits(i + 1)}` : `Step ${i + 1}`}
              </span>
              <span
                aria-hidden
                className="font-display text-5xl font-extrabold leading-none text-accent"
              >
                {loc === "ar" ? toArabicDigits(i + 1) : i + 1}
              </span>
              <h3 className="font-display text-text-1 text-xl sm:text-2xl font-bold">
                {t(step.title, loc)}
              </h3>
              {step.description ? (
                <p className="text-text-2 text-sm sm:text-base leading-relaxed">
                  {t(step.description, loc)}
                </p>
              ) : null}
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

function toArabicDigits(n: number): string {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n)
    .split("")
    .map((c) => map[Number(c)] ?? c)
    .join("");
}
