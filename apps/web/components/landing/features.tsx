"use client";

import { motion, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { FeaturesContent } from "@/types/cms";

type FeaturesProps = {
  content: FeaturesContent;
  locale: string;
};

const headingSlide: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const cardPop: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const ICONS = [
  /* dumbbell */
  "M6.5 6.5h11M4 8.5a2 2 0 0 1 0-4h1v4H4ZM19 4.5a2 2 0 0 1 0 4h-1v-4h1Z",
  /* utensils */
  "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  /* check-circle */
  "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  /* message-circle */
  "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z",
  /* bar-chart-2 */
  "M18 20V10M12 20V4M6 20v-6",
];

const GRID_CLASSES = [
  "sm:col-span-2 sm:row-span-2",
  "sm:col-span-1",
  "sm:col-span-1",
  "sm:col-span-1",
  "sm:col-span-2",
];

export function Features({ content, locale }: FeaturesProps) {
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="relative bg-surface py-28 sm:py-36 snap-section" id="features">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-16 flex flex-col gap-3"
          variants={headingSlide}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <span className="font-mono text-accent text-sm uppercase tracking-[0.2em]">
            {loc === "ar" ? "\u0644\u0645\u0627\u0630\u0627 \u0646\u062D\u0646" : "WHY US"}
          </span>
          <h2 className="font-display text-text-1 text-5xl sm:text-6xl lg:text-7xl uppercase tracking-tight">
            {t(content.title, loc)}
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {content.items.map((item, i) => (
            <motion.article
              key={i}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-bg p-8 transition-colors hover:border-accent/40 ${GRID_CLASSES[i] ?? ""}`}
              variants={cardPop}
              whileHover={{ y: -4 }}
            >
              <div className="mb-6">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent transition-transform duration-300 group-hover:scale-110"
                >
                  <path d={ICONS[i] ?? ICONS[0]} />
                </svg>
              </div>

              <h3 className="font-display text-text-1 text-2xl sm:text-3xl uppercase tracking-tight mb-3">
                {t(item.title, loc)}
              </h3>

              {item.description ? (
                <p className="text-text-2 text-sm leading-relaxed max-w-sm">
                  {t(item.description, loc)}
                </p>
              ) : null}

              <span
                aria-hidden
                className="absolute -bottom-6 -end-4 font-display text-[8rem] leading-none text-text-1 opacity-[0.03] uppercase"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
