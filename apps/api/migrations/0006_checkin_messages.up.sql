CREATE TABLE daily_checkin (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  checkin_date      DATE         NOT NULL,
  workout_status    TEXT         CHECK (workout_status IS NULL OR workout_status IN ('completed','partial','skipped')),
  workout_sets_done INT          CHECK (workout_sets_done IS NULL OR workout_sets_done >= 0),
  diet_compliance   INT          CHECK (diet_compliance IS NULL OR diet_compliance BETWEEN 0 AND 100),
  cardio_done       BOOLEAN,
  cardio_minutes    INT          CHECK (cardio_minutes IS NULL OR cardio_minutes >= 0),
  sleep_quality     INT          CHECK (sleep_quality IS NULL OR sleep_quality BETWEEN 1 AND 5),
  sleep_hours       NUMERIC(3,1) CHECK (sleep_hours IS NULL OR sleep_hours BETWEEN 0 AND 24),
  water_intake_cups INT          CHECK (water_intake_cups IS NULL OR water_intake_cups >= 0),
  client_note       TEXT,
  submitted_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, checkin_date)
);
CREATE INDEX idx_checkin_client_date ON daily_checkin(client_id, checkin_date DESC);

CREATE TABLE messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL CHECK (length(content) > 0),
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_user_id <> to_user_id)
);
CREATE INDEX idx_messages_thread
  ON messages(from_user_id, to_user_id, created_at DESC);
CREATE INDEX idx_messages_inbox_unread
  ON messages(to_user_id, created_at DESC) WHERE read_at IS NULL;
