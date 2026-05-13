import Image from "next/image";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { TransformationsContent } from "@/types/cms";

type TransformationsProps = {
  content: TransformationsContent;
  locale: string;
};

/**
 * Horizontal scroll of before/after pairs. We use native CSS scroll-snap
 * so the carousel works without JS — the JS-driven swipe gestures are an
 * enhancement that can land in Phase 6.
 *
 * Renders nothing when there are no items, since an empty marquee on a
 * landing page reads as "broken".
 */
export function Transformations({ content, locale }: TransformationsProps) {
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="bg-surface py-24 sm:py-32" id="transformations">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 sm:mb-16">
          <h2 className="font-display text-text-1 text-4xl sm:text-5xl font-extrabold">
            {t(content.title, loc)}
          </h2>
          {content.subtitle ? (
            <p className="mt-3 max-w-xl text-text-2 text-lg">{t(content.subtitle, loc)}</p>
          ) : null}
        </div>

        <ul className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 sm:gap-8">
          {content.items.map((item, i) => (
            <li
              key={i}
              className="min-w-[80%] snap-start sm:min-w-[480px]"
            >
              <article className="space-y-4 rounded-lg border border-border bg-bg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Frame label="before" src={item.beforeImg} alt={`${item.clientName ?? "client"} before`} />
                  <Frame label="after"  src={item.afterImg}  alt={`${item.clientName ?? "client"} after`} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {item.clientName ? (
                      <p className="font-display text-text-1 text-lg">{item.clientName}</p>
                    ) : null}
                    {item.summary ? (
                      <p className="text-text-2 text-sm">{t(item.summary, loc)}</p>
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

function Frame({ src, alt, label }: { src?: string; alt: string; label: string }) {
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
