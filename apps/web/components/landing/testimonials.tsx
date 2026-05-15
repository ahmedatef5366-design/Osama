"use client";

import { motion, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { TestimonialsContent } from "@/types/cms";

type TestimonialsProps = {
  content: TestimonialsContent;
  locale: string;
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const quoteVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function Testimonials({ content, locale }: TestimonialsProps) {
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="bg-bg py-16 sm:py-24 md:py-32" id="testimonials">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.h2
          className="mb-8 font-display text-text-1 text-3xl sm:text-4xl md:text-5xl font-extrabold sm:mb-16"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {t(content.title, loc)}
        </motion.h2>

        <motion.div
          className="columns-1 gap-8 sm:columns-2"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {content.items.map((item, i) => (
            <motion.figure
              key={i}
              className="mb-8 break-inside-avoid rounded-xl border border-border bg-surface/60 p-6 transition-colors duration-300 hover:border-accent/40"
              variants={quoteVariants}
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-accent/30 to-accent/5 font-mono text-text-1 text-sm font-medium ring-1 ring-accent/20"
                >
                  {monogram(item.name)}
                </span>
                <div className="leading-tight">
                  <p className="text-text-1 text-sm font-medium">
                    {item.name}
                    {typeof item.age === "number" ? (
                      <span className="text-text-3"> · {item.age}</span>
                    ) : null}
                  </p>
                  {item.transformation ? (
                    <p className="font-mono text-accent text-[11px] uppercase tracking-widest">
                      {t(item.transformation, loc)}
                    </p>
                  ) : null}
                </div>
              </div>
              <blockquote className="font-display text-text-1 text-xl sm:text-2xl leading-snug">
                &ldquo;{t(item.quote, loc)}&rdquo;
              </blockquote>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Pulls the two-letter monogram from a display name (e.g. "Ahmed M." → "AM").
 * Used as the tiny avatar stand-in next to each quote — keeps the design
 * editorial without committing to either a) photographing real clients
 * or b) using AI-generated faces.
 */
function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}
