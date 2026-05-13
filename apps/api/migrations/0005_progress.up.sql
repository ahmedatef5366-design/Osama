-- ════════════════════════════════════════
-- Progress tracking (TimescaleDB hypertables, with graceful fallback)
-- ════════════════════════════════════════
-- The spec wants weight_log and body_measurements as TimescaleDB
-- hypertables for fast time-window queries. Neon serverless Postgres
-- does NOT support timescaledb, so this migration:
--   1. Creates plain tables (works everywhere).
--   2. Only invokes create_hypertable() if the extension is installed.
-- That way the same SQL runs on Timescale Cloud / RDS / self-hosted
-- AND on Neon, where progress simply uses normal indexed tables.

CREATE TABLE weight_log (
  client_id UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0),
  notes     TEXT
);
CREATE INDEX idx_weight_log_client ON weight_log(client_id, logged_at DESC);

CREATE TABLE body_measurements (
  client_id        UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  measured_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  weight_kg        NUMERIC(5,2),
  waist_cm         NUMERIC(5,1),
  chest_cm         NUMERIC(5,1),
  shoulders_cm     NUMERIC(5,1),
  hips_cm          NUMERIC(5,1),
  left_arm_cm      NUMERIC(5,1),
  right_arm_cm     NUMERIC(5,1),
  left_thigh_cm    NUMERIC(5,1),
  right_thigh_cm   NUMERIC(5,1),
  body_fat_percent NUMERIC(4,1),
  notes            TEXT
);
CREATE INDEX idx_measurements_client
  ON body_measurements(client_id, measured_at DESC);

-- Conditional hypertable promotion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM create_hypertable('weight_log',        'logged_at',   if_not_exists => TRUE);
    PERFORM create_hypertable('body_measurements', 'measured_at', if_not_exists => TRUE);
  END IF;
END
$$;

-- ════════════════════════════════════════
-- Progress photos (Cloudinary signed URLs)
-- ════════════════════════════════════════
CREATE TABLE progress_photos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  photo_url       TEXT        NOT NULL,
  public_id       TEXT        NOT NULL,
  taken_at        DATE        NOT NULL,
  pose            TEXT        CHECK (pose IS NULL OR pose IN ('front','side','back')),
  note            TEXT,
  show_on_landing BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_photos_client_date ON progress_photos(client_id, taken_at DESC);
CREATE INDEX idx_photos_landing
  ON progress_photos(taken_at DESC) WHERE show_on_landing = TRUE;
