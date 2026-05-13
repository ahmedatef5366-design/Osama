"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { FaqContent } from "@/types/cms";

type FaqProps = {
  content: FaqContent;
  locale: string;
};

/**
 * Accordion FAQ. Single-open mode: opening one closes the others, which is
 * how non-technical visitors expect a FAQ to behave. Built without an extra
 * Radix dep — a `<details>` would do, but we want full control over the
 * chevron animation and ARIA state so this is hand-rolled.
 */
export function Faq({ content, locale }: FaqProps) {
  const [open, setOpen] = useState<number | null>(0);
  if (!content.visible || content.items.length === 0) return null;
  const loc = asLocale(locale);

  return (
    <section className="bg-bg py-24 sm:py-32" id="faq">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-10 font-display text-text-1 text-4xl sm:text-5xl font-extrabold">
          {t(content.title, loc)}
        </h2>

        <ul className="space-y-3">
          {content.items.map((item, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <li key={i} className="border-b border-border">
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-start font-display text-text-1 text-lg sm:text-xl"
                  >
                    <span>{t(item.q, loc)}</span>
                    <span
                      aria-hidden
                      className={cn(
                        "size-6 shrink-0 text-text-2 transition-transform duration-300",
                        isOpen ? "rotate-180" : "rotate-0",
                      )}
                    >
                      <Chevron />
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="pb-5 text-text-2 text-base"
                >
                  {t(item.a, loc)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Chevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-full"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
