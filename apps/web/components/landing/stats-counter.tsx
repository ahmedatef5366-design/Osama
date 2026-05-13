"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useTransform, animate } from "framer-motion";
import type { Locale } from "@/types/cms";

type Props = {
  /** Final integer value to count up to. */
  to: number;
  /** Optional prefix (e.g. `+`). */
  prefix?: string;
  /** Optional suffix (e.g. `%`, `★`). */
  suffix?: string;
  /** Localised number formatting. */
  locale: Locale;
  /** Animation duration in seconds. */
  duration?: number;
  className?: string;
};

/**
 * Number that counts up from 0 to `to` once it enters the viewport. Used
 * inside hero/about strips. Uses framer-motion's `animate()` so the
 * tween eases in instead of ticking linearly. We render through a
 * locale-aware `toLocaleString` so 2,400 reads as "٢٬٤٠٠" in Arabic.
 */
export function StatsCounter({
  to,
  prefix = "",
  suffix = "",
  locale,
  duration = 1.4,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return () => unsubscribe();
  }, [rounded]);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, mv, to, duration]);

  const formatted = display.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
