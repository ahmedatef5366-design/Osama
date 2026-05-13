"use client";

import { useCallback } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { TransformationsContent } from "@/types/cms";

type TransformationsProps = {
  content: TransformationsContent;
  locale: string;
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export function Transformations({ content, locale }: TransformationsProps) {
  const loc = asLocale(locale);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", skipSnaps: false },
    [Autoplay({ delay: 4000, stopOnInteraction: true })],
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!content.visible || content.items.length === 0) return null;

  return (
    <section className="bg-surface py-24 sm:py-32" id="transformations">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-12 flex items-end justify-between sm:mb-16"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div>
            <h2 className="font-display text-text-1 text-4xl sm:text-5xl font-extrabold">
              {t(content.title, loc)}
            </h2>
            {content.subtitle ? (
              <p className="mt-3 max-w-xl text-text-2 text-lg">
                {t(content.subtitle, loc)}
              </p>
            ) : null}
          </div>
          <div className="hidden gap-2 sm:flex">
            <NavButton direction="prev" onClick={scrollPrev} />
            <NavButton direction="next" onClick={scrollNext} />
          </div>
        </motion.div>

        <div className="overflow-hidden" ref={emblaRef}>
          <motion.div
            className="flex gap-6 sm:gap-8"
            variants={listVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {content.items.map((item, i) => (
              <motion.div
                key={i}
                className="min-w-0 flex-[0_0_80%] sm:flex-[0_0_480px]"
                variants={cardVariants}
              >
                <article className="space-y-4 rounded-lg border border-border bg-bg p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Frame
                      label="before"
                      src={item.beforeImg}
                      alt={`${item.clientName ?? "client"} before`}
                    />
                    <Frame
                      label="after"
                      src={item.afterImg}
                      alt={`${item.clientName ?? "client"} after`}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {item.clientName ? (
                        <p className="font-display text-text-1 text-lg">
                          {item.clientName}
                        </p>
                      ) : null}
                      {item.summary ? (
                        <p className="text-text-2 text-sm">
                          {t(item.summary, loc)}
                        </p>
                      ) : null}
                    </div>
                    {typeof item.weeks === "number" ? (
                      <span className="font-mono text-accent text-sm tabular-nums">
                        {item.weeks}w
                      </span>
                    ) : null}
                  </div>
                </article>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function NavButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-2 transition-colors hover:border-accent hover:text-accent"
      aria-label={direction === "prev" ? "Previous" : "Next"}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d={
            direction === "prev"
              ? "M10 12L6 8L10 4"
              : "M6 4L10 8L6 12"
          }
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function Frame({
  src,
  alt,
  label,
}: {
  src?: string;
  alt: string;
  label: string;
}) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-surface-high">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(min-width: 640px) 240px, 50vw"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-text-3 text-xs uppercase tracking-widest">
          {label}
        </div>
      )}
    </div>
  );
}
