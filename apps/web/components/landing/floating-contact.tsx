"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Locale } from "@/types/cms";

type Props = {
  locale: Locale;
  /** Phone number in E.164 minus the `+` sign (e.g. `201234567890`). */
  phone?: string;
};

/**
 * Persistent contact pill anchored to the bottom-end of the viewport.
 * Hidden for the first 3 seconds so it doesn't compete with the hero
 * fold; collapses to an icon below the `sm` breakpoint to avoid eating
 * mobile screen real-estate; expands on hover for desktop visitors.
 *
 * `phone` defaults to a placeholder you'll want to override at deploy
 * time. We deliberately avoid sourcing the number from `window.location`
 * or any user-controlled state — it's a constant for the page.
 */
export function FloatingContact({ locale, phone = "201000000000" }: Props) {
  const t = useTranslations("landing.contact");
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 3000);
    return () => window.clearTimeout(id);
  }, []);

  const message = encodeURIComponent(
    locale === "ar"
      ? "السلام عليكم، عايز أعرف أكثر عن البرنامج"
      : "Hi! I'd like to know more about the program.",
  );
  const href = `https://wa.me/${phone}?text=${message}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          key="floating-contact"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("floating")}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="fixed bottom-5 end-5 z-40 inline-flex items-center gap-3 rounded-full border border-accent/40 bg-accent px-4 py-3 font-medium text-bg text-sm shadow-[0_18px_40px_-12px_rgba(200,241,53,0.55)] transition-transform duration-200 hover:scale-[1.04] sm:bottom-6 sm:end-6"
        >
          <WhatsAppIcon />
          <span className={hover ? "inline" : "hidden sm:inline"}>
            {t("floating")}
          </span>
          <span className="font-mono text-bg/70 text-[10px] uppercase tracking-widest hidden lg:inline">
            24/7
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.76.46 3.41 1.27 4.84L2 22l5.32-1.39A9.94 9.94 0 0012.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.18a8.15 8.15 0 01-4.16-1.14l-.3-.18-3.16.83.84-3.08-.2-.32A8.18 8.18 0 013.86 12c0-4.51 3.67-8.18 8.18-8.18 4.51 0 8.18 3.67 8.18 8.18 0 4.51-3.67 8.18-8.18 8.18zm4.49-6.13c-.25-.13-1.46-.72-1.68-.8-.22-.08-.39-.13-.55.13-.16.25-.63.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42l-.47-.01c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.41 1.01 2.57.12.16 1.74 2.66 4.22 3.73.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.47-.29z" />
    </svg>
  );
}
