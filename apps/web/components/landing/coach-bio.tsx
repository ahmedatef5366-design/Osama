"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { coachEditorial } from "@/lib/imagery";
import { StatsCounter } from "./stats-counter";
import type { Locale } from "@/types/cms";

/**
 * Splits a localised stat string like `+2,000`, `98%`, or `+٢٬٠٠٠` into a
 * numeric value and surrounding non-digit characters so we can feed the
 * digits into `<StatsCounter />`. We treat Arabic-Indic digits the same
 * as ASCII digits via `Number()` after normalising. If parsing fails we
 * fall back to the raw string and skip the counter entirely.
 */
function splitStat(value: string): { prefix: string; to: number; suffix: string } | null {
  const normalised = value.replace(/[\u0660-\u0669]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30),
  );
  const match = normalised.match(/^(\D*?)([\d,٬\.]+)(\D*)$/);
  if (!match || !match[2]) return null;
  const digits = match[2].replace(/[,٬\.]/g, "");
  const to = Number(digits);
  if (!Number.isFinite(to)) return null;
  return { prefix: match[1] ?? "", to, suffix: match[3] ?? "" };
}

type Props = {
  locale: Locale;
};

const CREDENTIAL_KEYS = ["1", "2", "3", "4"] as const;
const STAT_PAIRS = [
  { value: "clientsValue", label: "clientsLabel" },
  { value: "yearsValue", label: "yearsLabel" },
  { value: "continentsValue", label: "continentsLabel" },
  { value: "satisfactionValue", label: "satisfactionLabel" },
] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const slideIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

/**
 * "Who is Osama" section — the credentials + bio block that's required
 * for a serious coaching site. Two-column layout on desktop (photo +
 * editorial), stacks on mobile. Keeps the no-women constraint by using
 * the already-verified `coachEditorial` asset.
 */
export function CoachBio({ locale }: Props) {
  const t = useTranslations("landing.coach");

  return (
    <section className="relative bg-bg py-16 sm:py-24 md:py-32" id="coach">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:gap-12 sm:px-6 md:grid-cols-[5fr_6fr] md:items-center md:gap-16">
        <motion.div
          variants={slideIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface-high">
            <Image
              src={coachEditorial.src}
              alt={coachEditorial.alt[locale]}
              fill
              sizes="(min-width: 768px) 42vw, 100vw"
              className="object-cover [filter:grayscale(20%)_contrast(1.08)_brightness(0.75)]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-bg/70 via-transparent to-transparent" />
            <div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-25"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              }}
            />
            <div className="absolute bottom-4 start-4 flex items-center gap-2 font-mono text-text-3 text-[10px] uppercase tracking-widest">
              <span className="h-1 w-1 rounded-full bg-accent" />
              {locale === "ar" ? "صورة حقيقية" : "real photograph"}
            </div>
          </div>

          <motion.figure
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative -mt-12 ms-6 me-10 rounded-xl border border-border bg-surface-high p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] sm:-mt-16 sm:p-7"
          >
            <span aria-hidden className="absolute -top-3 start-6 font-display text-accent text-5xl leading-none">
              &ldquo;
            </span>
            <blockquote className="font-display text-text-1 text-lg sm:text-xl leading-snug">
              {t("quote")}
            </blockquote>
            <figcaption className="mt-4 font-mono text-text-3 text-[11px] uppercase tracking-widest">
              {locale === "ar" ? "— أسامة" : "— Osama"}
            </figcaption>
          </motion.figure>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="space-y-8"
        >
          <div>
            <span className="font-mono text-text-3 text-[11px] uppercase tracking-[0.32em]">
              {t("eyebrow")}
            </span>
            <h2 className="mt-3 font-display text-text-1 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.05]">
              {t("title")}
            </h2>
            <p className="mt-5 max-w-xl text-text-2 text-base sm:text-lg leading-relaxed">
              {t("bio")}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            {STAT_PAIRS.map((s) => {
              const raw = t(`stats.${s.value}`);
              const parsed = splitStat(raw);
              return (
                <div key={s.value} className="bg-bg p-4 sm:p-5">
                  <dt className="font-display text-accent text-2xl sm:text-3xl tabular-nums leading-none">
                    {parsed ? (
                      <StatsCounter
                        to={parsed.to}
                        prefix={parsed.prefix}
                        suffix={parsed.suffix}
                        locale={locale}
                      />
                    ) : (
                      raw
                    )}
                  </dt>
                  <dd className="mt-2 font-mono text-text-3 text-[10px] uppercase tracking-widest">
                    {t(`stats.${s.label}`)}
                  </dd>
                </div>
              );
            })}
          </dl>

          <ul className="space-y-3 text-sm sm:text-base">
            {CREDENTIAL_KEYS.map((k) => (
              <li key={k} className="flex items-start gap-3 text-text-2">
                <span aria-hidden className="mt-1 inline-block h-2 w-2 shrink-0 rotate-45 bg-accent" />
                <span>{t(`credentials.${k}`)}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
