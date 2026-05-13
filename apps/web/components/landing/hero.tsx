import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * The landing hero. Asymmetric grid: oversized headline on the lead side,
 * frosted metric cards drifting on the other. Background is a CSS-only
 * animated mesh — zero JS, zero images required for the first paint.
 */
export function Hero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative isolate overflow-hidden bg-mesh">
      <div className="mx-auto grid min-h-[88vh] max-w-7xl gap-12 px-6 py-24 sm:py-32 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div className="space-y-8">
          <h1 className="font-display font-extrabold leading-[0.95] text-text-1 text-6xl sm:text-7xl md:text-8xl">
            <span className="block animate-fade-up" style={{ animationDelay: "100ms", opacity: 0 }}>
              {t("headlineL1")}
            </span>
            <span
              className="block bg-gradient-to-l from-accent to-accent-text bg-clip-text text-transparent animate-fade-up"
              style={{ animationDelay: "300ms", opacity: 0 }}
            >
              {t("headlineL2")}
            </span>
          </h1>

          <p
            className="max-w-md text-text-2 text-lg sm:text-xl animate-fade-up"
            style={{ animationDelay: "500ms", opacity: 0 }}
          >
            {t("subheadline")}
          </p>

          <div className="animate-fade-up" style={{ animationDelay: "700ms", opacity: 0 }}>
            <Link href="/login">
              <Button size="lg">{t("cta")}</Button>
            </Link>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-surface to-surface-high border border-border" />

          <FloatingMetric
            className="absolute -start-8 top-8 animate-float"
            style={{ animationDelay: "0s" }}
            value={t("metrics.clients")}
          />
          <FloatingMetric
            className="absolute -end-6 top-1/3 animate-float"
            style={{ animationDelay: "1.5s" }}
            value={t("metrics.satisfaction")}
          />
          <FloatingMetric
            className="absolute -start-4 bottom-12 animate-float"
            style={{ animationDelay: "3s" }}
            value={t("metrics.rating")}
          />
        </div>
      </div>
    </section>
  );
}

type FloatingMetricProps = {
  value: string;
  className?: string;
  style?: React.CSSProperties;
};

function FloatingMetric({ value, className, style }: FloatingMetricProps) {
  return (
    <div
      className={`glass rounded-md px-4 py-3 text-text-1 text-sm font-medium ${className ?? ""}`}
      style={style}
    >
      {value}
    </div>
  );
}
