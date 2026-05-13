import { getLocale } from "next-intl/server";
import { AboutCoach } from "@/components/landing/about-coach";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { Transformations } from "@/components/landing/transformations";
import { VideoSection } from "@/components/landing/video-section";
import { getSection } from "@/lib/cms";

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
      <Features content={features} locale={locale} />
      <AboutCoach locale={locale} />
      <Transformations content={transformations} locale={locale} />
      <VideoSection locale={locale} />
      <Testimonials content={testimonials} locale={locale} />
      <Pricing content={pricing} locale={locale} />
      <Faq content={faq} locale={locale} />
      <Footer content={footer} locale={locale} />
    </>
  );
}
