import Link from "next/link";
import { Button } from "@/components/ui/button";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { HeroContent } from "@/types/cms";

type HeroProps = {
  content: HeroContent;
  locale: string;
};

/**
 * The landing hero. Asymmetric grid: oversized headline on the lead side,
 * frosted metric cards drifting on the other. Background is a CSS-only
 * animated mesh — zero JS, zero images required for the first paint.
 *
 * Content is CMS-driven; the in-source defaults guarantee a render even
 * when the API is unreachable.
 */
export function Hero({ content, locale }: HeroProps) {
  if (!content.visible) return null;
  const loc = asLocale(locale);

  return (
    <section className="relative isolate overflow-hidden bg-mesh">
      <div className="mx-auto grid min-h-[88vh] max-w-7xl gap-12 px-6 py-24 sm:py-32 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div className="space-y-8">
          <h1 className="font-display font-extrabold leading-[0.95] text-text-1 text-6xl sm:text-7xl md:text-8xl">
            <span className="block animate-fade-up" style={{ animationDelay: "100ms", opacity: 0 }}>
              {t(content.headlineL1, loc)}
            </span>
            <span
              className="block bg-gradient-to-l from-accent to-accent-text bg-clip-text text-transparent animate-fade-up"
              style={{ animationDelay: "300ms", opacity: 0 }}
            >
              {t(content.headlineL2, loc)}
            </span>
          </h1>

          <p
            className="max-w-md text-text-2 text-lg sm:text-xl animate-fade-up"
            style={{ animationDelay: "500ms", opacity: 0 }}
          >
            {t(content.subheadline, loc)}
          </p>

          <div className="animate-fade-up" style={{ animationDelay: "700ms", opacity: 0 }}>
            <Link href={content.ctaUrl || "/login"}>
              <Button size="lg">{t(content.ctaText, loc)}</Button>
            </Link>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-surface to-surface-high border border-border" />

          {content.metrics.slice(0, 3).map((m, i) => (
            <FloatingMetric
              key={i}
              className={floatingClasses(i)}
              style={{ animationDelay: `${i * 1.5}s` }}
              value={t(m.value, loc)}
              label={t(m.label, loc)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type FloatingMetricProps = {
  value: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
};

function FloatingMetric({ value, label, className, style }: FloatingMetricProps) {
  return (
    <div
      className={`glass rounded-md px-4 py-3 text-text-1 ${className ?? ""}`}
      style={style}
    >
      <div className="text-sm font-medium">{value}</div>
      {label ? <div className="text-text-2 text-xs">{label}</div> : null}
    </div>
  );
}

function floatingClasses(i: number): string {
  // i=0 → top-start, 1 → middle-end, 2 → bottom-start. Logical properties so
  // RTL flips naturally.
  switch (i) {
    case 0:
      return "absolute -start-8 top-8 animate-float";
    case 1:
      return "absolute -end-6 top-1/3 animate-float";
    case 2:
    default:
      return "absolute -start-4 bottom-12 animate-float";
  }
}
