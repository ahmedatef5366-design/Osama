"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { FaqContent } from "@/types/cms";

type FaqProps = {
  content: FaqContent;
  locale: string;
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, rotateX: -10 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export function Faq({ content, locale }: FaqProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="relative bg-surface py-28 sm:py-36 snap-section" id="faq">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-16 grid sm:grid-cols-[1fr_2fr] gap-8 items-start">
          {/* Left sticky heading */}
          <motion.div
            className="sm:sticky sm:top-32"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-mono text-accent text-sm uppercase tracking-[0.2em] block mb-3">
              {loc === "ar" ? "\u0623\u0633\u0626\u0644\u0629" : "FAQ"}
            </span>
            <h2 className="font-display text-text-1 text-5xl sm:text-6xl uppercase tracking-tight">
              {t(content.title, loc)}
            </h2>
            <p className="mt-4 text-text-2 text-sm leading-relaxed max-w-xs">
              {loc === "ar"
                ? "\u0645\u0634 \u0644\u0627\u0642\u064A \u0633\u0624\u0627\u0644\u0643\u061F \u0643\u0644\u0645\u0646\u0627 \u0645\u0628\u0627\u0634\u0631\u0629."
                : "Can\u2019t find your question? Message us directly."}
            </p>
          </motion.div>

          {/* Right - interactive cards */}
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {content.items.map((item, i) => {
              const isActive = activeIndex === i;
              return (
                <motion.div
                  key={i}
                  variants={cardVariants}
                  className={`rounded-xl border transition-all duration-300 ${
                    isActive
                      ? "border-accent/40 bg-bg shadow-lg shadow-accent/5"
                      : "border-border bg-bg hover:border-border-hover"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(isActive ? null : i)}
                    className="flex w-full items-center gap-4 p-6 text-start"
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg font-display text-lg transition-colors duration-300 ${
                        isActive
                          ? "bg-accent text-bg"
                          : "bg-surface-high text-text-2"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-body text-text-1 text-base font-medium">
                      {t(item.q, loc)}
                    </span>
                    <motion.span
                      animate={{ rotate: isActive ? 45 : 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="text-text-2 text-xl shrink-0"
                    >
                      +
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 ps-[4.5rem]">
                          <p className="text-text-2 text-sm leading-relaxed">
                            {t(item.a, loc)}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
