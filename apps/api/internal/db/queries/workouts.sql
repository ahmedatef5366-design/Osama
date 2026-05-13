-- ════════════════════════════════════════
-- Workout plans
-- ════════════════════════════════════════

-- name: ListWorkoutPlansForClient :many
SELECT id, client_id, name, is_active, created_at
FROM workout_plans
WHERE client_id = $1
ORDER BY is_active DESC, created_at DESC;

-- name: GetWorkoutPlan :one
SELECT id, client_id, name, is_active, created_at
FROM workout_plans
WHERE id = $1;

-- name: GetActiveWorkoutPlanForClient :one
SELECT id, client_id, name, is_active, created_at
FROM workout_plans
WHERE client_id = $1 AND is_active = TRUE;

-- name: CreateWorkoutPlan :one
INSERT INTO workout_plans (client_id, name, is_active)
VALUES ($1, $2, $3)
RETURNING id, client_id, name, is_active, created_at;

-- name: UpdateWorkoutPlan :one
UPDATE workout_plans SET
  name      = COALESCE(sqlc.narg('name')::text, name),
  is_active = COALESCE(sqlc.narg('is_active'), is_active)
WHERE id = sqlc.arg('id')
RETURNING id, client_id, name, is_active, created_at;

-- name: DeactivateOtherWorkoutPlans :exec
-- Used inside a transaction when activating a plan to enforce one-active rule.
UPDATE workout_plans
SET is_active = FALSE
WHERE client_id = $1 AND id <> $2;

-- name: DeleteWorkoutPlan :exec
DELETE FROM workout_plans WHERE id = $1;

-- ════════════════════════════════════════
-- Workout days
-- ════════════════════════════════════════

-- name: ListWorkoutDaysForPlan :many
SELECT id, plan_id, day_number, day_name, day_name_ar, sort_order
FROM workout_days
WHERE plan_id = $1
ORDER BY sort_order ASC, day_number ASC;

-- name: GetWorkoutDay :one
SELECT id, plan_id, day_number, day_name, day_name_ar, sort_order
FROM workout_days
WHERE id = $1;

-- name: CreateWorkoutDay :one
INSERT INTO workout_days (plan_id, day_number, day_name, day_name_ar, sort_order)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, plan_id, day_number, day_name, day_name_ar, sort_order;

-- name: UpdateWorkoutDay :one
UPDATE workout_days SET
  day_number  = COALESCE(sqlc.narg('day_number')::int,  day_number),
  day_name    = COALESCE(sqlc.narg('day_name')::text,   day_name),
  day_name_ar = COALESCE(sqlc.narg('day_name_ar'),      day_name_ar),
  sort_order  = COALESCE(sqlc.narg('sort_order')::int,  sort_order)
WHERE id = sqlc.arg('id')
RETURNING id, plan_id, day_number, day_name, day_name_ar, sort_order;

-- name: DeleteWorkoutDay :exec
DELETE FROM workout_days WHERE id = $1;

-- ════════════════════════════════════════
-- Exercises (rows inside a day)
-- ════════════════════════════════════════

-- name: ListExercisesForDay :many
SELECT id, day_id, library_id, name, sets, reps, rest_seconds,
       notes, coach_highlight, video_url, sort_order
FROM exercises
WHERE day_id = $1
ORDER BY sort_order ASC;

-- name: ListExercisesForPlan :many
SELECT e.id, e.day_id, e.library_id, e.name, e.sets, e.reps, e.rest_seconds,
       e.notes, e.coach_highlight, e.video_url, e.sort_order
FROM exercises e
JOIN workout_days d ON d.id = e.day_id
WHERE d.plan_id = $1
ORDER BY d.sort_order ASC, e.sort_order ASC;

-- name: GetExercise :one
SELECT id, day_id, library_id, name, sets, reps, rest_seconds,
       notes, coach_highlight, video_url, sort_order
FROM exercises
WHERE id = $1;

-- name: CreateExercise :one
INSERT INTO exercises (
  day_id, library_id, name, sets, reps, rest_seconds, notes,
  coach_highlight, video_url, sort_order
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, day_id, library_id, name, sets, reps, rest_seconds,
          notes, coach_highlight, video_url, sort_order;

-- name: UpdateExercise :one
UPDATE exercises SET
  library_id      = COALESCE(sqlc.narg('library_id'),              library_id),
  name            = COALESCE(sqlc.narg('name')::text,              name),
  sets            = COALESCE(sqlc.narg('sets')::int,               sets),
  reps            = COALESCE(sqlc.narg('reps')::text,              reps),
  rest_seconds    = COALESCE(sqlc.narg('rest_seconds')::int,       rest_seconds),
  notes           = COALESCE(sqlc.narg('notes'),                   notes),
  coach_highlight = COALESCE(sqlc.narg('coach_highlight'),         coach_highlight),
  video_url       = COALESCE(sqlc.narg('video_url'),               video_url),
  sort_order      = COALESCE(sqlc.narg('sort_order')::int,         sort_order)
WHERE id = sqlc.arg('id')
RETURNING id, day_id, library_id, name, sets, reps, rest_seconds,
          notes, coach_highlight, video_url, sort_order;

-- name: DeleteExercise :exec
DELETE FROM exercises WHERE id = $1;

-- ════════════════════════════════════════
-- Plan templates
-- ════════════════════════════════════════

-- name: ListPlanTemplates :many
SELECT id, name, description, created_by, plan_json, created_at
FROM plan_templates
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountPlanTemplates :one
SELECT COUNT(*)::bigint FROM plan_templates;

-- name: GetPlanTemplate :one
SELECT id, name, description, created_by, plan_json, created_at
FROM plan_templates
WHERE id = $1;

-- name: CreatePlanTemplate :one
INSERT INTO plan_templates (name, description, created_by, plan_json)
VALUES ($1, $2, $3, $4)
RETURNING id, name, description, created_by, plan_json, created_at;

-- name: DeletePlanTemplate :exec
DELETE FROM plan_templates WHERE id = $1;

-- ════════════════════════════════════════
-- Workout logs
-- ════════════════════════════════════════

-- name: ListWorkoutLogsForClient :many
SELECT id, client_id, exercise_id, logged_at, set_number, weight_kg, reps_done, completed
FROM workout_logs
WHERE client_id = sqlc.arg('client_id')
  AND (sqlc.narg('exercise_id')::uuid IS NULL OR exercise_id = sqlc.narg('exercise_id')::uuid)
  AND (sqlc.narg('since')::timestamptz IS NULL OR logged_at >= sqlc.narg('since')::timestamptz)
ORDER BY logged_at DESC
LIMIT sqlc.arg('row_limit')::int OFFSET sqlc.arg('row_offset')::int;

-- name: CreateWorkoutLog :one
INSERT INTO workout_logs (
  client_id, exercise_id, logged_at, set_number, weight_kg, reps_done, completed
) VALUES ($1, $2, COALESCE($3, NOW()), $4, $5, $6, $7)
RETURNING id, client_id, exercise_id, logged_at, set_number, weight_kg, reps_done, completed;

-- name: BulkInsertWorkoutLogs :exec
-- One row per element in the parallel arrays. Used when the client submits
-- a finished session (all sets at once) — saves N round-trips.
INSERT INTO workout_logs (client_id, exercise_id, set_number, weight_kg, reps_done, completed)
SELECT
  sqlc.arg('client_id')::uuid,
  unnest(sqlc.arg('exercise_ids')::uuid[]),
  unnest(sqlc.arg('set_numbers')::int[]),
  unnest(sqlc.arg('weights_kg')::numeric[]),
  unnest(sqlc.arg('reps_done')::int[]),
  unnest(sqlc.arg('completed')::boolean[]);

-- name: GetLatestLogForExercise :one
SELECT id, client_id, exercise_id, logged_at, set_number, weight_kg, reps_done, completed
FROM workout_logs
WHERE client_id = $1 AND exercise_id = $2
ORDER BY logged_at DESC, set_number DESC
LIMIT 1;
