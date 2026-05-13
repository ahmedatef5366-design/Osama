-- name: ListClients :many
SELECT id, user_id, name, age, height_cm, current_weight_kg, sex,
       experience_level, goal, activity_level, health_notes,
       start_date, target_date, is_active, created_at, updated_at
FROM clients
WHERE (sqlc.narg('active_only')::boolean IS NULL OR is_active = sqlc.narg('active_only')::boolean)
  AND (sqlc.narg('search')::text IS NULL OR name ILIKE '%' || sqlc.narg('search')::text || '%')
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountClients :one
SELECT COUNT(*)::bigint
FROM clients
WHERE (sqlc.narg('active_only')::boolean IS NULL OR is_active = sqlc.narg('active_only')::boolean)
  AND (sqlc.narg('search')::text   IS NULL OR name ILIKE '%' || sqlc.narg('search')::text   || '%');

-- name: GetClient :one
SELECT id, user_id, name, age, height_cm, current_weight_kg, sex,
       experience_level, goal, activity_level, health_notes,
       start_date, target_date, is_active, created_at, updated_at
FROM clients
WHERE id = $1;

-- name: GetClientByUserID :one
SELECT id, user_id, name, age, height_cm, current_weight_kg, sex,
       experience_level, goal, activity_level, health_notes,
       start_date, target_date, is_active, created_at, updated_at
FROM clients
WHERE user_id = $1;

-- name: CreateClient :one
INSERT INTO clients (
  user_id, name, age, height_cm, current_weight_kg, sex,
  experience_level, goal, activity_level, health_notes,
  start_date, target_date
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
RETURNING id, user_id, name, age, height_cm, current_weight_kg, sex,
          experience_level, goal, activity_level, health_notes,
          start_date, target_date, is_active, created_at, updated_at;

-- name: UpdateClient :one
UPDATE clients SET
  name              = COALESCE(sqlc.narg('name'),              name),
  age               = COALESCE(sqlc.narg('age'),               age),
  height_cm         = COALESCE(sqlc.narg('height_cm'),         height_cm),
  current_weight_kg = COALESCE(sqlc.narg('current_weight_kg'), current_weight_kg),
  sex               = COALESCE(sqlc.narg('sex'),               sex),
  experience_level  = COALESCE(sqlc.narg('experience_level'),  experience_level),
  goal              = COALESCE(sqlc.narg('goal'),              goal),
  activity_level    = COALESCE(sqlc.narg('activity_level'),    activity_level),
  health_notes      = COALESCE(sqlc.narg('health_notes'),      health_notes),
  start_date        = COALESCE(sqlc.narg('start_date'),        start_date),
  target_date       = COALESCE(sqlc.narg('target_date'),       target_date),
  is_active         = COALESCE(sqlc.narg('is_active'),         is_active)
WHERE id = sqlc.arg('id')
RETURNING id, user_id, name, age, height_cm, current_weight_kg, sex,
          experience_level, goal, activity_level, health_notes,
          start_date, target_date, is_active, created_at, updated_at;
