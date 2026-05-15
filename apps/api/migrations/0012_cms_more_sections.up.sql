-- Seed four additional CMS sections so the admin editor can manage them
-- the same way it manages the original seven from 0008_cms_seed. The
-- frontend ships defaults for these too (apps/web/lib/cms-defaults.ts);
-- this migration just keeps the database in sync.
--
-- New sections:
--   • announcement     — slim dismissible bar above the landing nav.
--   • banner           — full-width promo banner (offer / kickoff).
--   • valueProps       — "Wellness Made Personal" three-pillar intro.
--   • beforeAfter      — interactive drag-to-reveal before/after.
--   • featuredStories  — long-form transformation narratives.
--   • processSteps     — "How to subscribe" step-by-step explainer.
--   • customerActivity — recent-signups / wins social-proof feed.
--
-- The ON CONFLICT clause means re-running on an existing DB is a no-op.

INSERT INTO site_content (section_key, content_json) VALUES
  ('announcement', '{
    "visible": true,
    "message":   {"ar": "خصم ٢٠٪ على باقة أول ثلاثة أشهر — لفترة محدودة.", "en": "20% off the first 3 months — limited time only."},
    "ctaText":   {"ar": "احجز الآن",  "en": "Claim now"},
    "ctaUrl":    "/login",
    "dismissible": true
  }'::jsonb),

  ('banner', '{
    "visible": true,
    "eyebrow":     {"ar": "عرض بداية العام",  "en": "New-year kickoff"},
    "title":       {"ar": "ابدأ بالخطة اللي بتناسبك.",       "en": "Start with the plan that fits you."},
    "description": {"ar": "تقييم مجاني في ١٥ دقيقة، وخطة تجريبية ٣٠ يوم بضمان استرداد.", "en": "Free 15-minute assessment, then a 30-day guided trial with a refund guarantee."},
    "ctaText":     {"ar": "احجز تقييمك",       "en": "Book your assessment"},
    "ctaUrl":      "/login",
    "imageUrl":    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80&auto=format&fit=crop",
    "tone":        "accent"
  }'::jsonb),

  ('valueProps', '{
    "visible":     true,
    "eyebrow":     {"ar": "النهج", "en": "The approach"},
    "title":       {"ar": "صحتك على مقاسك.", "en": "Wellness made personal."},
    "description": {"ar": "بنبني خطة تدريب وتغذية تناسب يومك وأهدافك — مش قالب جاهز.", "en": "We build a training and nutrition plan that fits your day and your goals — never a template."},
    "ctaText":     {"ar": "اعرف أكتر", "en": "Discover more"},
    "ctaUrl":      "/results",
    "items": [
      {"title": {"ar": "خطط مفصّلة لك",       "en": "Tailored fitness and nutrition plans"},  "description": {"ar": "كل تمرين وكل وجبة مبنية على وزنك وقياساتك وهدفك.",    "en": "Every workout and every meal is built around your numbers and goal."}},
      {"title": {"ar": "مدرّبون يفهمون رحلتك", "en": "Expert coaches who understand your journey"}, "description": {"ar": "متابعة شخصية مع كابتن خبرته أكتر من ٧ سنين.",   "en": "Personal follow-up from a coach with 7+ years of experience."}},
      {"title": {"ar": "صحة تتكيف مع حياتك",  "en": "Wellness that adapts to your lifestyle"}, "description": {"ar": "السفر أو تغيّر الشغل ما بيوقفش خطتك — بدائل واضحة دايمًا.", "en": "Travel or schedule changes don''t break your plan — clear alternatives always available."}}
    ]
  }'::jsonb),

  ('beforeAfter', '{
    "visible":  true,
    "title":    {"ar": "قبل و بعد",            "en": "Before & after"},
    "subtitle": {"ar": "اسحب الفاصل لتشوف التغيير.", "en": "Drag the divider to see the change."},
    "items": [
      {
        "clientName": "Ahmed M.",
        "beforeImg":  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80&auto=format&fit=crop",
        "afterImg":   "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900&q=80&auto=format&fit=crop",
        "caption":    {"ar": "-١٢ كجم في ١٦ أسبوع", "en": "-12 kg in 16 weeks"},
        "weeks":      16
      },
      {
        "clientName": "Omar T.",
        "beforeImg":  "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=900&q=80&auto=format&fit=crop",
        "afterImg":   "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=900&q=80&auto=format&fit=crop",
        "caption":    {"ar": "+٦ كجم عضل، -٤٪ دهون", "en": "+6 kg lean, -4% fat"},
        "weeks":      20
      }
    ]
  }'::jsonb),

  ('featuredStories', '{
    "visible":  true,
    "eyebrow":  {"ar": "قصص حقيقية",        "en": "Real stories, real results"},
    "title":    {"ar": "نتائج تستحق الحكاية",    "en": "Transformations worth telling"},
    "subtitle": {"ar": "كل قصة بدأت بخطوة وقرار يومي — مش بمعجزة.", "en": "Every story started with a single decision and showing up daily — not a miracle."},
    "items": [
      {
        "name":   "Mahmoud",
        "badge":  {"ar": "تحوّل عائلي",   "en": "Family transformation"},
        "body":   {"ar": "كان شغوف باللعبة بس مكنش لاقي وقت بين الشغل والعيلة. في ٣ شهور بس مع خطة واحدة، حوّل هو ومراته شكل حياتهم وحياة ولاده — والكل بقى ملتزم بالنادي.", "en": "He loved training but couldn''t find the time between work and family. In just 3 months with a single subscription, he and his wife transformed not just their bodies but their kids'' habits — everyone now sticks to the gym together."},
        "imageUrl": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80&auto=format&fit=crop",
        "ctaText": {"ar": "اقرأ القصة", "en": "Read the story"},
        "ctaUrl":  "/results"
      },
      {
        "name":   "Tohamy",
        "badge":  {"ar": "بدون أدوية", "en": "No surgery, no shortcuts"},
        "body":   {"ar": "بدأ ومعاه سمنة، كوليسترول عالي، ومقاومة إنسولين. خرج من البرنامج رياضي ملتزم — استرجع ثقته وغيّر صحته بدون أي تدخل جراحي أو حقن تخسيس.", "en": "He started with obesity, high cholesterol, and insulin resistance — and zero confidence. He finished as a committed athlete who regained his self-confidence and his health, without any surgery or weight-loss injections."},
        "imageUrl": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=900&q=80&auto=format&fit=crop"
      },
      {
        "name":   "Omar & Raghda",
        "badge":  {"ar": "رحلة الثنائي", "en": "Fit duo"},
        "body":   {"ar": "بدأوا الرحلة سوا، شدّوا بعض، والتزموا. التغيير ما كانش بس في الشكل — تغير في طريقة عيشهم كل يوم، من النوم للأكل لإدارة الضغط.", "en": "They started together, leaned on each other, and stayed committed. The change wasn''t just physical — it reshaped their daily lives, from sleep to meals to managing stress."},
        "imageUrl": "https://images.unsplash.com/photo-1521804906057-1df8fdb718b7?w=900&q=80&auto=format&fit=crop"
      }
    ]
  }'::jsonb),

  ('processSteps', '{
    "visible":  true,
    "eyebrow":  {"ar": "العملية",   "en": "How it works"},
    "title":    {"ar": "إزاي تشترك؟", "en": "How to subscribe"},
    "subtitle": {"ar": "أربع خطوات بسيطة من اللحظة اللي تقرر فيها لحد ما خطتك تكون جاهزة.", "en": "Four simple steps from the moment you decide to the moment your plan is ready."},
    "steps": [
      {"title": {"ar": "اختر مسارك",         "en": "Choose your path"},      "description": {"ar": "اختار الباقة اللي بتناسبك من فردي أو عائلي.",        "en": "Pick the package that fits you — individual or family."}},
      {"title": {"ar": "املأ بياناتك",       "en": "Fill in your details"},  "description": {"ar": "هنطلب منك معلومات صحية وغذائية أساسية لتخصيص الخطة.",  "en": "We''ll collect the essentials to design a plan made just for you."}},
      {"title": {"ar": "مكالمة فيديو",      "en": "Video call"},            "description": {"ar": "هتعمل كول مع أخصائي تغذية بنفهم فيه روتينك وأهدافك بالتفصيل.", "en": "You''ll meet a nutritionist on a video call to walk through your routine and goals."}},
      {"title": {"ar": "تصميم البرنامج",    "en": "Program design"},        "description": {"ar": "بنبني لك خطة تدريب وتغذية مخصصة ١٠٠٪ — وبنبدأ متابعتك خطوة بخطوة.", "en": "We design a 100% personalized training and nutrition plan — then start following up step by step."}}
    ]
  }'::jsonb),

  ('customerActivity', '{
    "visible":  true,
    "title":    {"ar": "عملاء بيتحركوا دلوقتي",           "en": "Clients moving right now"},
    "subtitle": {"ar": "اشتراكات وإنجازات حديثة من عملائنا.", "en": "Recent subscriptions and wins from our clients."},
    "items": [
      {"name": "Ahmed M.",   "location": {"ar": "القاهرة",     "en": "Cairo"},      "action": {"ar": "اشترك في باقة Pro",    "en": "Subscribed to the Pro plan"}, "timeAgo": {"ar": "منذ ٢ دقيقة",  "en": "2 min ago"}},
      {"name": "Youssef A.", "location": {"ar": "الإسكندرية", "en": "Alexandria"}, "action": {"ar": "جدد الاشتراك ل ٣ شهور", "en": "Renewed for 3 months"},      "timeAgo": {"ar": "منذ ١٢ دقيقة", "en": "12 min ago"}},
      {"name": "Karim H.",   "location": {"ar": "الجيزة",       "en": "Giza"},       "action": {"ar": "وصل -٨ كجم في ٨ أسابيع","en": "Hit -8 kg in 8 weeks"},        "timeAgo": {"ar": "منذ ٢٥ دقيقة", "en": "25 min ago"}},
      {"name": "Omar T.",    "location": {"ar": "الرياض",       "en": "Riyadh"},     "action": {"ar": "بدأ تحدي ٣٠ يوم",       "en": "Started a 30-day challenge"}, "timeAgo": {"ar": "منذ ٤٠ دقيقة", "en": "40 min ago"}}
    ]
  }'::jsonb)
ON CONFLICT (section_key) DO NOTHING;
