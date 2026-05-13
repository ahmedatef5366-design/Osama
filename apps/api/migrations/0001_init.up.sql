-- ════════════════════════════════════════
-- Extensions
-- ════════════════════════════════════════
-- pgcrypto gives us gen_random_uuid() everywhere; citext lets us store
-- emails case-insensitively. Both are available on every Postgres flavour
-- we target (TimescaleDB image, Neon, RDS).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ════════════════════════════════════════
-- Trigger helper: keep updated_at fresh
-- ════════════════════════════════════════
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════
-- Users (core auth)
-- ════════════════════════════════════════
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT      NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,           -- bcrypt cost 12
  role          TEXT        NOT NULL CHECK (role IN ('admin', 'client')),
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ════════════════════════════════════════
-- Audit log (admin actions)
-- ════════════════════════════════════════
CREATE TABLE audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  target_type TEXT,
  target_id   UUID,
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_target ON audit_log(target_type, target_id);

-- ════════════════════════════════════════
-- Notifications
-- ════════════════════════════════════════
CREATE TABLE notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  body       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user
  ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC) WHERE read = FALSE;
