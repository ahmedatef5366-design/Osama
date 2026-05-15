-- Client contact channels + admin-configurable message templates.
--
-- The coach is the platform's primary user. Their day-to-day work
-- happens partly outside the app (WhatsApp follow-ups, Instagram DMs).
-- We add per-client contact fields so the coach can launch those
-- conversations directly from /admin/clients/[id] with a single tap.
--
-- Message templates are pre-canned WhatsApp messages with simple
-- mustache-style placeholders ({name}, {weight}, {streak}, {date}).
-- They live in the DB (not CMS) because they're per-coach operational
-- tooling, not customer-facing landing copy.

ALTER TABLE clients
  ADD COLUMN phone     TEXT,
  ADD COLUMN whatsapp  TEXT,
  ADD COLUMN instagram TEXT;

-- Light-touch format guards. We intentionally don't validate phone
-- numbers strictly — international numbering is a mess — but we
-- prevent absurd lengths and stray whitespace-only strings.
ALTER TABLE clients
  ADD CONSTRAINT clients_phone_len     CHECK (phone     IS NULL OR (length(phone)     BETWEEN 4 AND 32)),
  ADD CONSTRAINT clients_whatsapp_len  CHECK (whatsapp  IS NULL OR (length(whatsapp)  BETWEEN 4 AND 32)),
  ADD CONSTRAINT clients_instagram_len CHECK (instagram IS NULL OR (length(instagram) BETWEEN 1 AND 64));

CREATE TABLE message_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        NOT NULL UNIQUE,
  -- 'checkin_reminder', 'missed_checkin', 'milestone', 'welcome', 'custom'
  category    TEXT        NOT NULL DEFAULT 'custom',
  label_ar    TEXT        NOT NULL,
  label_en    TEXT        NOT NULL,
  body_ar     TEXT        NOT NULL,
  body_en     TEXT        NOT NULL,
  sort_order  INT         NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_message_templates_active_sort ON message_templates(is_active, sort_order);

CREATE TRIGGER message_templates_set_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed with the five canonical coaching follow-ups so the platform is
-- useful from day one.
INSERT INTO message_templates
  (slug, category, label_ar, label_en, body_ar, body_en, sort_order)
VALUES
  ('checkin_reminder', 'checkin_reminder',
   'تذكير المتابعة اليومية', 'Daily check-in reminder',
   'أهلاً {name}، فاكر تسجّل متابعة اليوم؟ خد دقيقتين بس وقولّي يومك إيه.',
   'Hi {name}, don''t forget to log your daily check-in. Two minutes, that''s it.',
   1),
  ('missed_checkin', 'missed_checkin',
   'غاب عن المتابعة', 'Missed check-ins',
   'اشتقتلك يا {name} — مرّ {days} أيام بدون متابعة. كله تمام؟',
   'Hey {name}, it''s been {days} days without a check-in. Everything okay?',
   2),
  ('milestone', 'milestone',
   'تهنئة بإنجاز', 'Milestone congrats',
   'فخور بيك يا {name} 🔥 الـ {streak} يوم متتاليين دول مش هيّنين.',
   'Proud of you {name} 🔥 {streak} days in a row is no joke.',
   3),
  ('welcome', 'welcome',
   'ترحيب', 'Welcome',
   'أهلاً بيك يا {name} 👋 يا ترى مستعد نبدأ؟ خطتك جاهزة على البورتال.',
   'Welcome aboard {name} 👋 Ready to start? Your plan is live in the portal.',
   4),
  ('weekly_plan_update', 'custom',
   'تحديث الخطة الأسبوعي', 'Weekly plan update',
   'يا {name}، حدّثت الخطة بناءً على متابعة هذا الأسبوع. ادخل البورتال وراجعها.',
   'Hey {name}, I''ve updated your plan based on this week''s check-ins. Hop into the portal.',
   5);
