"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { BannerContent } from "@/types/cms";

type PromoBannerProps = {
  content: BannerContent;
  locale: string;
};

/**
 * Full-width promo section. Two visual tones:
 *  - "accent" — bright accent-green CTA card (high contrast).
 *  - "surface" — muted surface card that blends with adjacent sections.
 *
 * Renders a left-aligned text block; an optional image fills the right
 * half on desktop (stacks above on mobile).
 */
export function PromoBanner({ content, locale }: PromoBannerProps) {
  if (!content.visible) return null;
  const loc = asLocale(locale);
  const title = t(content.title, loc);
  if (!title) return null;

  const tone = content.tone === "surface" ? "surface" : "accent";
  const eyebrow = content.eyebrow ? t(content.eyebrow, loc) : "";
  const description = content.description ? t(content.description, loc) : "";
  const ctaText = content.ctaText ? t(content.ctaText, loc) : "";

  const isAccent = tone === "accent";

  return (
    <section className="bg-bg py-24 sm:py-32" id="promo-banner">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className={
            "relative overflow-hidden rounded-3xl border " +
            (isAccent
              ? "border-accent/30 bg-gradient-to-br from-accent/15 via-surface-high to-surface"
              : "border-border bg-surface")
          }
        >
          <div className="grid items-stretch gap-0 sm:grid-cols-2">
            <div className="flex flex-col justify-center gap-5 p-8 sm:p-12">
              {eyebrow ? (
                <span className="font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]">
                  {eyebrow}
                </span>
              ) : null}
              <h2 className="font-display text-text-1 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.05]">
                {title}
              </h2>
              {description ? (
                <p className="max-w-xl text-text-2 text-base sm:text-lg">{description}</p>
              ) : null}
              {content.ctaUrl && ctaText ? (
                <div className="mt-2">
                  <Link
                    href={content.ctaUrl}
                    className={
                      "group inline-flex items-center gap-3 rounded-full px-6 py-3 font-medium transition-transform duration-200 hover:scale-[1.03] " +
                      (isAccent
                        ? "bg-accent text-bg shadow-[0_10px_40px_-12px_rgba(200,241,53,0.6)]"
                        : "bg-text-1 text-bg")
                    }
                  >
                    <span>{ctaText}</span>
                    <Arrow />
                  </Link>
                </div>
              ) : null}
            </div>
            <div className="relative min-h-[220px] sm:min-h-[320px]">
              {content.imageUrl ? (
                <Image
                  src={content.imageUrl}
                  alt={title}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,241,53,0.18),transparent_60%)]"
                />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
