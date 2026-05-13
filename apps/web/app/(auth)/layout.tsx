import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { PageTransition } from "@/components/motion";
import { coachPortrait } from "@/lib/imagery";
import { asLocale } from "@/lib/i18n-helpers";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = asLocale(await getLocale());
  const t = await getTranslations({ locale, namespace: "login" });

  return (
    <main className="relative min-h-screen bg-bg">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
        {/* Left rail: brand image + atmosphere. Hidden on small screens
            so the form gets the whole viewport on mobile. */}
        <aside className="relative hidden overflow-hidden border-e border-border lg:block">
          <Image
            src={coachPortrait.src}
            alt={coachPortrait.alt[locale]}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 0vw"
            className="object-cover [filter:grayscale(20%)_contrast(1.05)_brightness(0.7)]"
          />
          {/* Top-to-bottom gradient grounds the white text on the photo. */}
          <div className="absolute inset-0 bg-gradient-to-tr from-bg via-bg/40 to-transparent" />
          <div
            className="absolute inset-0 opacity-25 mix-blend-soft-light"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            }}
          />

          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3 font-mono text-text-3 text-xs uppercase tracking-[0.25em]">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>OSAMA / COACH</span>
            </div>

            <div className="max-w-md space-y-4">
              <p className="font-display text-text-1 text-3xl xl:text-4xl leading-tight">
                {locale === "ar"
                  ? "بوابة العميل والمدرب — جلسة واحدة بتختصر أسبوع متابعة."
                  : "Coach + client portal — one session that replaces a week of follow-ups."}
              </p>
              <div className="flex items-center gap-3 text-text-3 text-xs font-mono uppercase tracking-widest">
                <span className="h-px w-10 bg-border" />
                <span>{t("subtitle")}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right column: form. Keeps the original page transition. */}
        <section className="relative flex items-center justify-center px-6 py-12 bg-mesh lg:bg-bg lg:px-12 lg:py-16">
          <PageTransition>{children}</PageTransition>
        </section>
      </div>
    </main>
  );
}
