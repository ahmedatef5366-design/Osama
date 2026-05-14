-- ════════════════════════════════════════
-- PR-C: SaaS polish
--
-- Three additions stack on the platform's existing CMS + auth:
--   1. branding   — a singleton row the coach edits to personalise the
--                   product (display name, tagline, logo URL, accent
--                   colour, public contact details). Everything is
--                   non-secret and intentionally embedded in the public
--                   landing payload.
--   2. client_invites — token-gated client onboarding. The admin no
--                   longer has to type a temporary password; they
--                   create an invite, hand the link to the trainee,
--                   and the trainee sets their own password via a
--                   public page. Tokens are random_bytes(32), hashed
--                   at rest, single-use, and expire after 7 days.
--   3. audit_log durability — the table already exists from migration
--                   0001 but nothing was ever written to it. The
--                   middleware already in the code path will start
--                   inserting rows once this PR ships; the index here
--                   covers the dashboard "list newest first" query.
-- ════════════════════════════════════════

-- ── Branding (singleton) ────────────────────────────────────
CREATE TABLE branding (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_name      TEXT         NOT NULL DEFAULT 'Osama',
  tagline_ar      TEXT         NOT NULL DEFAULT '',
  tagline_en      TEXT         NOT NULL DEFAULT '',
  logo_url        TEXT         NOT NULL DEFAULT '',
  accent_color    TEXT         NOT NULL DEFAULT '#22d3ee'
                    CHECK (accent_color ~* '^#[0-9a-f]{6}$'),
  whatsapp_number TEXT         NOT NULL DEFAULT ''
                    CHECK (whatsapp_number = '' OR length(whatsapp_number) BETWEEN 4 AND 32),
  support_email   TEXT         NOT NULL DEFAULT ''
                    CHECK (support_email = '' OR support_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  instagram_url   TEXT         NOT NULL DEFAULT '',
  -- Singleton guard: we only ever want one row. The unique index on
  -- the constant `singleton` column prevents accidental inserts.
  singleton       BOOLEAN      NOT NULL DEFAULT TRUE,
  updated_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_branding_singleton ON branding(singleton);

CREATE TRIGGER branding_set_updated_at
  BEFORE UPDATE ON branding
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed the singleton so GET /api/branding always returns something
-- even before the admin touches the editor.
INSERT INTO branding (coach_name, tagline_ar, tagline_en)
VALUES ('Osama', 'دربك للتحول.', 'Your path to transformation.');

-- ── Client invites ──────────────────────────────────────────
-- Token is sha256-hashed before storage so a DB leak doesn't hand
-- the attacker working invite URLs. The plaintext token is only ever
-- exposed once, in the create response.
CREATE TABLE client_invites (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT       NOT NULL,
  name          TEXT         NOT NULL,
  token_hash    TEXT         NOT NULL UNIQUE,
  status        TEXT         NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','revoked','expired')),
  invited_by    UUID         REFERENCES users(id) ON DELETE SET NULL,
  accepted_user UUID         REFERENCES users(id) ON DELETE SET NULL,
  expires_at    TIMESTAMPTZ  NOT NULL,
  accepted_at   TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_invites_status  ON client_invites(status, created_at DESC);
CREATE INDEX idx_client_invites_email   ON client_invites(email);

-- ── Audit log extras ───────────────────────────────────────
-- The base table already has the "by user" and "by target" indexes
-- from 0001_init. The admin viewer paginates strictly by created_at
-- so we add a chronological index that doesn't depend on user_id.
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
