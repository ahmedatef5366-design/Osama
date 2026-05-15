"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { studioWide } from "@/lib/imagery";
import { asLocale } from "@/lib/i18n-helpers";

type StudioProps = {
  locale: string;
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

/**
 * Wide editorial band that sits between the hero and the features
 * sections. The point isn't to sell anything — it's to give the eye a
 * pause-and-breathe moment with a real photograph after the dense hero
 * and before the next text-heavy block.
 */
export function Studio({ locale }: StudioProps) {
  const loc = asLocale(locale);

  return (
    <section className="relative bg-bg">
      <motion.div
        className="relative mx-auto aspect-[3/1] max-w-7xl overflow-hidden border-y border-border"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <Image
          src={studioWide.src}
          alt={studioWide.alt[loc]}
          fill
          sizes="100vw"
          className="object-cover [filter:grayscale(20%)_brightness(0.65)]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-4 sm:p-10 md:p-14">
          <div className="flex items-center gap-3 font-mono text-text-3 text-xs uppercase tracking-[0.25em]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>{loc === "ar" ? "الاستوديو" : "studio"}</span>
            <span className="h-px w-8 bg-border" />
            <span>{loc === "ar" ? "تدريب فردي" : "1-on-1 coaching"}</span>
          </div>

          <div className="max-w-xl space-y-3">
            <p className="font-display text-text-1 text-3xl sm:text-4xl md:text-5xl leading-[1.05]">
              {loc === "ar"
                ? "أجهزة، خطّة، ومتابعة — كله بإسم واحد عليه."
                : "The kit, the plan, the follow-up — under one coach."}
            </p>
            <p className="max-w-md text-text-2 text-sm sm:text-base">
              {loc === "ar"
                ? "كل عميل ليه ساعته. مفيش برنامج جاهز ومفيش رد آلي."
                : "Every client gets a dedicated slot. No copy-paste programs, no boilerplate replies."}
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
