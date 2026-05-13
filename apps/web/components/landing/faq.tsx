"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { FaqContent } from "@/types/cms";

type FaqProps = {
  content: FaqContent;
  locale: string;
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function Faq({ content, locale }: FaqProps) {
  const [open, setOpen] = useState<number | null>(0);
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="bg-bg py-24 sm:py-32" id="faq">
      <div className="mx-auto max-w-3xl px-6">
        <motion.h2
          className="mb-10 font-display text-text-1 text-4xl sm:text-5xl font-extrabold"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {t(content.title, loc)}
        </motion.h2>

        <motion.ul
          className="space-y-3"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {content.items.map((item, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <motion.li key={i} className="border-b border-border" variants={itemVariants}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-start font-display text-text-1 text-lg sm:text-xl"
                  >
                    <span>{t(item.q, loc)}</span>
                    <motion.span
                      aria-hidden
                      className="size-6 shrink-0 text-text-2"
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Chevron />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-text-2 text-base">
                        {t(item.a, loc)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}

function Chevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-full"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
