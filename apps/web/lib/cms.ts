/**
 * Server-side helpers for reading and writing CMS sections.
 *
 * Reads:  cached with Next's revalidateTag, busted from /api/revalidate when
 *         the Go API mutates a section.
 * Writes: forwarded straight to the API (admin pages call the API client
 *         from the browser; we don't need a server-side write helper).
 *
 * Defaults: every section ships with a sensible default so a fresh DB can
 * render the landing page without any CMS rows. The defaults match the
 * shapes inserted by migration 0008_cms_seed.up.sql.
 */
import { unstable_cache as nextCache } from "next/cache";
import { cookies } from "next/headers";
import { CMS_TAG, fetchSectionInner } from "@/lib/cms-shared";
import {
  defaultAnnouncement,
  defaultBanner,
  defaultBeforeAfter,
  defaultCustomerActivity,
  defaultFaq,
  defaultFeaturedStories,
  defaultFeatures,
  defaultFooter,
  defaultHero,
  defaultPricing,
  defaultProcessSteps,
  defaultTestimonials,
  defaultTransformations,
  defaultValueProps,
} from "@/lib/cms-defaults";
import type { Section, SectionContent, SectionKey } from "@/types/cms";

export { CMS_TAG } from "@/lib/cms-shared";

const DEFAULTS: SectionContent = {
  announcement: defaultAnnouncement,
  hero: defaultHero,
  banner: defaultBanner,
  valueProps: defaultValueProps,
  features: defaultFeatures,
  transformations: defaultTransformations,
  beforeAfter: defaultBeforeAfter,
  featuredStories: defaultFeaturedStories,
  processSteps: defaultProcessSteps,
  testimonials: defaultTestimonials,
  customerActivity: defaultCustomerActivity,
  pricing: defaultPricing,
  faq: defaultFaq,
  footer: defaultFooter,
};

/**
 * Get a CMS section. Caches by (key) and is purged via revalidateTag(CMS_TAG)
 * whenever the Go API hits our /api/revalidate webhook.
 *
 * On any failure (API down, parse error, missing section), we fall back to
 * the in-source defaults so the landing page never breaks.
 */
export async function getSection<K extends SectionKey>(
  key: K,
): Promise<SectionContent[K]> {
  const fetcher = nextCache(
    async () => fetchSectionInner(key),
    ["cms", key],
    { tags: [CMS_TAG, `cms:${key}`], revalidate: 3600 },
  );
  const res = await fetcher();
  if (!res) {
    return DEFAULTS[key];
  }
  return res.content as SectionContent[K];
}

/**
 * Admin-side, NON-cached read used by the editor. Forwards cookies so the
 * API trusts the request. Use this only inside admin server components.
 */
export async function getSectionAdmin<K extends SectionKey>(
  key: K,
): Promise<Section<K> | null> {
  const cookieHeader = (await cookies())
    .getAll()
    .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
    .join("; ");
  const res = await fetchSectionInner(key, { cookie: cookieHeader });
  return res as Section<K> | null;
}
