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
  headlineL1: { ar: "ابني أقوى نسخة منك.", en: "Build your strongest version." },
  headlineL2: { ar: "مع كوتش أسامة.", en: "With Coach Osama." },
  subheadline: {
    ar: "مش بس برنامج — ده نظام حياة كامل مبني على جسمك وهدفك ويومك",
    en: "Not just a plan — a complete system built around your body, your goals, and your schedule",
  },
  ctaText: { ar: "ابدأ تحوّلك", en: "Start your transformation" },
  ctaUrl: "/login",
  metrics: [
    { value: { ar: "٢٬٤٣٧", en: "2,437" }, label: { ar: "عميل حقيقي", en: "real clients" } },
    { value: { ar: "٩٧.٣٪", en: "97.3%" }, label: { ar: "معدل التزام", en: "retention rate" } },
    { value: { ar: "٤.٩٢★", en: "4.92★" }, label: { ar: "تقييم", en: "avg rating" } },
  ],
};

export const defaultFeatures: FeaturesContent = {
  visible: true,
  title: { ar: "كل الأدوات في إيدك", en: "YOUR COMPLETE TOOLKIT" },
  items: [
    {
      title: { ar: "تمرين مفصّل على جسمك", en: "Training built for YOUR body" },
      description: { ar: "كل تمرين مختار بناءً على مستواك وإصاباتك وأهدافك", en: "Every exercise chosen based on your level, injuries, and goals" },
    },
    {
      title: { ar: "تغذية مرنة مش مملة", en: "Nutrition that actually fits" },
      description: { ar: "مفيش حرمان — نظام يتماشى مع أكلك المفضل", en: "No deprivation — a system that works with food you love" },
    },
    {
      title: { ar: "متابعة يومية حقيقية", en: "Real daily accountability" },
      description: { ar: "كل يوم هتلاقيني متابع معاك خطوة بخطوة", en: "Every day I’m tracking your progress step by step" },
    },
    {
      title: { ar: "تواصل مباشر — مش بوت", en: "Direct messaging — not a bot" },
      description: { ar: "أنا شخصياً برد على كل رسالة", en: "I personally reply to every message" },
    },
    {
      title: { ar: "تقارير بالأرقام", en: "Reports with real numbers" },
      description: { ar: "تقدمك بالرسوم والصور والقياسات كل أسبوع", en: "Charts, photos, and measurements every single week" },
    },
  ],
};

export const defaultTransformations: TransformationsContent = {
  visible: true,
  title: { ar: "نتائج حقيقية", en: "Real transformations" },
  subtitle: { ar: "اسحب لتشاهد رحلة كل عميل", en: "Swipe to see each client's journey" },
  items: [],
};

export const defaultTestimonials: TestimonialsContent = {
  visible: true,
  title: { ar: "نتائج حقيقية", en: "REAL RESULTS" },
  items: [
    {
      name: "Ahmed M.",
      age: 28,
      quote: {
        ar: "كنت فاكر إن الموضوع بس دايت. أسامة علمني إن ده نظام حياة.",
        en: "I thought it was just a diet. Osama showed me it’s a lifestyle.",
      },
      transformation: { ar: "-١٢.٣ كجم في ١٤ أسبوع", en: "-12.3 kg in 14 weeks" },
    },
    {
      name: "Sara K.",
      age: 24,
      quote: {
        ar: "الفرق إن أسامة بيرد عليا فعلاً — مش بوت ولا template.",
        en: "The difference? Osama actually replies — no bots, no templates.",
      },
      transformation: { ar: "+٥.٨ كجم عضل صافي", en: "+5.8 kg lean muscle" },
    },
    {
      name: "Omar T.",
      age: 33,
      quote: {
        ar: "جربت ٣ مدربين قبل كده. أسامة الوحيد اللي فهم جسمي.",
        en: "Tried 3 coaches before. Osama is the only one who got my body.",
      },
      transformation: { ar: "٢١.٤٪→١١.٨٪ دهون", en: "21.4% → 11.8% body fat" },
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
  tagline: { ar: "كل تحوّل حقيقي بدأ برسالة واحدة.", en: "Every real transformation started with one message." },
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
