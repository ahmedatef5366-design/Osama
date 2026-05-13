import { t, asLocale } from "@/lib/i18n-helpers";
import type { FeaturesContent } from "@/types/cms";

type FeaturesProps = {
  content: FeaturesContent;
  locale: string;
};

/**
 * Numbered horizontal-rule feature list. Not a card grid — the spec is
 * explicit about that. Each row gets a "ghost number" sitting behind it
 * in the background at 4% opacity, an oversized presence cue without
 * stealing the eye.
 */
export function Features({ content, locale }: FeaturesProps) {
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="bg-bg py-24 sm:py-32" id="features">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="font-display text-text-1 text-4xl sm:text-5xl font-extrabold mb-16">
          {t(content.title, loc)}
        </h2>

        <ul className="space-y-0">
          {content.items.map((item, i) => (
            <li
              key={i}
              className="group relative border-t border-border last:border-b py-8 sm:py-10"
            >
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-baseline gap-6 sm:gap-10">
                  <span className="font-mono text-text-2 text-sm tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-text-1 text-2xl sm:text-3xl transition-colors duration-300 group-hover:text-accent">
                    {t(item.title, loc)}
                  </span>
                </div>
                {item.description ? (
                  <p className="ms-[3.4rem] sm:ms-[4.8rem] max-w-2xl text-text-2 text-sm sm:text-base">
                    {t(item.description, loc)}
                  </p>
                ) : null}
              </div>
              <span
                aria-hidden
                className="ghost-num absolute end-0 -top-4 sm:-top-8 leading-none"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
