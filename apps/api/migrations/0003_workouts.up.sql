-- ════════════════════════════════════════
-- Exercise library (global, reusable)
-- ════════════════════════════════════════
CREATE TABLE exercise_library (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  name_ar      TEXT,
  muscle_group TEXT        NOT NULL,
  equipment    TEXT,
  instructions TEXT,
  video_url    TEXT,
  created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exercise_library_muscle ON exercise_library(muscle_group);
CREATE INDEX idx_exercise_library_name
  ON exercise_library USING gin(to_tsvector('simple', name));

-- ════════════════════════════════════════
-- Workout plans → days → exercises
-- ════════════════════════════════════════
CREATE TABLE workout_plans (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workout_plans_client ON workout_plans(client_id);
-- Only one active plan per client
CREATE UNIQUE INDEX idx_workout_plans_one_active
  ON workout_plans(client_id) WHERE is_active = TRUE;

CREATE TABLE workout_days (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_number  INT  NOT NULL,
  day_name    TEXT NOT NULL,
  day_name_ar TEXT,
  sort_order  INT  NOT NULL DEFAULT 0,
  UNIQUE (plan_id, day_number)
);
CREATE INDEX idx_workout_days_plan ON workout_days(plan_id);

CREATE TABLE exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id          UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  library_id      UUID REFERENCES exercise_library(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  sets            INT  NOT NULL CHECK (sets > 0),
  reps            TEXT NOT NULL,        -- "8-12" or "10" or "AMRAP"
  rest_seconds    INT  NOT NULL DEFAULT 90 CHECK (rest_seconds >= 0),
  notes           TEXT,
  coach_highlight TEXT,
  video_url       TEXT,
  sort_order      INT  NOT NULL DEFAULT 0
);
CREATE INDEX idx_exercises_day ON exercises(day_id);

-- ════════════════════════════════════════
-- Plan templates (snapshot reuse)
-- ════════════════════════════════════════
CREATE TABLE plan_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  created_by  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_json   JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════
-- Workout logs (set-by-set)
-- ════════════════════════════════════════
CREATE TABLE workout_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  exercise_id UUID        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  set_number  INT         NOT NULL CHECK (set_number > 0),
  weight_kg   NUMERIC(6,2),
  reps_done   INT         CHECK (reps_done IS NULL OR reps_done >= 0),
  completed   BOOLEAN     NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_workout_logs_client_date ON workout_logs(client_id, logged_at DESC);
CREATE INDEX idx_workout_logs_exercise    ON workout_logs(exercise_id, logged_at DESC);
