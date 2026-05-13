-- ════════════════════════════════════════
-- Weight log
-- ════════════════════════════════════════

-- name: InsertWeightLog :exec
INSERT INTO weight_log (client_id, logged_at, weight_kg, notes)
VALUES ($1, $2, $3, $4);

-- name: ListWeightLog :many
SELECT client_id, logged_at, weight_kg, notes
FROM weight_log
WHERE client_id = $1
  AND logged_at >= sqlc.arg('from_ts')::timestamptz
  AND logged_at <= sqlc.arg('to_ts')::timestamptz
ORDER BY logged_at DESC;

-- name: LatestWeight :one
SELECT client_id, logged_at, weight_kg, notes
FROM weight_log
WHERE client_id = $1
ORDER BY logged_at DESC
LIMIT 1;

-- ════════════════════════════════════════
-- Body measurements
-- ════════════════════════════════════════

-- name: InsertBodyMeasurement :exec
INSERT INTO body_measurements (
  client_id, measured_at, weight_kg, waist_cm, chest_cm,
  shoulders_cm, hips_cm, left_arm_cm, right_arm_cm,
  left_thigh_cm, right_thigh_cm, body_fat_percent, notes
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
);

-- name: ListBodyMeasurements :many
SELECT client_id, measured_at, weight_kg, waist_cm, chest_cm,
       shoulders_cm, hips_cm, left_arm_cm, right_arm_cm,
       left_thigh_cm, right_thigh_cm, body_fat_percent, notes
FROM body_measurements
WHERE client_id = $1
ORDER BY measured_at DESC
LIMIT $2 OFFSET $3;

-- name: LatestBodyMeasurement :one
SELECT client_id, measured_at, weight_kg, waist_cm, chest_cm,
       shoulders_cm, hips_cm, left_arm_cm, right_arm_cm,
       left_thigh_cm, right_thigh_cm, body_fat_percent, notes
FROM body_measurements
WHERE client_id = $1
ORDER BY measured_at DESC
LIMIT 1;

-- ════════════════════════════════════════
-- Progress photos
-- ════════════════════════════════════════

-- name: InsertProgressPhoto :one
INSERT INTO progress_photos (client_id, photo_url, public_id, taken_at, pose, note, show_on_landing)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, client_id, photo_url, public_id, taken_at, pose, note, show_on_landing, created_at;

-- name: ListProgressPhotos :many
SELECT id, client_id, photo_url, public_id, taken_at, pose, note, show_on_landing, created_at
FROM progress_photos
WHERE client_id = $1
ORDER BY taken_at DESC
LIMIT $2 OFFSET $3;

-- name: DeleteProgressPhoto :exec
DELETE FROM progress_photos
WHERE id = $1 AND client_id = $2;

-- name: GetProgressPhoto :one
SELECT id, client_id, photo_url, public_id, taken_at, pose, note, show_on_landing, created_at
FROM progress_photos
WHERE id = $1;

-- name: ListLandingPhotos :many
SELECT id, client_id, photo_url, public_id, taken_at, pose, note, show_on_landing, created_at
FROM progress_photos
WHERE show_on_landing = true
ORDER BY taken_at DESC
LIMIT $1;
