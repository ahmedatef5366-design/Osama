"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { HeroContent } from "@/types/cms";

type HeroProps = {
  content: HeroContent;
  locale: string;
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const floatIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export function Hero({ content, locale }: HeroProps) {
  if (!content.visible) return null;
  const loc = asLocale(locale);

  return (
    <section className="relative isolate overflow-hidden bg-mesh">
      <div className="mx-auto grid min-h-[88vh] max-w-7xl gap-12 px-6 py-24 sm:py-32 md:grid-cols-[1.4fr_1fr] md:items-center">
        <motion.div
          className="space-y-8"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <h1 className="font-display font-extrabold leading-[0.95] text-text-1 text-6xl sm:text-7xl md:text-8xl">
            <motion.span className="block" variants={fadeUp}>
              {t(content.headlineL1, loc)}
            </motion.span>
            <motion.span
              className="block bg-gradient-to-l from-accent to-accent-text bg-clip-text text-transparent"
              variants={fadeUp}
            >
              {t(content.headlineL2, loc)}
            </motion.span>
          </h1>

          <motion.p
            className="max-w-md text-text-2 text-lg sm:text-xl"
            variants={fadeUp}
          >
            {t(content.subheadline, loc)}
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link href={content.ctaUrl || "/login"}>
              <Button size="lg">{t(content.ctaText, loc)}</Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative hidden md:block"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div
            className="aspect-[3/4] rounded-xl bg-gradient-to-br from-surface to-surface-high border border-border"
            variants={floatIn}
          />

          {content.metrics.slice(0, 3).map((m, i) => (
            <motion.div
              key={i}
              className={floatingClasses(i)}
              variants={floatIn}
              whileHover={{ scale: 1.05 }}
            >
              <FloatingMetric
                value={t(m.value, loc)}
                label={t(m.label, loc)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

type FloatingMetricProps = {
  value: string;
  label?: string;
};

function FloatingMetric({ value, label }: FloatingMetricProps) {
  return (
    <div className="glass rounded-md px-4 py-3 text-text-1 animate-float">
      <div className="text-sm font-medium">{value}</div>
      {label ? <div className="text-text-2 text-xs">{label}</div> : null}
    </div>
  );
}

function floatingClasses(i: number): string {
  switch (i) {
    case 0:
      return "absolute -start-8 top-8";
    case 1:
      return "absolute -end-6 top-1/3";
    case 2:
    default:
      return "absolute -start-4 bottom-12";
  }
}
