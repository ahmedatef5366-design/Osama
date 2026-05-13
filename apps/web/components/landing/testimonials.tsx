import { t, asLocale } from "@/lib/i18n-helpers";
import type { TestimonialsContent } from "@/types/cms";

type TestimonialsProps = {
  content: TestimonialsContent;
  locale: string;
};

/**
 * 2-up masonry-ish layout (`columns-1 sm:columns-2`) so quotes of varying
 * length tile without leaving the awkward white gaps a CSS grid would.
 * Each card is purely typographic — no avatars by default, no card chrome,
 * just letterforms doing the work.
 */
export function Testimonials({ content, locale }: TestimonialsProps) {
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="bg-bg py-24 sm:py-32" id="testimonials">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-12 font-display text-text-1 text-4xl sm:text-5xl font-extrabold sm:mb-16">
          {t(content.title, loc)}
        </h2>

        <div className="columns-1 gap-8 sm:columns-2">
          {content.items.map((item, i) => (
            <figure
              key={i}
              className="mb-8 break-inside-avoid border-s-2 border-accent ps-6"
            >
              <blockquote className="font-display text-text-1 text-xl sm:text-2xl leading-snug">
                “{t(item.quote, loc)}”
              </blockquote>
              <figcaption className="mt-4 flex items-center justify-between text-sm">
                <span className="text-text-1 font-medium">
                  {item.name}
                  {typeof item.age === "number" ? <span className="text-text-3"> · {item.age}</span> : null}
                </span>
                {item.transformation ? (
                  <span className="font-mono text-accent text-xs uppercase tracking-widest">
                    {t(item.transformation, loc)}
                  </span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
