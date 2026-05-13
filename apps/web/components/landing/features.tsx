import { useTranslations } from "next-intl";

/**
 * Numbered horizontal-rule feature list. Not a card grid — the spec is
 * explicit about that. Each row gets a "ghost number" sitting behind it
 * in the background at 4% opacity, an oversized presence cue without
 * stealing the eye.
 */
export function Features() {
  const t = useTranslations("landing.features");
  const items = ["1", "2", "3", "4", "5"] as const;

  return (
    <section className="bg-bg py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="font-display text-text-1 text-4xl sm:text-5xl font-extrabold mb-16">
          {t("title")}
        </h2>

        <ul className="space-y-0">
          {items.map((id, i) => (
            <li
              key={id}
              className="group relative border-t border-border last:border-b py-8 sm:py-10"
            >
              <div className="relative z-10 flex items-baseline gap-6 sm:gap-10">
                <span className="font-mono text-text-2 text-sm tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-text-1 text-2xl sm:text-3xl transition-colors duration-300 group-hover:text-accent">
                  {t(`items.${id}`)}
                </span>
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
