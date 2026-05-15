"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { CustomerActivityContent } from "@/types/cms";

type CustomerActivityProps = {
  content: CustomerActivityContent;
  locale: string;
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/**
 * Rotates through CMS-managed activity rows on a 4-second loop. Each row
 * is faux-live ("Ahmed just renewed for 3 months") for social proof. We
 * never expose real billing data here.
 */
export function CustomerActivity({ content, locale }: CustomerActivityProps) {
  const loc = asLocale(locale);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!content.visible || content.items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % content.items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [content.visible, content.items.length]);

  if (!content.visible || content.items.length === 0) return null;
  const active = content.items[index] ?? content.items[0];
  if (!active) return null;

  return (
    <section className="bg-surface py-16 sm:py-24 md:py-32" id="customer-activity">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          className="mb-10"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <h2 className="font-display text-text-1 text-3xl sm:text-4xl md:text-5xl font-extrabold">
            {t(content.title, loc)}
          </h2>
          {content.subtitle ? (
            <p className="mt-3 max-w-xl text-text-2 text-base sm:text-lg">{t(content.subtitle, loc)}</p>
          ) : null}
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-stretch">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-bg p-5 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4"
              >
                <Avatar
                  name={active.name}
                  src={active.avatarUrl}
                  className="h-12 w-12 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate font-display text-text-1 text-lg">{active.name}</p>
                    {active.location ? (
                      <span className="truncate text-text-3 text-sm">
                        {t(active.location, loc)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-text-2 text-sm">{t(active.action, loc)}</p>
                </div>
                <span className="shrink-0 font-mono text-text-3 text-[11px] uppercase tracking-[0.18em]">
                  {active.timeAgo ? t(active.timeAgo, loc) : ""}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 sm:flex-col sm:justify-center sm:px-6">
            <PulseDot />
            <span className="font-mono text-accent text-[11px] uppercase tracking-[0.22em]">
              {loc === "ar" ? "مباشر الآن" : "Live now"}
            </span>
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item, i) => (
            <li
              key={i}
              className={
                "flex h-2 flex-1 rounded-full transition-colors " +
                (i === index ? "bg-accent" : "bg-border")
              }
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={
        "relative grid place-items-center overflow-hidden rounded-full bg-surface-high text-text-2 " +
        (className ?? "")
      }
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="font-mono text-sm">{initials || "?"}</span>
      )}
    </div>
  );
}

function PulseDot() {
  return (
    <span className="relative inline-flex h-3 w-3 shrink-0" aria-hidden>
      <span className="absolute inset-0 animate-ping rounded-full bg-accent/60" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
    </span>
  );
}
