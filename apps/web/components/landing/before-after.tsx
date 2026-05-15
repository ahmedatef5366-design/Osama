"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { BeforeAfterContent } from "@/types/cms";

type BeforeAfterProps = {
  content: BeforeAfterContent;
  locale: string;
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/**
 * Drag-to-reveal before/after comparison. Each item renders an interactive
 * slider; we use a single ref-backed value rather than React state for the
 * pointer position to avoid re-rendering on every move.
 */
export function BeforeAfter({ content, locale }: BeforeAfterProps) {
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="bg-bg py-24 sm:py-32" id="before-after">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-12 sm:mb-16"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <h2 className="font-display text-text-1 text-4xl sm:text-5xl font-extrabold">
            {t(content.title, loc)}
          </h2>
          {content.subtitle ? (
            <p className="mt-3 max-w-xl text-text-2 text-lg">{t(content.subtitle, loc)}</p>
          ) : null}
        </motion.div>

        <ul className="grid gap-6 sm:gap-8 md:grid-cols-2">
          {content.items.map((item, i) => (
            <li key={i}>
              <article className="space-y-4 rounded-2xl border border-border bg-surface p-4">
                <BeforeAfterFrame
                  beforeImg={item.beforeImg}
                  afterImg={item.afterImg}
                  alt={item.clientName ?? `before-after-${i}`}
                  locale={loc}
                />
                <div className="flex items-center justify-between px-1">
                  <div>
                    {item.clientName ? (
                      <p className="font-display text-text-1 text-lg">{item.clientName}</p>
                    ) : null}
                    {item.caption ? (
                      <p className="text-text-2 text-sm">{t(item.caption, loc)}</p>
                    ) : null}
                  </div>
                  {typeof item.weeks === "number" ? (
                    <span className="font-mono text-accent text-sm tabular-nums">
                      {item.weeks}w
                    </span>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type FrameProps = {
  beforeImg: string;
  afterImg: string;
  alt: string;
  locale: "ar" | "en";
};

function BeforeAfterFrame({ beforeImg, afterImg, alt, locale }: FrameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [percent, setPercent] = useState(50);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const next = (x / rect.width) * 100;
    setPercent(next);
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      updateFromClientX(e.clientX);
    }
    function onUp() {
      draggingRef.current = false;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [updateFromClientX]);

  function onPointerDown(e: React.PointerEvent) {
    draggingRef.current = true;
    updateFromClientX(e.clientX);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      setPercent((p) => Math.max(0, p - 4));
    } else if (e.key === "ArrowRight") {
      setPercent((p) => Math.min(100, p + 4));
    }
  }

  const beforeLabel = locale === "ar" ? "قبل" : "Before";
  const afterLabel = locale === "ar" ? "بعد" : "After";

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onKeyDown={onKey}
      role="slider"
      aria-label={`${alt} before/after`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      tabIndex={0}
      className="relative aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden rounded-lg bg-surface-high"
    >
      <Image
        src={afterImg}
        alt={`${alt} after`}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover"
        priority={false}
      />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${percent}%` }}
      >
        <div className="relative h-full w-full">
          <Image
            src={beforeImg}
            alt={`${alt} before`}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="h-full w-full object-cover"
            priority={false}
          />
        </div>
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-bg/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-text-1 backdrop-blur">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-accent/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-bg">
        {afterLabel}
      </span>

      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-accent shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
        style={{ left: `${percent}%` }}
      />
      <div
        className="pointer-events-none absolute top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-accent bg-bg/90 shadow-lg"
        style={{ left: `${percent}%` }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="text-accent"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="9 6 3 12 9 18" />
          <polyline points="15 6 21 12 15 18" />
        </svg>
      </div>
    </div>
  );
}
