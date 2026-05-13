// CMS payload shapes. The Go API stores each section as opaque JSONB; the
// TypeScript types below are the contract between the editor and the
// rendered landing page. If you change the SHAPE here, also update:
//   • apps/api/migrations/0008_cms_seed.up.sql (the seed defaults)
//   • apps/web/app/admin/cms/* (the editor)
//   • the matching landing-page component that consumes it

export type SectionKey =
  | "hero"
  | "features"
  | "transformations"
  | "testimonials"
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

// ───────────────────────────────────────────────────────────────────────
// Key → content type mapping
// ───────────────────────────────────────────────────────────────────────

export type SectionContent = {
  hero: HeroContent;
  features: FeaturesContent;
  transformations: TransformationsContent;
  testimonials: TestimonialsContent;
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
