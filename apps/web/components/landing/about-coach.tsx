"use client";

import { motion, type Variants } from "framer-motion";
import { Parallax } from "@/components/motion/parallax";

type AboutCoachProps = {
  locale: string;
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const STATS = {
  en: [
    { value: "8+", label: "Years coaching" },
    { value: "2,437", label: "Clients trained" },
    { value: "15K+", label: "Programs written" },
  ],
  ar: [
    { value: "+٨", label: "\u0633\u0646\u0648\u0627\u062A \u062A\u062F\u0631\u064A\u0628" },
    { value: "\u0662\u066C\u0664\u0663\u0667", label: "\u0639\u0645\u064A\u0644 \u0627\u062A\u062F\u0631\u0628" },
    { value: "+\u0661\u0665\u0643", label: "\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u062A\u0643\u062A\u0628" },
  ],
};

const STORY = {
  en: {
    tag: "MEET YOUR COACH",
    headline: "I\u2019M OSAMA.",
    subtitle: "And I don\u2019t believe in one-size-fits-all.",
    p1: "I started coaching because I was tired of seeing people follow cookie-cutter programs that don\u2019t work. Every body is different. Every goal is personal. Every journey has its own pace.",
    p2: "My approach is simple: I learn YOUR body, YOUR schedule, YOUR food preferences \u2014 then I build a system that fits into YOUR life. Not the other way around.",
    p3: "I reply to every message personally. I check every check-in. I adjust your plan when life changes. Because that\u2019s what real coaching is.",
  },
  ar: {
    tag: "\u0627\u0639\u0631\u0641 \u0645\u062F\u0631\u0628\u0643",
    headline: "\u0623\u0646\u0627 \u0623\u0633\u0627\u0645\u0629.",
    subtitle: "\u0648\u0645\u0634 \u0628\u0624\u0645\u0646 \u0628\u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u062C\u0627\u0647\u0632\u0629.",
    p1: "\u0628\u062F\u0623\u062A \u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0639\u0634\u0627\u0646 \u0632\u0647\u0642\u062A \u0645\u0646 \u0627\u0644\u0646\u0627\u0633 \u0627\u0644\u0644\u064A \u0628\u062A\u0645\u0634\u064A \u0639\u0644\u0649 \u0628\u0631\u0627\u0645\u062C \u0645\u0646\u0633\u0648\u062E\u0629 \u0645\u0634 \u0628\u062A\u062C\u064A\u0628 \u0646\u062A\u064A\u062C\u0629. \u0643\u0644 \u062C\u0633\u0645 \u0645\u062E\u062A\u0644\u0641. \u0643\u0644 \u0647\u062F\u0641 \u0634\u062E\u0635\u064A. \u0643\u0644 \u0631\u062D\u0644\u0629 \u0644\u064A\u0647\u0627 \u0633\u0631\u0639\u062A\u0647\u0627.",
    p2: "\u0623\u0633\u0644\u0648\u0628\u064A \u0628\u0633\u064A\u0637: \u0628\u0641\u0647\u0645 \u062C\u0633\u0645\u0643\u060C \u062C\u062F\u0648\u0644\u0643\u060C \u0623\u0643\u0644\u0643 \u0627\u0644\u0645\u0641\u0636\u0644 \u2014 \u0648\u0628\u0639\u062F\u064A\u0646 \u0628\u0628\u0646\u064A \u0646\u0638\u0627\u0645 \u064A\u062A\u0645\u0627\u0634\u0649 \u0645\u0639 \u062D\u064A\u0627\u062A\u0643. \u0645\u0634 \u0627\u0644\u0639\u0643\u0633.",
    p3: "\u0628\u0631\u062F \u0639\u0644\u0649 \u0643\u0644 \u0631\u0633\u0627\u0644\u0629 \u0628\u0646\u0641\u0633\u064A. \u0628\u062A\u0627\u0628\u0639 \u0643\u0644 check-in. \u0628\u0639\u062F\u0644 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0644\u0645\u0627 \u0627\u0644\u0638\u0631\u0648\u0641 \u062A\u062A\u063A\u064A\u0631. \u0639\u0634\u0627\u0646 \u062F\u0647 \u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u062D\u0642\u064A\u0642\u064A.",
  },
};

export function AboutCoach({ locale }: AboutCoachProps) {
  const loc = locale === "ar" ? "ar" : "en";
  const story = STORY[loc];
  const stats = STATS[loc];

  return (
    <section className="relative bg-bg py-28 sm:py-36 overflow-hidden snap-section" id="coach">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          {/* Left - image placeholder with parallax */}
          <Parallax speed={0.12}>
            <motion.div
              className="relative aspect-[4/5] rounded-3xl bg-gradient-to-br from-surface to-surface-high border border-border overflow-hidden"
              variants={slideLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 flex items-end p-8">
                <div className="glass rounded-xl px-6 py-4">
                  <p className="font-display text-accent text-2xl uppercase">COACH OSAMA</p>
                  <p className="text-text-2 text-sm font-mono mt-1">
                    {loc === "ar" ? "\u0645\u062F\u0631\u0628 \u0634\u062E\u0635\u064A \u0645\u0639\u062A\u0645\u062F" : "Certified Personal Trainer"}
                  </p>
                </div>
              </div>
            </motion.div>
          </Parallax>

          {/* Right - storytelling text */}
          <motion.div
            className="space-y-8"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp}>
              <span className="font-mono text-accent text-sm uppercase tracking-[0.2em] block mb-4">
                {story.tag}
              </span>
              <h2 className="font-display text-text-1 text-6xl sm:text-7xl lg:text-8xl uppercase tracking-tight leading-[0.9]">
                {story.headline}
              </h2>
              <p className="mt-3 font-body text-text-2 text-xl italic">
                {story.subtitle}
              </p>
            </motion.div>

            <motion.p className="text-text-1 text-base leading-relaxed font-body" variants={fadeUp}>
              {story.p1}
            </motion.p>

            <motion.p className="text-text-2 text-base leading-relaxed font-body" variants={fadeUp}>
              {story.p2}
            </motion.p>

            <motion.p className="text-text-2 text-base leading-relaxed font-body border-s-2 border-accent ps-4" variants={fadeUp}>
              {story.p3}
            </motion.p>

            {/* Stats row */}
            <motion.div className="flex gap-8 pt-4" variants={fadeUp}>
              {stats.map((stat, i) => (
                <div key={i}>
                  <p className="font-display text-accent text-3xl sm:text-4xl uppercase">{stat.value}</p>
                  <p className="text-text-3 text-xs font-mono mt-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
