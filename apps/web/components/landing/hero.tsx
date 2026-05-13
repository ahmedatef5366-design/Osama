"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { t, asLocale } from "@/lib/i18n-helpers";
import { heroAthlete } from "@/lib/imagery";
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
      {/* Top-left etched "01 / coach" — gives the hero a small editorial
          anchor instead of a sterile vertical center. */}
      <div className="pointer-events-none absolute start-6 top-6 hidden items-center gap-3 font-mono text-text-3 text-xs uppercase tracking-[0.2em] md:flex">
        <span className="tabular-nums">01</span>
        <span className="h-px w-8 bg-border" />
        <span>{loc === "ar" ? "هذا أنت" : "this is you"}</span>
      </div>

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

          <motion.div className="flex flex-wrap items-center gap-5" variants={fadeUp}>
            <Link href={content.ctaUrl || "/login"}>
              <Button size="lg">{t(content.ctaText, loc)}</Button>
            </Link>
            <Link
              href="#features"
              className="group inline-flex items-center gap-2 text-text-2 text-sm font-medium hover:text-text-1 transition-colors"
            >
              <span className="h-px w-8 bg-border transition-all duration-300 group-hover:w-12 group-hover:bg-accent" />
              {loc === "ar" ? "كيف يعمل" : "how it works"}
            </Link>
          </motion.div>

          {/* Inline metric strip on mobile (the floating-card variant is
              only laid out for the md+ breakpoint). */}
          <motion.dl
            className="flex divide-x divide-border border-y border-border md:hidden"
            style={loc === "ar" ? { direction: "rtl" } : undefined}
            variants={fadeUp}
          >
            {content.metrics.slice(0, 3).map((m, i) => (
              <div key={i} className="flex-1 px-4 py-3">
                <dt className="font-mono text-accent text-base tabular-nums">
                  {t(m.value, loc)}
                </dt>
                <dd className="text-text-3 text-[11px] uppercase tracking-widest">
                  {t(m.label, loc)}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          className="relative hidden md:block"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Real photograph rather than a gradient placeholder. The
              tinted overlay + grain blends it into the brand-dark
              palette without flattening the subject's contrast. */}
          <motion.div
            className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface-high"
            variants={floatIn}
          >
            <Image
              src={heroAthlete.src}
              alt={heroAthlete.alt[loc]}
              fill
              priority
              sizes="(min-width: 768px) 38vw, 100vw"
              className="object-cover [filter:grayscale(15%)_contrast(1.05)_brightness(0.85)]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-bg/80 via-bg/10 to-transparent" />
            <div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-30"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              }}
            />
            <div className="absolute bottom-4 start-4 flex items-center gap-2 font-mono text-text-3 text-[10px] uppercase tracking-widest">
              <span className="h-1 w-1 rounded-full bg-accent" />
              {loc === "ar" ? "تدريب فعلي" : "real training"}
            </div>
          </motion.div>

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
