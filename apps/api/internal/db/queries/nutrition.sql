-- ════════════════════════════════════════
-- Nutrition plans
-- ════════════════════════════════════════

-- name: ListNutritionPlansForClient :many
SELECT id, client_id, mode, calories_target, protein_g, carbs_g, fat_g, is_active, created_at
FROM nutrition_plans
WHERE client_id = $1
ORDER BY is_active DESC, created_at DESC;

-- name: GetNutritionPlan :one
SELECT id, client_id, mode, calories_target, protein_g, carbs_g, fat_g, is_active, created_at
FROM nutrition_plans
WHERE id = $1;

-- name: GetActiveNutritionPlanForClient :one
SELECT id, client_id, mode, calories_target, protein_g, carbs_g, fat_g, is_active, created_at
FROM nutrition_plans
WHERE client_id = $1 AND is_active = TRUE;

-- name: CreateNutritionPlan :one
INSERT INTO nutrition_plans (
  client_id, mode, calories_target, protein_g, carbs_g, fat_g, is_active
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, client_id, mode, calories_target, protein_g, carbs_g, fat_g, is_active, created_at;

-- name: UpdateNutritionPlan :one
UPDATE nutrition_plans SET
  mode            = COALESCE(sqlc.narg('mode')::text,          mode),
  calories_target = COALESCE(sqlc.narg('calories_target'),     calories_target),
  protein_g       = COALESCE(sqlc.narg('protein_g'),           protein_g),
  carbs_g         = COALESCE(sqlc.narg('carbs_g'),             carbs_g),
  fat_g           = COALESCE(sqlc.narg('fat_g'),               fat_g),
  is_active       = COALESCE(sqlc.narg('is_active'),           is_active)
WHERE id = sqlc.arg('id')
RETURNING id, client_id, mode, calories_target, protein_g, carbs_g, fat_g, is_active, created_at;

-- name: DeactivateOtherNutritionPlans :exec
UPDATE nutrition_plans SET is_active = FALSE
WHERE client_id = $1 AND id <> $2;

-- name: DeleteNutritionPlan :exec
DELETE FROM nutrition_plans WHERE id = $1;

-- ════════════════════════════════════════
-- Meals (rows inside a plan)
-- ════════════════════════════════════════

-- name: ListMealsForPlan :many
SELECT id, plan_id, meal_type, sort_order, food_items
FROM meals
WHERE plan_id = $1
ORDER BY sort_order ASC;

-- name: GetMeal :one
SELECT id, plan_id, meal_type, sort_order, food_items
FROM meals WHERE id = $1;

-- name: CreateMeal :one
INSERT INTO meals (plan_id, meal_type, sort_order, food_items)
VALUES ($1, $2, $3, $4)
RETURNING id, plan_id, meal_type, sort_order, food_items;

-- name: UpdateMeal :one
UPDATE meals SET
  meal_type  = COALESCE(sqlc.narg('meal_type')::text, meal_type),
  sort_order = COALESCE(sqlc.narg('sort_order')::int, sort_order),
  food_items = COALESCE(sqlc.narg('food_items'),      food_items)
WHERE id = sqlc.arg('id')
RETURNING id, plan_id, meal_type, sort_order, food_items;

-- name: DeleteMeal :exec
DELETE FROM meals WHERE id = $1;

-- ════════════════════════════════════════
-- Food database (global, reusable)
-- ════════════════════════════════════════

-- name: SearchFood :many
SELECT id, name, name_ar, brand, barcode,
       calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
       is_verified, created_at
FROM food_database
WHERE (
  sqlc.narg('search')::text IS NULL
  OR name              ILIKE '%' || sqlc.narg('search')::text || '%'
  OR coalesce(name_ar, '') ILIKE '%' || sqlc.narg('search')::text || '%'
  OR coalesce(brand, '')   ILIKE '%' || sqlc.narg('search')::text || '%'
)
ORDER BY is_verified DESC, name ASC
LIMIT $1 OFFSET $2;

-- name: CountFood :one
SELECT COUNT(*)::bigint
FROM food_database
WHERE (
  sqlc.narg('search')::text IS NULL
  OR name              ILIKE '%' || sqlc.narg('search')::text || '%'
  OR coalesce(name_ar, '') ILIKE '%' || sqlc.narg('search')::text || '%'
  OR coalesce(brand, '')   ILIKE '%' || sqlc.narg('search')::text || '%'
);

-- name: GetFoodByID :one
SELECT id, name, name_ar, brand, barcode,
       calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
       is_verified, created_at
FROM food_database WHERE id = $1;

-- name: GetFoodByBarcode :one
SELECT id, name, name_ar, brand, barcode,
       calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
       is_verified, created_at
FROM food_database WHERE barcode = $1;

-- name: CreateFood :one
INSERT INTO food_database (
  name, name_ar, brand, barcode,
  calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
  is_verified, created_by
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, name, name_ar, brand, barcode,
          calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
          is_verified, created_at;

-- name: UpdateFood :one
UPDATE food_database SET
  name              = COALESCE(sqlc.narg('name')::text,                  name),
  name_ar           = COALESCE(sqlc.narg('name_ar'),                     name_ar),
  brand             = COALESCE(sqlc.narg('brand'),                       brand),
  barcode           = COALESCE(sqlc.narg('barcode'),                     barcode),
  calories_per_100g = COALESCE(sqlc.narg('calories_per_100g')::numeric,  calories_per_100g),
  protein_per_100g  = COALESCE(sqlc.narg('protein_per_100g')::numeric,   protein_per_100g),
  carbs_per_100g    = COALESCE(sqlc.narg('carbs_per_100g')::numeric,     carbs_per_100g),
  fat_per_100g      = COALESCE(sqlc.narg('fat_per_100g')::numeric,       fat_per_100g),
  is_verified       = COALESCE(sqlc.narg('is_verified'),                 is_verified)
WHERE id = sqlc.arg('id')
RETURNING id, name, name_ar, brand, barcode,
          calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
          is_verified, created_at;

-- name: DeleteFood :exec
DELETE FROM food_database WHERE id = $1;

-- ════════════════════════════════════════
-- Food log (client logs intake)
-- ════════════════════════════════════════

-- name: ListFoodLogForClient :many
SELECT id, client_id, food_id, logged_at, meal_type, weight_grams,
       calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
       custom_food_name
FROM food_log
WHERE client_id = sqlc.arg('client_id')
  AND (sqlc.narg('since')::timestamptz IS NULL OR logged_at >= sqlc.narg('since')::timestamptz)
  AND (sqlc.narg('until')::timestamptz IS NULL OR logged_at <  sqlc.narg('until')::timestamptz)
ORDER BY logged_at DESC
LIMIT sqlc.arg('row_limit')::int OFFSET sqlc.arg('row_offset')::int;

-- name: SumFoodLogForDay :one
-- Calorie / macro totals for a client between two timestamps.
SELECT
  COALESCE(SUM(calculated_calories), 0)::numeric AS total_calories,
  COALESCE(SUM(calculated_protein),  0)::numeric AS total_protein,
  COALESCE(SUM(calculated_carbs),    0)::numeric AS total_carbs,
  COALESCE(SUM(calculated_fat),      0)::numeric AS total_fat
FROM food_log
WHERE client_id = $1 AND logged_at >= $2 AND logged_at < $3;

-- name: CreateFoodLog :one
INSERT INTO food_log (
  client_id, food_id, logged_at, meal_type, weight_grams,
  calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
  custom_food_name
) VALUES (
  $1, $2, COALESCE($3, NOW()), $4, $5, $6, $7, $8, $9, $10
)
RETURNING id, client_id, food_id, logged_at, meal_type, weight_grams,
          calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
          custom_food_name;

-- name: DeleteFoodLog :exec
DELETE FROM food_log WHERE id = $1 AND client_id = $2;
