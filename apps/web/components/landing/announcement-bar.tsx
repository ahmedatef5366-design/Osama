"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { t, asLocale } from "@/lib/i18n-helpers";
import type { AnnouncementContent } from "@/types/cms";

type AnnouncementBarProps = {
  content: AnnouncementContent;
  locale: string;
};

/**
 * Stores the dismiss state in localStorage so visitors who close the bar
 * don't see it again on the same browser. A change to the message (e.g.
 * the coach edits it in the CMS) resets the dismissal because the key is
 * derived from the message text itself.
 */
function dismissKey(message: string) {
  return `osama:announcement-dismissed:${hash(message)}`;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

export function AnnouncementBar({ content, locale }: AnnouncementBarProps) {
  const loc = asLocale(locale);
  const message = t(content.message, loc);
  const ctaText = content.ctaText ? t(content.ctaText, loc) : "";
  const dismissible = content.dismissible !== false;

  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!dismissible) return;
    try {
      if (localStorage.getItem(dismissKey(message)) === "1") {
        setOpen(false);
      }
    } catch {
      // localStorage can throw in privacy modes — fall back to showing.
    }
  }, [message, dismissible]);

  function onDismiss() {
    setOpen(false);
    try {
      localStorage.setItem(dismissKey(message), "1");
    } catch {
      // ignore
    }
  }

  if (!content.visible || !message) return null;

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.aside
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="region"
          aria-label={message}
          className="relative z-50 overflow-hidden border-b border-accent/40 bg-accent text-bg"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm sm:px-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] opacity-70">
              {loc === "ar" ? "إعلان" : "Notice"}
            </span>
            <p className="min-w-0 flex-1 truncate font-medium">{message}</p>
            {content.ctaUrl && ctaText ? (
              <Link
                href={content.ctaUrl}
                className="hidden shrink-0 rounded-full bg-bg px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-accent transition-opacity hover:opacity-90 sm:inline-block"
              >
                {ctaText}
              </Link>
            ) : null}
            {dismissible ? (
              <button
                type="button"
                onClick={onDismiss}
                aria-label={loc === "ar" ? "إغلاق الإعلان" : "Dismiss announcement"}
                className="shrink-0 rounded-full p-1 text-bg/70 transition-colors hover:bg-bg/10 hover:text-bg"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : null}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
