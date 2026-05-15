/**
 * In-source fallbacks for every CMS section. Mirrors the seed defaults in
 * apps/api/migrations/0008_cms_seed.up.sql so a fresh DB renders cleanly
 * even before migrations run.
 *
 * These are also used as the editor's "reset to default" payload.
 */
import type {
  AnnouncementContent,
  BannerContent,
  BeforeAfterContent,
  CustomerActivityContent,
  FaqContent,
  FeaturedStoriesContent,
  FeaturesContent,
  FooterContent,
  HeroContent,
  PricingContent,
  ProcessStepsContent,
  TestimonialsContent,
  TransformationsContent,
  ValuePropsContent,
} from "@/types/cms";

export const defaultAnnouncement: AnnouncementContent = {
  visible: true,
  message: {
    ar: "خصم ٢٠٪ على باقة أول ثلاثة أشهر — لفترة محدودة.",
    en: "20% off the first 3 months — limited time only.",
  },
  ctaText: { ar: "احجز الآن", en: "Claim now" },
  ctaUrl: "/login",
  dismissible: true,
};

export const defaultBanner: BannerContent = {
  visible: true,
  eyebrow: { ar: "عرض بداية العام", en: "New-year kickoff" },
  title: {
    ar: "ابدأ بالخطة اللي بتناسبك.",
    en: "Start with the plan that fits you.",
  },
  description: {
    ar: "تقييم مجاني في ١٥ دقيقة، وخطة تجريبية ٣٠ يوم بضمان استرداد.",
    en: "Free 15-minute assessment, then a 30-day guided trial with a refund guarantee.",
  },
  ctaText: { ar: "احجز تقييمك", en: "Book your assessment" },
  ctaUrl: "/login",
  imageUrl:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80&auto=format&fit=crop",
  tone: "accent",
};

// Re-uses the same verified male/equipment Unsplash imagery as
// `defaultTransformations` — do NOT swap these without re-verifying.
export const defaultBeforeAfter: BeforeAfterContent = {
  visible: true,
  title: { ar: "قبل و بعد", en: "Before & after" },
  subtitle: {
    ar: "اسحب الفاصل لتشوف التغيير.",
    en: "Drag the divider to see the change.",
  },
  items: [
    {
      clientName: "Ahmed M.",
      beforeImg:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80&auto=format&fit=crop",
      afterImg:
        "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900&q=80&auto=format&fit=crop",
      caption: { ar: "-١٢ كجم في ١٦ أسبوع", en: "-12 kg in 16 weeks" },
      weeks: 16,
    },
    {
      clientName: "Omar T.",
      beforeImg:
        "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=900&q=80&auto=format&fit=crop",
      afterImg:
        "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=900&q=80&auto=format&fit=crop",
      caption: { ar: "+٦ كجم عضل، -٤٪ دهون", en: "+6 kg lean, -4% fat" },
      weeks: 20,
    },
  ],
};

export const defaultValueProps: ValuePropsContent = {
  visible: true,
  eyebrow: { ar: "النهج", en: "The approach" },
  title: { ar: "صحتك على مقاسك.", en: "Wellness made personal." },
  description: {
    ar: "بنبني خطة تدريب وتغذية تناسب يومك وأهدافك — مش قالب جاهز.",
    en: "We build a training and nutrition plan that fits your day and your goals — never a template.",
  },
  ctaText: { ar: "اعرف أكتر", en: "Discover more" },
  ctaUrl: "/results",
  items: [
    {
      title: { ar: "خطط مفصّلة لك", en: "Tailored fitness and nutrition plans" },
      description: {
        ar: "كل تمرين وكل وجبة مبنية على وزنك وقياساتك وهدفك.",
        en: "Every workout and every meal is built around your numbers and goal.",
      },
    },
    {
      title: { ar: "مدرّبون يفهمون رحلتك", en: "Expert coaches who understand your journey" },
      description: {
        ar: "متابعة شخصية مع كابتن خبرته أكتر من ٧ سنين.",
        en: "Personal follow-up from a coach with 7+ years of experience.",
      },
    },
    {
      title: { ar: "صحة تتكيف مع حياتك", en: "Wellness that adapts to your lifestyle" },
      description: {
        ar: "السفر أو تغيّر الشغل ما بيوقفش خطتك — بدائل واضحة دايمًا.",
        en: "Travel or schedule changes don't break your plan — clear alternatives always available.",
      },
    },
  ],
};

export const defaultFeaturedStories: FeaturedStoriesContent = {
  visible: true,
  eyebrow: { ar: "قصص حقيقية", en: "Real stories, real results" },
  title: { ar: "نتائج تستحق الحكاية", en: "Transformations worth telling" },
  subtitle: {
    ar: "كل قصة بدأت بخطوة وقرار يومي — مش بمعجزة.",
    en: "Every story started with a single decision and showing up daily — not a miracle.",
  },
  items: [
    {
      name: "Mahmoud",
      badge: { ar: "تحوّل عائلي", en: "Family transformation" },
      body: {
        ar: "كان شغوف باللعبة بس مكنش لاقي وقت بين الشغل والعيلة. في ٣ شهور بس مع خطة واحدة، حوّل هو ومراته شكل حياتهم وحياة ولاده — والكل بقى ملتزم بالنادي.",
        en: "He loved training but couldn't find the time between work and family. In just 3 months with a single subscription, he and his wife transformed not just their bodies but their kids' habits — everyone now sticks to the gym together.",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80&auto=format&fit=crop",
      ctaText: { ar: "اقرأ القصة", en: "Read the story" },
      ctaUrl: "/results",
    },
    {
      name: "Tohamy",
      badge: { ar: "بدون أدوية", en: "No surgery, no shortcuts" },
      body: {
        ar: "بدأ ومعاه سمنة، كوليسترول عالي، ومقاومة إنسولين. خرج من البرنامج رياضي ملتزم — استرجع ثقته وغيّر صحته بدون أي تدخل جراحي أو حقن تخسيس.",
        en: "He started with obesity, high cholesterol, and insulin resistance — and zero confidence. He finished as a committed athlete who regained his self-confidence and his health, without any surgery or weight-loss injections.",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=900&q=80&auto=format&fit=crop",
    },
    {
      name: "Omar & Raghda",
      badge: { ar: "رحلة الثنائي", en: "Fit duo" },
      body: {
        ar: "بدأوا الرحلة سوا، شدّوا بعض، والتزموا. التغيير ما كانش بس في الشكل — تغير في طريقة عيشهم كل يوم، من النوم للأكل لإدارة الضغط.",
        en: "They started together, leaned on each other, and stayed committed. The change wasn't just physical — it reshaped their daily lives, from sleep to meals to managing stress.",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1521804906057-1df8fdb718b7?w=900&q=80&auto=format&fit=crop",
    },
  ],
};

export const defaultProcessSteps: ProcessStepsContent = {
  visible: true,
  eyebrow: { ar: "العملية", en: "How it works" },
  title: { ar: "إزاي تشترك؟", en: "How to subscribe" },
  subtitle: {
    ar: "أربع خطوات بسيطة من اللحظة اللي تقرر فيها لحد ما خطتك تكون جاهزة.",
    en: "Four simple steps from the moment you decide to the moment your plan is ready.",
  },
  steps: [
    {
      title: { ar: "اختر مسارك", en: "Choose your path" },
      description: {
        ar: "اختار الباقة اللي بتناسبك من فردي أو عائلي.",
        en: "Pick the package that fits you — individual or family.",
      },
    },
    {
      title: { ar: "املأ بياناتك", en: "Fill in your details" },
      description: {
        ar: "هنطلب منك معلومات صحية وغذائية أساسية لتخصيص الخطة.",
        en: "We'll collect the essentials to design a plan made just for you.",
      },
    },
    {
      title: { ar: "مكالمة فيديو", en: "Video call" },
      description: {
        ar: "هتعمل كول مع أخصائي تغذية بنفهم فيه روتينك وأهدافك بالتفصيل.",
        en: "You'll meet a nutritionist on a video call to walk through your routine and goals.",
      },
    },
    {
      title: { ar: "تصميم البرنامج", en: "Program design" },
      description: {
        ar: "بنبني لك خطة تدريب وتغذية مخصصة ١٠٠٪ — وبنبدأ متابعتك خطوة بخطوة.",
        en: "We design a 100% personalized training and nutrition plan — then start following up step by step.",
      },
    },
  ],
};

export const defaultCustomerActivity: CustomerActivityContent = {
  visible: true,
  title: { ar: "عملاء بيتحركوا دلوقتي", en: "Clients moving right now" },
  subtitle: {
    ar: "اشتراكات وإنجازات حديثة من عملائنا.",
    en: "Recent subscriptions and wins from our clients.",
  },
  items: [
    {
      name: "Ahmed M.",
      location: { ar: "القاهرة", en: "Cairo" },
      action: { ar: "اشترك في باقة Pro", en: "Subscribed to the Pro plan" },
      timeAgo: { ar: "منذ ٢ دقيقة", en: "2 min ago" },
    },
    {
      name: "Youssef A.",
      location: { ar: "الإسكندرية", en: "Alexandria" },
      action: { ar: "جدد الاشتراك ل ٣ شهور", en: "Renewed for 3 months" },
      timeAgo: { ar: "منذ ١٢ دقيقة", en: "12 min ago" },
    },
    {
      name: "Karim H.",
      location: { ar: "الجيزة", en: "Giza" },
      action: { ar: "وصل -٨ كجم في ٨ أسابيع", en: "Hit -8 kg in 8 weeks" },
      timeAgo: { ar: "منذ ٢٥ دقيقة", en: "25 min ago" },
    },
    {
      name: "Omar T.",
      location: { ar: "الرياض", en: "Riyadh" },
      action: { ar: "بدأ تحدي ٣٠ يوم", en: "Started a 30-day challenge" },
      timeAgo: { ar: "منذ ٤٠ دقيقة", en: "40 min ago" },
    },
  ],
};

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
  visible: true,
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
        { label: { ar: "النتائج", en: "Results" }, href: "/results" },
        { label: { ar: "المقالات", en: "Articles" }, href: "/articles" },
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
