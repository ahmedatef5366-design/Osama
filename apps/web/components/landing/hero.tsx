"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { CustomCursor } from "@/components/motion/custom-cursor";
import { Parallax } from "@/components/motion/parallax";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { HeroContent } from "@/types/cms";

type HeroProps = {
  content: HeroContent;
  locale: string;
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -3 },
  show: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export function Hero({ content, locale }: HeroProps) {
  if (!content.visible) return null;
  const loc = asLocale(locale);
  const headlineWords = t(content.headlineL1, loc).split(" ");

  return (
    <section className="relative isolate overflow-hidden bg-mesh cursor-custom grain snap-section">
      <CustomCursor />

      <div className="mx-auto grid min-h-[100vh] max-w-7xl gap-6 px-6 py-20 md:grid-cols-[1fr_0.8fr] md:items-center lg:gap-16">
        {/* Left \u2014 text block, intentionally oversized heading */}
        <motion.div
          className="relative z-10 space-y-10"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Word-by-word reveal headline */}
          <h1 className="font-display uppercase leading-[0.9] tracking-tight text-text-1">
            <span className="block text-[clamp(3.5rem,10vw,8rem)]">
              {headlineWords.map((word, i) => (
                <motion.span key={`w-${i}`} custom={i} variants={wordVariants} className="inline-block mr-[0.25em]">
                  {word}
                </motion.span>
              ))}
            </span>
            <motion.span
              className="block text-[clamp(3rem,9vw,7rem)] bg-gradient-to-r from-accent to-accent-text bg-clip-text text-transparent mt-1"
              variants={slideUp}
            >
              {t(content.headlineL2, loc)}
            </motion.span>
          </h1>

          <motion.p
            className="max-w-md text-text-2 text-lg leading-relaxed font-body"
            variants={slideUp}
          >
            {t(content.subheadline, loc)}
          </motion.p>

          <motion.div variants={slideUp} className="flex items-center gap-6">
            <MagneticButton>
              <Link href={content.ctaUrl || "/login"}>
                <Button size="lg" className="text-base px-8 py-4">
                  {t(content.ctaText, loc)}
                </Button>
              </Link>
            </MagneticButton>

            <motion.span
              className="hidden sm:block text-text-3 text-sm font-mono"
              variants={slideUp}
            >
              {loc === "ar" ? "\u0627\u0628\u062F\u0623 \u0645\u062C\u0627\u0646\u0627\u064B \u2022 \u0628\u062F\u0648\u0646 \u0628\u0637\u0627\u0642\u0629" : "Free start \u2022 No card needed"}
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Right \u2014 asymmetric floating cards with parallax */}
        <div className="relative hidden md:block h-[70vh]">
          <Parallax speed={0.15} className="absolute -top-8 end-0 w-[65%]">
            <motion.div
              className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-surface to-surface-high border border-border overflow-hidden"
              variants={scaleIn}
              initial="hidden"
              animate="show"
            />
          </Parallax>

          {/* Floating metrics scattered asymmetrically */}
          <Parallax speed={-0.1} className="absolute -start-6 top-16">
            <motion.div variants={scaleIn} initial="hidden" animate="show" whileHover={{ scale: 1.08 }}>
              {content.metrics[0] && (
                <FloatingMetric value={t(content.metrics[0].value, loc)} label={t(content.metrics[0].label, loc)} />
              )}
            </motion.div>
          </Parallax>

          <Parallax speed={0.25} className="absolute end-[-1rem] top-[40%]">
            <motion.div variants={scaleIn} initial="hidden" animate="show" whileHover={{ scale: 1.08 }}>
              {content.metrics[1] && (
                <FloatingMetric value={t(content.metrics[1].value, loc)} label={t(content.metrics[1].label, loc)} accent />
              )}
            </motion.div>
          </Parallax>

          <Parallax speed={-0.2} className="absolute start-8 bottom-20">
            <motion.div variants={scaleIn} initial="hidden" animate="show" whileHover={{ scale: 1.08 }}>
              {content.metrics[2] && (
                <FloatingMetric value={t(content.metrics[2].value, loc)} label={t(content.metrics[2].label, loc)} />
              )}
            </motion.div>
          </Parallax>
        </div>
      </div>

      {/* Scrolling marquee at the bottom */}
      <div className="absolute bottom-0 inset-x-0 overflow-hidden border-t border-border bg-surface/40 backdrop-blur-sm">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite]">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="inline-block px-8 py-3 text-text-3 text-sm font-mono uppercase tracking-widest">
              {loc === "ar"
                ? "\u062A\u062F\u0631\u064A\u0628 \u0634\u062E\u0635\u064A \u2022 \u062A\u063A\u0630\u064A\u0629 \u0645\u062E\u0635\u0635\u0629 \u2022 \u0645\u062A\u0627\u0628\u0639\u0629 \u064A\u0648\u0645\u064A\u0629 \u2022 \u0646\u062A\u0627\u0626\u062C \u062D\u0642\u064A\u0642\u064A\u0629"
                : "PERSONAL TRAINING \u2022 CUSTOM NUTRITION \u2022 DAILY TRACKING \u2022 REAL RESULTS"}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

type FloatingMetricProps = {
  value: string;
  label?: string;
  accent?: boolean;
};

function FloatingMetric({ value, label, accent }: FloatingMetricProps) {
  return (
    <div className={`glass rounded-lg px-5 py-4 text-text-1 ${accent ? "border-accent/30" : ""}`}>
      <div className={`text-lg font-display uppercase tracking-wide ${accent ? "text-accent" : ""}`}>{value}</div>
      {label ? <div className="text-text-2 text-xs font-body mt-0.5">{label}</div> : null}
    </div>
  );
}
