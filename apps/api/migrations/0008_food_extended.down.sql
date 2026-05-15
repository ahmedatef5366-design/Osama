DROP INDEX IF EXISTS idx_food_locale;
DROP INDEX IF EXISTS idx_food_category;
DROP INDEX IF EXISTS idx_food_source_pair;

ALTER TABLE food_database
  DROP COLUMN IF EXISTS locale_tags,
  DROP COLUMN IF EXISTS source_id,
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS serving_label_ar,
  DROP COLUMN IF EXISTS serving_label,
  DROP COLUMN IF EXISTS serving_size_grams,
  DROP COLUMN IF EXISTS sodium_mg_per_100g,
  DROP COLUMN IF EXISTS saturated_fat_per_100g,
  DROP COLUMN IF EXISTS sugar_per_100g,
  DROP COLUMN IF EXISTS fiber_per_100g;
