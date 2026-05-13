CREATE TABLE nutrition_plans (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  mode            TEXT        NOT NULL CHECK (mode IN ('fixed', 'flexible')),
  calories_target INT         CHECK (calories_target IS NULL OR calories_target > 0),
  protein_g       NUMERIC(6,1) CHECK (protein_g IS NULL OR protein_g >= 0),
  carbs_g         NUMERIC(6,1) CHECK (carbs_g   IS NULL OR carbs_g   >= 0),
  fat_g           NUMERIC(6,1) CHECK (fat_g     IS NULL OR fat_g     >= 0),
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_nutrition_plans_client ON nutrition_plans(client_id);
CREATE UNIQUE INDEX idx_nutrition_plans_one_active
  ON nutrition_plans(client_id) WHERE is_active = TRUE;

CREATE TABLE meals (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id    UUID  NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  meal_type  TEXT  NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  sort_order INT   NOT NULL DEFAULT 0,
  food_items JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX idx_meals_plan ON meals(plan_id);

CREATE TABLE food_database (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT         NOT NULL,
  name_ar           TEXT,
  brand             TEXT,
  barcode           TEXT         UNIQUE,
  calories_per_100g NUMERIC(7,2) NOT NULL CHECK (calories_per_100g >= 0),
  protein_per_100g  NUMERIC(6,2) NOT NULL CHECK (protein_per_100g  >= 0),
  carbs_per_100g    NUMERIC(6,2) NOT NULL CHECK (carbs_per_100g    >= 0),
  fat_per_100g      NUMERIC(6,2) NOT NULL CHECK (fat_per_100g      >= 0),
  is_verified       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by        UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_food_name_en   ON food_database USING gin(to_tsvector('simple', name));
CREATE INDEX idx_food_name_ar   ON food_database USING gin(to_tsvector('simple', coalesce(name_ar, '')));
CREATE INDEX idx_food_barcode   ON food_database(barcode) WHERE barcode IS NOT NULL;

CREATE TABLE food_log (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  food_id              UUID         REFERENCES food_database(id) ON DELETE SET NULL,
  logged_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  meal_type            TEXT         CHECK (meal_type IS NULL OR meal_type IN ('breakfast','lunch','dinner','snack')),
  weight_grams         NUMERIC(7,2) NOT NULL CHECK (weight_grams > 0),
  calculated_calories  NUMERIC(7,2) NOT NULL CHECK (calculated_calories >= 0),
  calculated_protein   NUMERIC(6,2) NOT NULL CHECK (calculated_protein  >= 0),
  calculated_carbs     NUMERIC(6,2) NOT NULL CHECK (calculated_carbs    >= 0),
  calculated_fat       NUMERIC(6,2) NOT NULL CHECK (calculated_fat      >= 0),
  custom_food_name     TEXT
);
CREATE INDEX idx_food_log_client_date ON food_log(client_id, logged_at DESC);
