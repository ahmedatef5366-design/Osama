"use client";

import { motion, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { TestimonialsContent } from "@/types/cms";

type TestimonialsProps = {
  content: TestimonialsContent;
  locale: string;
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const ROTATION = [-2, 1, -1.5];
const SCALE = [1, 1.05, 0.97];

export function Testimonials({ content, locale }: TestimonialsProps) {
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="relative bg-bg py-28 sm:py-36 overflow-hidden snap-section" id="testimonials">
      {/* Decorative large quote mark */}
      <div className="absolute top-12 start-8 font-display text-[20rem] leading-none text-accent/[0.04] select-none pointer-events-none">
        &ldquo;
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-16 flex flex-col items-center text-center gap-4"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <span className="font-mono text-accent text-sm uppercase tracking-[0.2em]">
            {loc === "ar" ? "\u0642\u0635\u0635 \u0646\u062C\u0627\u062D" : "SUCCESS STORIES"}
          </span>
          <h2 className="font-display text-text-1 text-5xl sm:text-6xl lg:text-7xl uppercase tracking-tight">
            {t(content.title, loc)}
          </h2>
        </motion.div>

        {/* Stacked/overlapping card layout */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-[-1rem]">
          {content.items.map((item, i) => (
            <motion.figure
              key={i}
              custom={i}
              variants={slideFromRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
              className="relative w-full sm:w-[340px] flex-shrink-0"
              style={{
                rotate: ROTATION[i] ?? 0,
                scale: SCALE[i] ?? 1,
                zIndex: content.items.length - i,
              }}
            >
              <div className="rounded-2xl border border-border bg-surface p-8 shadow-lg">
                {/* Initials avatar */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 font-display text-accent text-xl uppercase">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-text-1 font-body font-semibold">{item.name}</p>
                    {typeof item.age === "number" ? (
                      <p className="text-text-3 text-xs font-mono">{item.age} {loc === "ar" ? "\u0633\u0646\u0629" : "yrs"}</p>
                    ) : null}
                  </div>
                </div>

                <blockquote className="font-body text-text-1 text-lg leading-relaxed mb-6">
                  &ldquo;{t(item.quote, loc)}&rdquo;
                </blockquote>

                {item.transformation ? (
                  <div className="inline-block rounded-full bg-accent/10 px-4 py-1.5">
                    <span className="font-mono text-accent text-sm font-medium">
                      {t(item.transformation, loc)}
                    </span>
                  </div>
                ) : null}
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
