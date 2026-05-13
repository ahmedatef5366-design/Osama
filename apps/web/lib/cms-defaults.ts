/**
 * In-source fallbacks for every CMS section. Mirrors the seed defaults in
 * apps/api/migrations/0008_cms_seed.up.sql so a fresh DB renders cleanly
 * even before migrations run.
 *
 * These are also used as the editor's "reset to default" payload.
 */
import type {
  FaqContent,
  FeaturesContent,
  FooterContent,
  HeroContent,
  PricingContent,
  TestimonialsContent,
  TransformationsContent,
} from "@/types/cms";

export const defaultHero: HeroContent = {
  visible: true,
  headlineL1: { ar: "حوّل جسمك.", en: "Transform your body." },
  headlineL2: { ar: "حوّل حياتك.", en: "Transform your life." },
  subheadline: {
    ar: "برامج تدريب وتغذية مصممة خصيصاً لك",
    en: "Training and nutrition programs designed just for you",
  },
  ctaText: { ar: "ابدأ رحلتك", en: "Start your journey" },
  ctaUrl: "/login",
  metrics: [
    { value: { ar: "+٢٬٤٠٠", en: "+2,400" }, label: { ar: "عميل", en: "clients" } },
    { value: { ar: "٩٨٪", en: "98%" }, label: { ar: "نسبة رضا", en: "satisfaction" } },
    { value: { ar: "٤٫٩★", en: "4.9★" }, label: { ar: "تقييم", en: "rating" } },
  ],
};

export const defaultFeatures: FeaturesContent = {
  visible: true,
  title: { ar: "كل ما تحتاجه — في مكان واحد", en: "Everything you need — in one place" },
  items: [
    { title: { ar: "خطة تمرين مخصصة", en: "Custom training plan" } },
    { title: { ar: "نظام تغذية مرن", en: "Flexible nutrition system" } },
    { title: { ar: "متابعة يومية", en: "Daily check-ins" } },
    { title: { ar: "تواصل مباشر مع المدرّب", en: "Direct coach messaging" } },
    { title: { ar: "تقارير أسبوعية بالتفصيل", en: "Detailed weekly reports" } },
  ],
};

// Note: the seeded `items` use stock Unsplash photographs as placeholders
// only — they are overwritten as soon as the admin uploads real client
// progress photos through the CMS editor. Keeping non-empty defaults
// here means a fresh deploy shows a credible carousel instead of a blank
// section, which is what most "AI demo" sites get wrong.
export const defaultTransformations: TransformationsContent = {
  visible: true,
  title: { ar: "نتائج حقيقية", en: "Real transformations" },
  subtitle: { ar: "اسحب لتشاهد رحلة كل عميل", en: "Swipe to see each client's journey" },
  // Each before/after pair below uses a manually verified male-or-equipment
  // Unsplash photo. Do NOT swap these in without re-verifying — the
  // product brief explicitly excludes photos of women.
  items: [
    {
      clientName: "Ahmed M.",
      beforeImg: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&auto=format&fit=crop",
      afterImg: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80&auto=format&fit=crop",
      summary: { ar: "-١٢ كجم في ١٦ أسبوع", en: "-12 kg in 16 weeks" },
      weeks: 16,
    },
    {
      clientName: "Omar T.",
      beforeImg: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=600&q=80&auto=format&fit=crop",
      afterImg: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600&q=80&auto=format&fit=crop",
      summary: { ar: "+٦ كجم عضل، -٤٪ دهون", en: "+6 kg lean, -4% fat" },
      weeks: 20,
    },
    {
      clientName: "Karim H.",
      beforeImg: "https://images.unsplash.com/photo-1521804906057-1df8fdb718b7?w=600&q=80&auto=format&fit=crop",
      afterImg: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600&q=80&auto=format&fit=crop",
      summary: { ar: "٢١٪ → ١٢٪ دهون", en: "21% → 12% body fat" },
      weeks: 24,
    },
  ],
};

export const defaultTestimonials: TestimonialsContent = {
  visible: true,
  title: { ar: "ماذا يقول المتدربون", en: "What clients say" },
  items: [
    {
      name: "Ahmed M.",
      age: 28,
      quote: {
        ar: "أول مرة أحس إن في حد فاهم جسمي فعلاً.",
        en: "First time someone actually understood my body.",
      },
      transformation: { ar: "-١٢ كجم في ٤ أشهر", en: "-12 kg in 4 months" },
    },
    {
      name: "Youssef A.",
      age: 31,
      quote: {
        ar: "البرنامج اشتغل لأن المدرب اشتغل معايا — مش بس ورّقني خطة.",
        en: "The program worked because the coach worked with me — not just handed me a plan.",
      },
      transformation: { ar: "+٦ كجم عضل", en: "+6 kg lean" },
    },
    {
      name: "Omar T.",
      age: 33,
      quote: {
        ar: "أحسن استثمار في صحتي على الإطلاق.",
        en: "Best investment I've ever made in my health.",
      },
      transformation: { ar: "٢١٪→١٢٪ دهون", en: "21% → 12% body fat" },
    },
  ],
};

export const defaultPricing: PricingContent = {
  visible: false,
  title: { ar: "اختر الباقة المناسبة", en: "Pick the right plan" },
  subtitle: { ar: "ابدأ بأي خطة — التحويل في أي وقت", en: "Start anywhere — switch any time" },
  tiers: [
    {
      id: "basic",
      name: { ar: "أساسي", en: "Basic" },
      price: { ar: "٥٠٠ ج.م./شهر", en: "EGP 500/mo" },
      featured: false,
      features: [
        { included: true, label: { ar: "خطة تمرين", en: "Training plan" } },
        { included: true, label: { ar: "تواصل أسبوعي", en: "Weekly check-in" } },
        { included: false, label: { ar: "خطة تغذية", en: "Nutrition plan" } },
      ],
    },
    {
      id: "pro",
      name: { ar: "احترافي", en: "Pro" },
      price: { ar: "٩٠٠ ج.م./شهر", en: "EGP 900/mo" },
      featured: true,
      features: [
        { included: true, label: { ar: "خطة تمرين", en: "Training plan" } },
        { included: true, label: { ar: "خطة تغذية", en: "Nutrition plan" } },
        { included: true, label: { ar: "تواصل يومي", en: "Daily messaging" } },
      ],
    },
    {
      id: "elite",
      name: { ar: "نخبة", en: "Elite" },
      price: { ar: "١٥٠٠ ج.م./شهر", en: "EGP 1500/mo" },
      featured: false,
      features: [
        { included: true, label: { ar: "خطة تمرين", en: "Training plan" } },
        { included: true, label: { ar: "خطة تغذية", en: "Nutrition plan" } },
        { included: true, label: { ar: "تواصل يومي + مكالمات", en: "Daily messaging + calls" } },
      ],
    },
  ],
};

export const defaultFaq: FaqContent = {
  visible: true,
  title: { ar: "أسئلة شائعة", en: "Frequently asked" },
  items: [
    {
      q: { ar: "هل البرنامج مناسب للمبتدئين؟", en: "Is this for beginners?" },
      a: {
        ar: "نعم — كل برنامج يُصمَّم على مستواك الحالي.",
        en: "Yes — every program is built around your current level.",
      },
    },
    {
      q: { ar: "كم مرة في الأسبوع سأتدرّب؟", en: "How often will I train per week?" },
      a: {
        ar: "بين ٣ و٦ أيام بحسب هدفك ووقتك.",
        en: "Between 3 and 6 days based on your goal and schedule.",
      },
    },
    {
      q: { ar: "هل أحتاج جيم؟", en: "Do I need a gym?" },
      a: {
        ar: "نوفّر خيار البيت أو الجيم بناءً على المتاح لديك.",
        en: "We offer home or gym options based on what you have.",
      },
    },
    {
      q: { ar: "كيف أتابع تقدمي؟", en: "How do I track progress?" },
      a: {
        ar: "من خلال التطبيق: وزن، صور، قياسات، متابعة يومية.",
        en: "Inside the app: weight, photos, measurements, and daily check-ins.",
      },
    },
  ],
};

export const defaultFooter: FooterContent = {
  visible: true,
  tagline: { ar: "تحوّل حقيقي يبدأ بخطوة.", en: "Real transformation starts with a step." },
  newsletter: {
    placeholder: { ar: "بريدك الإلكتروني", en: "Your email" },
    cta: { ar: "اشترك", en: "Subscribe" },
  },
  columns: [
    {
      title: { ar: "الموقع", en: "Site" },
      links: [
        { label: { ar: "الرئيسية", en: "Home" }, href: "/" },
        { label: { ar: "تسجيل الدخول", en: "Log in" }, href: "/login" },
      ],
    },
    {
      title: { ar: "قانوني", en: "Legal" },
      links: [
        { label: { ar: "الخصوصية", en: "Privacy" }, href: "/privacy" },
        { label: { ar: "الشروط", en: "Terms" }, href: "/terms" },
      ],
    },
    {
      title: { ar: "تواصل", en: "Contact" },
      links: [{ label: { ar: "البريد", en: "Email" }, href: "mailto:hello@example.com" }],
    },
  ],
  social: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "X", href: "https://x.com/" },
    { label: "YouTube", href: "https://youtube.com/" },
  ],
  copyright: { ar: "جميع الحقوق محفوظة.", en: "All rights reserved." },
};
