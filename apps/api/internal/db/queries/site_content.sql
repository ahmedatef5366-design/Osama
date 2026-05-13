-- name: GetSiteContent :one
SELECT section_key, content_json, updated_by, updated_at
FROM site_content
WHERE section_key = $1;

-- name: ListSiteContent :many
SELECT section_key, content_json, updated_by, updated_at
FROM site_content
ORDER BY section_key ASC;

-- name: UpsertSiteContent :one
INSERT INTO site_content (section_key, content_json, updated_by, updated_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (section_key) DO UPDATE SET
  content_json = EXCLUDED.content_json,
  updated_by   = EXCLUDED.updated_by,
  updated_at   = NOW()
RETURNING section_key, content_json, updated_by, updated_at;

-- name: InsertSiteContentHistory :one
INSERT INTO site_content_history (section_key, content_json, saved_by)
VALUES ($1, $2, $3)
RETURNING id, section_key, content_json, saved_by, saved_at;

-- name: ListSiteContentHistory :many
SELECT id, section_key, content_json, saved_by, saved_at
FROM site_content_history
WHERE section_key = $1
ORDER BY saved_at DESC
LIMIT $2 OFFSET $3;

-- name: CountSiteContentHistory :one
SELECT COUNT(*)::bigint
FROM site_content_history
WHERE section_key = $1;

-- name: GetSiteContentHistory :one
SELECT id, section_key, content_json, saved_by, saved_at
FROM site_content_history
WHERE id = $1;
