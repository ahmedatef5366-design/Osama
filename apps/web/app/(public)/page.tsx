import { getLocale } from "next-intl/server";
import { CoachBio } from "@/components/landing/coach-bio";
import { Comparison } from "@/components/landing/comparison";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FloatingContact } from "@/components/landing/floating-contact";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { MacroCalculator } from "@/components/landing/macro-calculator";
import { Methodology } from "@/components/landing/methodology";
import { Pricing } from "@/components/landing/pricing";
import { SiteNav } from "@/components/landing/site-nav";
import { Studio } from "@/components/landing/studio";
import { Testimonials } from "@/components/landing/testimonials";
import { Transformations } from "@/components/landing/transformations";
import { TrustBar } from "@/components/landing/trust-bar";
import type { Locale } from "@/types/cms";
import { getSection } from "@/lib/cms";

/**
 * Landing page. Every section is CMS-driven and individually skippable
 * (via `visible: false` on the section payload). The render order is
 * intentional and not data-controlled — surfacing CMS-driven reordering
 * adds complexity we don't need yet.
 */
export default async function LandingPage() {
  const [locale, hero, features, transformations, testimonials, pricing, faq, footer] =
    await Promise.all([
      getLocale(),
      getSection("hero"),
      getSection("features"),
      getSection("transformations"),
      getSection("testimonials"),
      getSection("pricing"),
      getSection("faq"),
      getSection("footer"),
    ]);

  const loc = (locale === "en" ? "en" : "ar") as Locale;

  return (
    <>
      <SiteNav locale={loc} />
      <Hero content={hero} locale={locale} />
      <TrustBar locale={loc} />
      <CoachBio locale={loc} />
      <Studio locale={locale} />
      <Methodology locale={loc} />
      <Features content={features} locale={locale} />
      <Comparison locale={loc} />
      <Transformations content={transformations} locale={locale} />
      <Testimonials content={testimonials} locale={locale} />
      <MacroCalculator locale={loc} />
      <Pricing content={pricing} locale={locale} />
      <Faq content={faq} locale={locale} />
      <CtaBanner />
      <Footer content={footer} locale={locale} />
      <FloatingContact locale={loc} />
    </>
  );
}
