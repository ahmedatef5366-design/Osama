-- Seed the canonical CMS sections so a fresh database renders a full landing
-- page out of the box. Admins overwrite these from /admin/cms; the on-conflict
-- clause means re-running the migration on an existing DB is a no-op.
--
-- Every section_key referenced by the landing page MUST exist here, otherwise
-- the page would render an empty server component on first paint.

INSERT INTO site_content (section_key, content_json) VALUES
  ('hero', '{
    "visible": true,
    "headlineL1": {"ar": "حوّل جسمك.",        "en": "Transform your body."},
    "headlineL2": {"ar": "حوّل حياتك.",        "en": "Transform your life."},
    "subheadline": {"ar": "برامج تدريب وتغذية مصممة خصيصاً لك", "en": "Training and nutrition programs designed just for you"},
    "ctaText":    {"ar": "ابدأ رحلتك",          "en": "Start your journey"},
    "ctaUrl":     "/login",
    "metrics": [
      {"value": {"ar": "+٢٬٤٠٠", "en": "+2,400"}, "label": {"ar": "عميل",       "en": "clients"}},
      {"value": {"ar": "٩٨٪",   "en": "98%"},    "label": {"ar": "نسبة رضا",    "en": "satisfaction"}},
      {"value": {"ar": "٤٫٩★",  "en": "4.9★"},   "label": {"ar": "تقييم",      "en": "rating"}}
    ]
  }'::jsonb),

  ('features', '{
    "visible": true,
    "title": {"ar": "كل ما تحتاجه — في مكان واحد", "en": "Everything you need — in one place"},
    "items": [
      {"title": {"ar": "خطة تمرين مخصصة",       "en": "Custom training plan"},     "description": {"ar": "تمارين مصممة على هدفك وخبرتك", "en": "Exercises tailored to your goal and experience"}},
      {"title": {"ar": "نظام تغذية مرن",         "en": "Flexible nutrition system"}, "description": {"ar": "ثابت أو مرن — اختر ما يناسبك",     "en": "Fixed or flexible — pick what fits your life"}},
      {"title": {"ar": "متابعة يومية",           "en": "Daily check-ins"},           "description": {"ar": "تابع تقدمك دقيقة بدقيقة",         "en": "Track your progress minute by minute"}},
      {"title": {"ar": "تواصل مباشر مع المدرّب", "en": "Direct coach messaging"},    "description": {"ar": "ردود سريعة بدل الانتظار أياماً",   "en": "Quick replies, not days of waiting"}},
      {"title": {"ar": "تقارير أسبوعية بالتفصيل","en": "Detailed weekly reports"},  "description": {"ar": "كل أرقامك في تقرير واحد كل أسبوع","en": "All your numbers in one weekly report"}}
    ]
  }'::jsonb),

  ('transformations', '{
    "visible": true,
    "title":    {"ar": "نتائج حقيقية",  "en": "Real transformations"},
    "subtitle": {"ar": "اسحب لتشاهد رحلة كل عميل", "en": "Swipe to see each client''s journey"},
    "items": []
  }'::jsonb),

  ('testimonials', '{
    "visible": true,
    "title":    {"ar": "ماذا يقول المتدربون", "en": "What clients say"},
    "items": [
      {"name": "Ahmed M.", "age": 28, "quote": {"ar": "أول مرة أحس إن في حد فاهم جسمي فعلاً.", "en": "First time someone actually understood my body."}, "transformation": {"ar": "-١٢ كجم في ٤ أشهر", "en": "-12 kg in 4 months"}},
      {"name": "Sara K.",  "age": 24, "quote": {"ar": "البرنامج اشتغل لأن المدرب اشتغل معايا.", "en": "The program worked because the coach worked with me."}, "transformation": {"ar": "+٦ كجم عضل",        "en": "+6 kg lean"}},
      {"name": "Omar T.",  "age": 33, "quote": {"ar": "أحسن استثمار في صحتي على الإطلاق.",     "en": "Best investment I''ve ever made in my health."}, "transformation": {"ar": "٢١٪→١٢٪ دهون",   "en": "21% → 12% body fat"}}
    ]
  }'::jsonb),

  ('pricing', '{
    "visible": false,
    "title":    {"ar": "اختر الباقة المناسبة", "en": "Pick the right plan"},
    "subtitle": {"ar": "ابدأ بأي خطة — التحويل في أي وقت", "en": "Start anywhere — switch any time"},
    "tiers": [
      {"id": "basic",  "name": {"ar": "أساسي",   "en": "Basic"},   "price": {"ar": "٥٠٠ ج.م./شهر", "en": "EGP 500/mo"},  "featured": false, "features": [{"included": true, "label": {"ar": "خطة تمرين", "en": "Training plan"}}, {"included": true, "label": {"ar": "تواصل أسبوعي", "en": "Weekly check-in"}}, {"included": false, "label": {"ar": "خطة تغذية", "en": "Nutrition plan"}}]},
      {"id": "pro",    "name": {"ar": "احترافي", "en": "Pro"},     "price": {"ar": "٩٠٠ ج.م./شهر", "en": "EGP 900/mo"},  "featured": true,  "features": [{"included": true, "label": {"ar": "خطة تمرين", "en": "Training plan"}}, {"included": true, "label": {"ar": "خطة تغذية", "en": "Nutrition plan"}}, {"included": true, "label": {"ar": "تواصل يومي", "en": "Daily messaging"}}]},
      {"id": "elite",  "name": {"ar": "نخبة",   "en": "Elite"},   "price": {"ar": "١٥٠٠ ج.م./شهر","en": "EGP 1500/mo"}, "featured": false, "features": [{"included": true, "label": {"ar": "خطة تمرين", "en": "Training plan"}}, {"included": true, "label": {"ar": "خطة تغذية", "en": "Nutrition plan"}}, {"included": true, "label": {"ar": "تواصل يومي + مكالمات", "en": "Daily messaging + calls"}}]}
    ]
  }'::jsonb),

  ('faq', '{
    "visible": true,
    "title": {"ar": "أسئلة شائعة", "en": "Frequently asked"},
    "items": [
      {"q": {"ar": "هل البرنامج مناسب للمبتدئين؟", "en": "Is this for beginners?"},          "a": {"ar": "نعم — كل برنامج يُصمَّم على مستواك الحالي.", "en": "Yes — every program is built around your current level."}},
      {"q": {"ar": "كم مرة في الأسبوع سأتدرّب؟",    "en": "How often will I train per week?"}, "a": {"ar": "بين ٣ و٦ أيام بحسب هدفك ووقتك.",            "en": "Between 3 and 6 days based on your goal and schedule."}},
      {"q": {"ar": "هل أحتاج جيم؟",                "en": "Do I need a gym?"},                 "a": {"ar": "نوفّر خيار البيت أو الجيم بناءً على المتاح لديك.", "en": "We offer home or gym options based on what you have."}},
      {"q": {"ar": "كيف أتابع تقدمي؟",             "en": "How do I track progress?"},         "a": {"ar": "من خلال التطبيق: وزن، صور، قياسات، متابعة يومية.", "en": "Inside the app: weight, photos, measurements, and daily check-ins."}}
    ]
  }'::jsonb),

  ('footer', '{
    "visible": true,
    "tagline":   {"ar": "تحوّل حقيقي يبدأ بخطوة.", "en": "Real transformation starts with a step."},
    "newsletter": {"placeholder": {"ar": "بريدك الإلكتروني", "en": "Your email"}, "cta": {"ar": "اشترك", "en": "Subscribe"}},
    "columns": [
      {"title": {"ar": "الموقع", "en": "Site"},     "links": [{"label": {"ar": "الرئيسية", "en": "Home"}, "href": "/"}, {"label": {"ar": "تسجيل الدخول", "en": "Log in"}, "href": "/login"}]},
      {"title": {"ar": "قانوني", "en": "Legal"},    "links": [{"label": {"ar": "الخصوصية", "en": "Privacy"}, "href": "/privacy"}, {"label": {"ar": "الشروط", "en": "Terms"}, "href": "/terms"}]},
      {"title": {"ar": "تواصل", "en": "Contact"},   "links": [{"label": {"ar": "البريد", "en": "Email"}, "href": "mailto:hello@example.com"}]}
    ],
    "social": [
      {"label": "Instagram", "href": "https://instagram.com/"},
      {"label": "X",         "href": "https://x.com/"},
      {"label": "YouTube",   "href": "https://youtube.com/"}
    ],
    "copyright": {"ar": "جميع الحقوق محفوظة.", "en": "All rights reserved."}
  }'::jsonb)
ON CONFLICT (section_key) DO NOTHING;
