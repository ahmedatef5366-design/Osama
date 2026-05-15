-- Tier plans and per-client subscriptions. The platform ships as a
-- white-label SaaS — payment is handled out-of-band; the admin assigns
-- plans manually. The data model is still designed so a payment-gateway
-- adapter could later wire into a webhook that calls Service.Upsert
-- without schema changes.
--
-- subscriptions.client_id is UNIQUE because at any moment a client has
-- exactly one active record. Plan changes are recorded as
-- subscription_history rows so the admin can see how a client's
-- billing history evolved over time.

CREATE TABLE plans (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT         NOT NULL UNIQUE,
  name              JSONB        NOT NULL,
  description       JSONB,
  monthly_price_egp INT          NOT NULL CHECK (monthly_price_egp >= 0),
  features          JSONB        NOT NULL,
  max_clients       INT          NOT NULL DEFAULT 0,
  sort_order        INT          NOT NULL DEFAULT 0,
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_plans_active_sort ON plans(is_active, sort_order);

CREATE TRIGGER plans_set_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE subscriptions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  plan_id       UUID        NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status        TEXT        NOT NULL CHECK (status IN ('trial','active','expired','canceled')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  trial_until   TIMESTAMPTZ,
  cancel_reason TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_plan   ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE subscription_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id     UUID        NOT NULL REFERENCES plans(id),
  status      TEXT        NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL,
  expires_at  TIMESTAMPTZ,
  changed_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note        TEXT
);
CREATE INDEX idx_sub_history_client ON subscription_history(client_id, changed_at DESC);

-- Seed the canonical three tiers. Slugs are the stable contract used by
-- the web UI and any future payment adapter; prices/names can be edited
-- in /admin/subscriptions without breaking integrations.
INSERT INTO plans (slug, name, description, monthly_price_egp, features, sort_order) VALUES
  ('starter', '{"ar":"البداية","en":"Starter"}'::jsonb,
   '{"ar":"للي بيبدأ رحلته","en":"For getting started"}'::jsonb,
   900,
   '[
     {"ar":"خطة تمرين ثابتة (٣ أيام)","en":"Fixed training plan (3 days)"},
     {"ar":"خطة تغذية ثابتة","en":"Fixed nutrition plan"},
     {"ar":"متابعة أسبوعية","en":"Weekly check-ins"},
     {"ar":"دعم بالواتساب","en":"WhatsApp support"}
   ]'::jsonb,
   1),
  ('pro', '{"ar":"المحترف","en":"Pro"}'::jsonb,
   '{"ar":"الباقة الأكثر اختياراً","en":"Most popular"}'::jsonb,
   1500,
   '[
     {"ar":"خطة تمرين مخصصة كاملة","en":"Fully custom training plan"},
     {"ar":"خطة تغذية ديناميكية","en":"Dynamic nutrition plan"},
     {"ar":"متابعة يومية","en":"Daily check-ins"},
     {"ar":"تعديل الخطة كل أسبوعين","en":"Plan revision every 2 weeks"},
     {"ar":"تواصل مباشر مع المدرب","en":"Direct coach messaging"}
   ]'::jsonb,
   2),
  ('elite', '{"ar":"النخبة","en":"Elite"}'::jsonb,
   '{"ar":"تجربة شخصية متكاملة","en":"Full white-glove coaching"}'::jsonb,
   3000,
   '[
     {"ar":"كل ما في باقة المحترف","en":"Everything in Pro"},
     {"ar":"اتصال فيديو أسبوعي","en":"Weekly video call"},
     {"ar":"تعديل الخطة كل أسبوع","en":"Plan revision every week"},
     {"ar":"خطة تكميلات (Supplements)","en":"Supplements protocol"},
     {"ar":"أولوية في الرد","en":"Priority response"}
   ]'::jsonb,
   3);
