"use client";

import { useState } from "react";

type Props = {
  placeholder: string;
  cta: string;
};

/**
 * Minimal client-side newsletter signup. Phase 2 stores nothing — the email
 * is captured locally and the form just confirms receipt. A real /newsletter
 * endpoint lands when we wire Resend in Phase 5.
 */
export function NewsletterForm({ placeholder, cta }: Props) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const email = String(data.get("email") ?? "");
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          setStatus("err");
          return;
        }
        setStatus("ok");
      }}
      className="mt-4 flex items-center gap-2"
    >
      <input
        type="email"
        name="email"
        required
        placeholder={placeholder}
        className="h-10 flex-1 rounded-md border border-border bg-bg px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-border-hover"
        aria-label={placeholder}
      />
      <button
        type="submit"
        className="h-10 rounded-md bg-accent px-4 text-sm font-medium text-bg transition-shadow hover:shadow-[0_0_24px_4px_var(--accent-glow)]"
      >
        {cta}
      </button>
      {status === "ok" ? (
        <span role="status" className="text-xs text-success">
          ✓
        </span>
      ) : status === "err" ? (
        <span role="status" className="text-xs text-danger">
          !
        </span>
      ) : null}
    </form>
  );
}
