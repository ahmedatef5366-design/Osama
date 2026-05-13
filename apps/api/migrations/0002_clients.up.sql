CREATE TABLE clients (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  age               INT         CHECK (age IS NULL OR (age > 0 AND age < 150)),
  height_cm         NUMERIC(5,1) CHECK (height_cm IS NULL OR height_cm > 0),
  current_weight_kg NUMERIC(5,2) CHECK (current_weight_kg IS NULL OR current_weight_kg > 0),
  sex               TEXT        CHECK (sex IS NULL OR sex IN ('male', 'female')),
  experience_level  TEXT        CHECK (experience_level IS NULL OR experience_level IN ('beginner','intermediate','advanced')),
  goal              TEXT        CHECK (goal IS NULL OR goal IN ('fat_loss','muscle_gain','recomposition','athletic')),
  activity_level    TEXT        CHECK (activity_level IS NULL OR activity_level IN ('sedentary','light','moderate','very','athlete')),
  health_notes      TEXT,
  start_date        DATE,
  target_date       DATE,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_clients_user_id  ON clients(user_id);
CREATE INDEX idx_clients_active   ON clients(is_active) WHERE is_active = TRUE;

CREATE TRIGGER clients_set_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
