-- ════════════════════════════════════════
-- Admin monitoring dashboard
-- ════════════════════════════════════════

-- name: CountActiveClients :one
SELECT COUNT(*)::int FROM clients WHERE is_active = true;

-- name: AvgComplianceAllClients :one
SELECT COALESCE(AVG(dc.diet_compliance), 0)::int
FROM daily_checkin dc
JOIN clients c ON c.id = dc.client_id
WHERE c.is_active = true
  AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days';

-- name: CountAtRiskClients :one
SELECT COUNT(*)::int FROM (
  SELECT c.id
  FROM clients c
  LEFT JOIN daily_checkin dc ON dc.client_id = c.id
    AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
  WHERE c.is_active = true
  GROUP BY c.id
  HAVING COALESCE(AVG(dc.diet_compliance), 0) < 60
) sub;

-- name: ComplianceTrendLast30Days :many
SELECT dc.checkin_date::date AS day,
       COALESCE(AVG(dc.diet_compliance), 0)::int AS avg_compliance,
       COUNT(dc.id)::int AS checkin_count
FROM daily_checkin dc
JOIN clients c ON c.id = dc.client_id AND c.is_active = true
WHERE dc.checkin_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY dc.checkin_date
ORDER BY dc.checkin_date ASC;

-- name: TopClientsByCompliance :many
SELECT c.id, c.name,
       COALESCE(AVG(dc.diet_compliance), 0)::int AS avg_compliance
FROM clients c
LEFT JOIN daily_checkin dc ON dc.client_id = c.id
  AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
WHERE c.is_active = true
GROUP BY c.id, c.name
ORDER BY avg_compliance DESC
LIMIT $1;

-- name: CheckinsPerDayLast30Days :many
SELECT checkin_date::date AS day, COUNT(*)::int AS count
FROM daily_checkin
WHERE checkin_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY checkin_date
ORDER BY checkin_date ASC;

-- name: InsertAuditLog :exec
INSERT INTO audit_log (user_id, action, target_type, target_id, metadata, ip_address)
VALUES ($1, $2, $3, $4, $5, $6);
