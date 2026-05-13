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
    <section className="bg-bg py-24 sm:py-32" id="testimonials">
      <div className="mx-auto max-w-6xl px-6">
        <motion.h2
          className="mb-12 font-display text-text-1 text-4xl sm:text-5xl font-extrabold sm:mb-16"
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
              className="mb-8 break-inside-avoid border-s-2 border-accent ps-6"
              variants={quoteVariants}
            >
              <blockquote className="font-display text-text-1 text-xl sm:text-2xl leading-snug">
                &ldquo;{t(item.quote, loc)}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center justify-between text-sm">
                <span className="text-text-1 font-medium">
                  {item.name}
                  {typeof item.age === "number" ? <span className="text-text-3"> · {item.age}</span> : null}
                </span>
                {item.transformation ? (
                  <span className="font-mono text-accent text-xs uppercase tracking-widest">
                    {t(item.transformation, loc)}
                  </span>
                ) : null}
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
