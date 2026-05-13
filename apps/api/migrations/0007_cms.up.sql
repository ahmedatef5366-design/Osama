CREATE TABLE site_content (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key  TEXT        NOT NULL UNIQUE,
  content_json JSONB       NOT NULL,
  updated_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE site_content_history (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key  TEXT        NOT NULL,
  content_json JSONB       NOT NULL,
  saved_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
  saved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_site_content_history_section
  ON site_content_history(section_key, saved_at DESC);
