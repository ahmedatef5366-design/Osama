// CMS payload shapes. The Go API stores each section as opaque JSONB; the
// TypeScript types below are the contract between the editor and the
// rendered landing page. If you change the SHAPE here, also update:
//   • apps/api/migrations/0008_cms_seed.up.sql (the seed defaults)
//   • apps/web/app/admin/cms/* (the editor)
//   • the matching landing-page component that consumes it

export type SectionKey =
  | "announcement"
  | "hero"
  | "banner"
  | "valueProps"
  | "features"
  | "transformations"
  | "beforeAfter"
  | "featuredStories"
  | "processSteps"
  | "testimonials"
  | "customerActivity"
  | "pricing"
  | "faq"
  | "footer";

export type Locale = "ar" | "en";

/** A short string keyed by locale. */
export type Localized = Record<Locale, string>;

/** Wire envelope returned by the API for any section. */
export type SectionEnvelope<T> = {
  key: SectionKey;
  content: T;
  updatedBy?: string;
  updatedAt: string;
};

// ───────────────────────────────────────────────────────────────────────
// Section content shapes
// ───────────────────────────────────────────────────────────────────────

export type HeroContent = {
  visible: boolean;
  headlineL1: Localized;
  headlineL2: Localized;
  subheadline: Localized;
  ctaText: Localized;
  ctaUrl: string;
  metrics: Array<{
    value: Localized;
    label: Localized;
  }>;
};

export type FeaturesContent = {
  visible: boolean;
  title: Localized;
  items: Array<{
    title: Localized;
    description?: Localized;
  }>;
};

export type TransformationsContent = {
  visible: boolean;
  title: Localized;
  subtitle?: Localized;
  items: Array<{
    clientName?: string;
    weeks?: number;
    beforeImg?: string;
    afterImg?: string;
    summary?: Localized;
  }>;
};

export type TestimonialsContent = {
  visible: boolean;
  title: Localized;
  items: Array<{
    name: string;
    age?: number;
    quote: Localized;
    transformation?: Localized;
    avatarUrl?: string;
  }>;
};

export type PricingTier = {
  id: string;
  name: Localized;
  price: Localized;
  /** When true, this is the visually highlighted "recommended" tier. */
  featured?: boolean;
  features: Array<{
    included: boolean;
    label: Localized;
  }>;
};

export type PricingContent = {
  visible: boolean;
  title: Localized;
  subtitle?: Localized;
  tiers: PricingTier[];
};

export type FaqContent = {
  visible: boolean;
  title: Localized;
  items: Array<{
    q: Localized;
    a: Localized;
  }>;
};

export type FooterContent = {
  visible: boolean;
  tagline: Localized;
  newsletter?: {
    placeholder: Localized;
    cta: Localized;
  };
  columns: Array<{
    title: Localized;
    links: Array<{
      label: Localized;
      href: string;
    }>;
  }>;
  social?: Array<{ label: string; href: string }>;
  copyright: Localized;
};

/**
 * Thin top-of-page strip with a single message and optional CTA. Renders
 * above the site navigation on the landing page only. Visitors can
 * dismiss it for the session via localStorage.
 */
export type AnnouncementContent = {
  visible: boolean;
  message: Localized;
  ctaText?: Localized;
  ctaUrl?: string;
  /** When true, the bar shows a close button that hides it locally. */
  dismissible?: boolean;
};

/**
 * Full-width promotional banner: headline + subhead + optional image + CTA.
 * Used for limited-time offers, new program launches, etc.
 */
export type BannerContent = {
  visible: boolean;
  eyebrow?: Localized;
  title: Localized;
  description?: Localized;
  ctaText?: Localized;
  ctaUrl?: string;
  imageUrl?: string;
  /** Visual tone — affects accent / surface treatment. */
  tone?: "accent" | "surface";
};

/**
 * Interactive before/after slider: a draggable divider reveals more of the
 * "before" or "after" image as the visitor pulls it across.
 */
export type BeforeAfterContent = {
  visible: boolean;
  title: Localized;
  subtitle?: Localized;
  items: Array<{
    clientName?: string;
    beforeImg: string;
    afterImg: string;
    caption?: Localized;
    weeks?: number;
  }>;
};

/**
 * Live-style activity feed ("Ahmed just joined the Pro plan"). Drives a
 * compact card with a rotating ticker. Items are static CMS content; no
 * real billing data is exposed.
 */
export type CustomerActivityContent = {
  visible: boolean;
  title: Localized;
  subtitle?: Localized;
  items: Array<{
    name: string;
    /** Locale-specific city or country, displayed under the name. */
    location?: Localized;
    /** Short description of what they did — e.g. "اشترك في باقة Pro". */
    action: Localized;
    /** Relative time string — e.g. "٢ دقيقة" / "2 min ago". */
    timeAgo?: Localized;
    avatarUrl?: string;
  }>;
};

/**
 * Three-up value proposition section: short headline + intro paragraph +
 * a list of named pillars. Inspired by FITSTN's "Wellness Made Personal".
 */
export type ValuePropsContent = {
  visible: boolean;
  eyebrow?: Localized;
  title: Localized;
  description?: Localized;
  ctaText?: Localized;
  ctaUrl?: string;
  items: Array<{
    title: Localized;
    description?: Localized;
  }>;
};

/**
 * Long-form transformation stories — each item is its own card with
 * a name, a wide image, and a paragraph-length narrative. Different from
 * `transformations`, which renders a snap-scroll before/after carousel.
 */
export type FeaturedStoriesContent = {
  visible: boolean;
  eyebrow?: Localized;
  title: Localized;
  subtitle?: Localized;
  items: Array<{
    name: string;
    /** Optional small label above the name — e.g. "Family transformation". */
    badge?: Localized;
    /** Paragraph-length story. */
    body: Localized;
    imageUrl?: string;
    ctaText?: Localized;
    ctaUrl?: string;
  }>;
};

/**
 * Ordered step-by-step explainer ("How to subscribe"). Each step has a
 * short title and a description; the index drives the rendered numeral.
 */
export type ProcessStepsContent = {
  visible: boolean;
  eyebrow?: Localized;
  title: Localized;
  subtitle?: Localized;
  steps: Array<{
    title: Localized;
    description?: Localized;
  }>;
};

// ───────────────────────────────────────────────────────────────────────
// Key → content type mapping
// ───────────────────────────────────────────────────────────────────────

export type SectionContent = {
  announcement: AnnouncementContent;
  hero: HeroContent;
  banner: BannerContent;
  valueProps: ValuePropsContent;
  features: FeaturesContent;
  transformations: TransformationsContent;
  beforeAfter: BeforeAfterContent;
  featuredStories: FeaturedStoriesContent;
  processSteps: ProcessStepsContent;
  testimonials: TestimonialsContent;
  customerActivity: CustomerActivityContent;
  pricing: PricingContent;
  faq: FaqContent;
  footer: FooterContent;
};

export type Section<K extends SectionKey = SectionKey> = SectionEnvelope<
  SectionContent[K]
>;

/** History row returned by GET /api/site-content/:section/history. */
export type SectionHistoryEntry = {
  id: string;
  key: SectionKey;
  content: unknown;
  savedBy?: string;
  savedAt: string;
};
