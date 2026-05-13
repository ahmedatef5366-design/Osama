/**
 * Centralized Unsplash photo references used across the landing page,
 * auth screen, and portal empty-states.
 *
 * Curation rules (per product brief):
 *   • Subjects: men training, empty gym interiors, equipment closeups.
 *     Every photo in this file has been manually verified to contain
 *     either no people, or only men. NO photos of women, kids, or
 *     anything that would feel off-brand for a one-on-one men's
 *     coaching service.
 *   • Source: only images.unsplash.com (already whitelisted in
 *     next.config.mjs's images.remotePatterns and CSP img-src).
 *   • Query params: w=, q=80, auto=format are appended at the URL so we
 *     get smaller, faster JPEGs without giving up density.
 *
 * Each entry carries an Arabic + English alt string so the alt actually
 * reflects what the user sees in their language.
 */

type LocaleAlt = { ar: string; en: string };

type UnsplashAsset = {
  /** Unsplash photo ID (the slug after `photo-`). */
  id: string;
  src: string;
  alt: LocaleAlt;
};

function unsplash(id: string, w = 1400): string {
  return `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;
}

// Hero: man with dumbbells, low-key lighting.
export const heroAthlete: UnsplashAsset = {
  id: "photo-1583454110551-21f2fa2afe61",
  src: unsplash("photo-1583454110551-21f2fa2afe61", 1200),
  alt: {
    ar: "رجل يتدرب بالأثقال في صالة رياضية مظلمة",
    en: "Man lifting dumbbells in a low-lit gym",
  },
};

// Studio band — wide, atmospheric empty gym shot used between landing
// sections. Empty floor (no people) keeps it on-brand without the
// editorial risk of a stock subject.
export const studioWide: UnsplashAsset = {
  id: "photo-1540497077202-7c8a3999166f",
  src: unsplash("photo-1540497077202-7c8a3999166f", 1800),
  alt: {
    ar: "صالة جيم خالية بمعدات حديدية",
    en: "Empty gym floor with weight equipment",
  },
};

// Coach portrait — used in the login split. Man pulling battle ropes
// in a brutalist concrete space.
export const coachPortrait: UnsplashAsset = {
  id: "photo-1567013127542-490d757e51fc",
  src: unsplash("photo-1567013127542-490d757e51fc", 1000),
  alt: {
    ar: "مدرّب يستخدم حبال التدريب",
    en: "Coach training with battle ropes",
  },
};

// Nutrition reference — meal prep bowl, no people.
export const nutritionBowl: UnsplashAsset = {
  id: "photo-1490645935967-10de6ba17061",
  src: unsplash("photo-1490645935967-10de6ba17061", 900),
  alt: {
    ar: "وجبة صحية متوازنة في طبق",
    en: "Balanced healthy meal in a bowl",
  },
};

// Dumbbell rack — pure equipment closeup. Used as a card accent.
export const equipmentRack: UnsplashAsset = {
  id: "photo-1576678927484-cc907957088c",
  src: unsplash("photo-1576678927484-cc907957088c", 900),
  alt: {
    ar: "حامل الأوزان في الصالة",
    en: "Row of dumbbells on a rack",
  },
};

// Coach editorial — same subject as login split but bigger and tighter
// crop. Used in the CoachBio section. Reuses the verified photo id.
export const coachEditorial: UnsplashAsset = {
  id: "photo-1567013127542-490d757e51fc",
  src: unsplash("photo-1567013127542-490d757e51fc", 1400),
  alt: {
    ar: "أسامة المدرّب في صالة التدريب",
    en: "Osama the coach in the training studio",
  },
};

// Article 1 — periodisation / programming. A barbell rack closeup.
export const articleProgramming: UnsplashAsset = {
  id: "photo-1534438327276-14e5300c3a48",
  src: unsplash("photo-1534438327276-14e5300c3a48", 1200),
  alt: {
    ar: "بار حديد للأوزان الثقيلة",
    en: "Loaded barbell ready to lift",
  },
};

// Article 2 — nutrition. A meal-prep flatlay (no people).
export const articleNutrition: UnsplashAsset = {
  id: "photo-1490645935967-10de6ba17061",
  src: unsplash("photo-1490645935967-10de6ba17061", 1200),
  alt: {
    ar: "وجبة متوازنة بالبروتين والكارب",
    en: "Balanced plate with protein and carbs",
  },
};

// Article 3 — recovery / sleep. Empty gym at low light.
export const articleRecovery: UnsplashAsset = {
  id: "photo-1540497077202-7c8a3999166f",
  src: unsplash("photo-1540497077202-7c8a3999166f", 1200),
  alt: {
    ar: "صالة جيم هادئة بعد التدريب",
    en: "Quiet gym after a session",
  },
};

// Results page hero — wide locker-room / studio shot.
export const resultsHero: UnsplashAsset = {
  id: "photo-1571019613454-1cb2f99b2d8b",
  src: unsplash("photo-1571019613454-1cb2f99b2d8b", 1800),
  alt: {
    ar: "صالة تدريب مفتوحة بضوء طبيعي",
    en: "Open training floor with natural light",
  },
};
