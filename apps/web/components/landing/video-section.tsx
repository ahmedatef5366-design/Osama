"use client";

import { motion, type Variants } from "framer-motion";

type VideoSectionProps = {
  locale: string;
};

const fadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const CONTENT = {
  en: {
    tag: "INSIDE THE GYM",
    headline: "SEE THE WORK",
    subtitle: "Real training. Real coaching. Real sweat.",
    clips: [
      { label: "Form check", duration: "0:42" },
      { label: "Client PR", duration: "0:28" },
      { label: "Meal prep", duration: "1:15" },
      { label: "Progress day", duration: "0:55" },
    ],
  },
  ar: {
    tag: "\u062C\u0648\u0627 \u0627\u0644\u062C\u064A\u0645",
    headline: "\u0634\u0648\u0641 \u0627\u0644\u0634\u063A\u0644",
    subtitle: "\u062A\u062F\u0631\u064A\u0628 \u062D\u0642\u064A\u0642\u064A. \u0643\u0648\u062A\u0634\u064A\u0646\u062C \u062D\u0642\u064A\u0642\u064A. \u0639\u0631\u0642 \u062D\u0642\u064A\u0642\u064A.",
    clips: [
      { label: "\u0645\u0631\u0627\u062C\u0639\u0629 \u0641\u0648\u0631\u0645", duration: "\u0660:\u0664\u0662" },
      { label: "PR \u0639\u0645\u064A\u0644", duration: "\u0660:\u0662\u0668" },
      { label: "\u062A\u062D\u0636\u064A\u0631 \u0648\u062C\u0628\u0627\u062A", duration: "\u0661:\u0661\u0665" },
      { label: "\u064A\u0648\u0645 \u062A\u0642\u062F\u0645", duration: "\u0660:\u0665\u0665" },
    ],
  },
};

export function VideoSection({ locale }: VideoSectionProps) {
  const loc = locale === "ar" ? "ar" : "en";
  const content = CONTENT[loc];

  return (
    <section className="relative bg-surface py-28 sm:py-36 snap-section" id="videos">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="font-mono text-accent text-sm uppercase tracking-[0.2em] block mb-3">
            {content.tag}
          </span>
          <h2 className="font-display text-text-1 text-5xl sm:text-6xl lg:text-7xl uppercase tracking-tight">
            {content.headline}
          </h2>
          <p className="mt-4 text-text-2 text-lg font-body">{content.subtitle}</p>
        </motion.div>

        {/* Video grid - asymmetric */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {content.clips.map((clip, i) => (
            <motion.div
              key={i}
              variants={slideUp}
              className={`group relative overflow-hidden rounded-2xl bg-bg border border-border ${
                i === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <div className={`${i === 0 ? "aspect-square" : "aspect-[4/5]"} relative`}>
                {/* Placeholder gradient simulating video thumbnail */}
                <div className="absolute inset-0 bg-gradient-to-br from-surface-high to-bg" />

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex size-16 items-center justify-center rounded-full bg-accent/90 text-bg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6,3 20,12 6,21" />
                    </svg>
                  </div>
                </div>

                {/* Label + duration */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-bg/80 to-transparent">
                  <p className="text-text-1 font-body text-sm font-medium">{clip.label}</p>
                  <p className="text-text-3 font-mono text-xs mt-0.5">{clip.duration}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
