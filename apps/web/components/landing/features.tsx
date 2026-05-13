"use client";

import { motion, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { FeaturesContent } from "@/types/cms";

type FeaturesProps = {
  content: FeaturesContent;
  locale: string;
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function Features({ content, locale }: FeaturesProps) {
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="bg-bg py-24 sm:py-32" id="features">
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          className="font-display text-text-1 text-4xl sm:text-5xl font-extrabold mb-16"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {t(content.title, loc)}
        </motion.h2>

        <motion.ul
          className="space-y-0"
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {content.items.map((item, i) => (
            <motion.li
              key={i}
              className="group relative border-t border-border last:border-b py-8 sm:py-10"
              variants={itemVariants}
            >
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-baseline gap-6 sm:gap-10">
                  <span className="font-mono text-text-2 text-sm tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-text-1 text-2xl sm:text-3xl transition-colors duration-300 group-hover:text-accent">
                    {t(item.title, loc)}
                  </span>
                </div>
                {item.description ? (
                  <p className="ms-[3.4rem] sm:ms-[4.8rem] max-w-2xl text-text-2 text-sm sm:text-base">
                    {t(item.description, loc)}
                  </p>
                ) : null}
              </div>
              <span
                aria-hidden
                className="ghost-num absolute end-0 -top-4 sm:-top-8 leading-none"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
