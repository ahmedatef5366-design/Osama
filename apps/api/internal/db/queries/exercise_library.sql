-- name: ListExerciseLibrary :many
SELECT id, name, name_ar, muscle_group, equipment, instructions, video_url, created_at
FROM exercise_library
WHERE (sqlc.narg('muscle_group')::text IS NULL OR muscle_group = sqlc.narg('muscle_group')::text)
  AND (
    sqlc.narg('search')::text IS NULL
    OR name    ILIKE '%' || sqlc.narg('search')::text || '%'
    OR coalesce(name_ar, '') ILIKE '%' || sqlc.narg('search')::text || '%'
  )
ORDER BY name ASC
LIMIT $1 OFFSET $2;

-- name: CountExerciseLibrary :one
SELECT COUNT(*)::bigint
FROM exercise_library
WHERE (sqlc.narg('muscle_group')::text IS NULL OR muscle_group = sqlc.narg('muscle_group')::text)
  AND (
    sqlc.narg('search')::text IS NULL
    OR name    ILIKE '%' || sqlc.narg('search')::text || '%'
    OR coalesce(name_ar, '') ILIKE '%' || sqlc.narg('search')::text || '%'
  );

-- name: GetExerciseLibraryEntry :one
SELECT id, name, name_ar, muscle_group, equipment, instructions, video_url, created_at
FROM exercise_library
WHERE id = $1;

-- name: CreateExerciseLibraryEntry :one
INSERT INTO exercise_library (
  name, name_ar, muscle_group, equipment, instructions, video_url, created_by
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, name, name_ar, muscle_group, equipment, instructions, video_url, created_at;

-- name: UpdateExerciseLibraryEntry :one
UPDATE exercise_library SET
  name         = COALESCE(sqlc.narg('name')::text,         name),
  name_ar      = COALESCE(sqlc.narg('name_ar'),            name_ar),
  muscle_group = COALESCE(sqlc.narg('muscle_group')::text, muscle_group),
  equipment    = COALESCE(sqlc.narg('equipment'),          equipment),
  instructions = COALESCE(sqlc.narg('instructions'),       instructions),
  video_url    = COALESCE(sqlc.narg('video_url'),          video_url)
WHERE id = sqlc.arg('id')
RETURNING id, name, name_ar, muscle_group, equipment, instructions, video_url, created_at;

-- name: DeleteExerciseLibraryEntry :exec
DELETE FROM exercise_library WHERE id = $1;
