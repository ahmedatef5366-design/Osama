-- Extends the food_database with optional macro / serving / categorisation
-- columns so coaches can capture richer information per food and so the
-- search UX can filter by category and locale. All new columns are
-- nullable so existing rows remain valid.
ALTER TABLE food_database
  ADD COLUMN fiber_per_100g          NUMERIC(6,2)
    CHECK (fiber_per_100g          IS NULL OR fiber_per_100g          >= 0),
  ADD COLUMN sugar_per_100g          NUMERIC(6,2)
    CHECK (sugar_per_100g          IS NULL OR sugar_per_100g          >= 0),
  ADD COLUMN saturated_fat_per_100g  NUMERIC(6,2)
    CHECK (saturated_fat_per_100g  IS NULL OR saturated_fat_per_100g  >= 0),
  ADD COLUMN sodium_mg_per_100g      NUMERIC(7,2)
    CHECK (sodium_mg_per_100g      IS NULL OR sodium_mg_per_100g      >= 0),
  ADD COLUMN serving_size_grams      NUMERIC(7,2)
    CHECK (serving_size_grams      IS NULL OR serving_size_grams      > 0),
  ADD COLUMN serving_label           TEXT,
  ADD COLUMN serving_label_ar        TEXT,
  ADD COLUMN category                TEXT,
  ADD COLUMN image_url               TEXT,
  ADD COLUMN source                  TEXT,
  ADD COLUMN source_id               TEXT,
  ADD COLUMN locale_tags             TEXT[] NOT NULL DEFAULT '{}'::text[];

-- The (source, source_id) pair lets the seed/import scripts upsert rows
-- without duplicating entries (e.g. running the Egyptian YAML seed twice
-- or re-running a USDA bulk import).
CREATE UNIQUE INDEX idx_food_source_pair
  ON food_database(source, source_id)
  WHERE source IS NOT NULL AND source_id IS NOT NULL;

CREATE INDEX idx_food_category
  ON food_database(category)
  WHERE category IS NOT NULL;

CREATE INDEX idx_food_locale
  ON food_database USING gin(locale_tags);
