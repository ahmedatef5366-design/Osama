import { getLocale } from "next-intl/server";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Pricing } from "@/components/landing/pricing";
import { Studio } from "@/components/landing/studio";
import { Testimonials } from "@/components/landing/testimonials";
import { Transformations } from "@/components/landing/transformations";
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

  return (
    <>
      <Hero content={hero} locale={locale} />
      <Studio locale={locale} />
      <Features content={features} locale={locale} />
      <Transformations content={transformations} locale={locale} />
      <Testimonials content={testimonials} locale={locale} />
      <Pricing content={pricing} locale={locale} />
      <Faq content={faq} locale={locale} />
      <Footer content={footer} locale={locale} />
    </>
  );
}
