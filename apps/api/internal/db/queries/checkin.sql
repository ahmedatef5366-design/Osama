-- ════════════════════════════════════════
-- Daily check-in
-- ════════════════════════════════════════

-- name: UpsertDailyCheckin :one
INSERT INTO daily_checkin (
  client_id, checkin_date, workout_status, workout_sets_done,
  diet_compliance, cardio_done, cardio_minutes, sleep_quality,
  sleep_hours, water_intake_cups, client_note
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
)
ON CONFLICT (client_id, checkin_date) DO UPDATE SET
  workout_status   = EXCLUDED.workout_status,
  workout_sets_done = EXCLUDED.workout_sets_done,
  diet_compliance  = EXCLUDED.diet_compliance,
  cardio_done      = EXCLUDED.cardio_done,
  cardio_minutes   = EXCLUDED.cardio_minutes,
  sleep_quality    = EXCLUDED.sleep_quality,
  sleep_hours      = EXCLUDED.sleep_hours,
  water_intake_cups = EXCLUDED.water_intake_cups,
  client_note      = EXCLUDED.client_note,
  submitted_at     = NOW()
RETURNING id, client_id, checkin_date, workout_status, workout_sets_done,
          diet_compliance, cardio_done, cardio_minutes, sleep_quality,
          sleep_hours, water_intake_cups, client_note, submitted_at;

-- name: GetDailyCheckin :one
SELECT id, client_id, checkin_date, workout_status, workout_sets_done,
       diet_compliance, cardio_done, cardio_minutes, sleep_quality,
       sleep_hours, water_intake_cups, client_note, submitted_at
FROM daily_checkin
WHERE client_id = $1 AND checkin_date = $2;

-- name: ListDailyCheckins :many
SELECT id, client_id, checkin_date, workout_status, workout_sets_done,
       diet_compliance, cardio_done, cardio_minutes, sleep_quality,
       sleep_hours, water_intake_cups, client_note, submitted_at
FROM daily_checkin
WHERE client_id = $1
ORDER BY checkin_date DESC
LIMIT $2 OFFSET $3;

-- name: CheckinStreak :one
SELECT COUNT(*)::int AS streak
FROM (
  SELECT checkin_date,
         checkin_date - (ROW_NUMBER() OVER (ORDER BY checkin_date DESC))::int AS grp
  FROM daily_checkin
  WHERE client_id = $1
) sub
WHERE grp = (
  SELECT checkin_date - 1::int
  FROM daily_checkin
  WHERE client_id = $1
  ORDER BY checkin_date DESC
  LIMIT 1
);

-- name: CountCheckinsTodayAll :one
SELECT COUNT(*)::int
FROM daily_checkin
WHERE checkin_date = CURRENT_DATE;

-- name: AvgComplianceLast7Days :one
SELECT COALESCE(AVG(diet_compliance), 0)::int AS avg_compliance
FROM daily_checkin
WHERE client_id = $1
  AND checkin_date >= CURRENT_DATE - INTERVAL '7 days';

-- name: ClientsAtRisk :many
SELECT c.id, c.user_id, c.name, c.is_active,
       COALESCE(AVG(dc.diet_compliance), 0)::int AS avg_compliance,
       COUNT(dc.id)::int AS checkin_count
FROM clients c
LEFT JOIN daily_checkin dc ON dc.client_id = c.id
  AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
WHERE c.is_active = true
GROUP BY c.id
HAVING COALESCE(AVG(dc.diet_compliance), 0) < 60
ORDER BY avg_compliance ASC;
