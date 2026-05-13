-- ════════════════════════════════════════
-- Messages
-- ════════════════════════════════════════

-- name: CreateMessage :one
INSERT INTO messages (from_user_id, to_user_id, content)
VALUES ($1, $2, $3)
RETURNING id, from_user_id, to_user_id, content, read_at, created_at;

-- name: ListMessagesBetweenUsers :many
SELECT id, from_user_id, to_user_id, content, read_at, created_at
FROM messages
WHERE (from_user_id = $1 AND to_user_id = $2)
   OR (from_user_id = $2 AND to_user_id = $1)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: MarkMessagesRead :exec
UPDATE messages SET read_at = NOW()
WHERE to_user_id = $1 AND from_user_id = $2 AND read_at IS NULL;

-- name: CountUnreadMessages :one
SELECT COUNT(*)::int
FROM messages
WHERE to_user_id = $1 AND read_at IS NULL;

-- ════════════════════════════════════════
-- Notifications
-- ════════════════════════════════════════

-- name: CreateNotification :one
INSERT INTO notifications (user_id, type, title, body)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, type, title, body, read, created_at;

-- name: ListNotifications :many
SELECT id, user_id, type, title, body, read, created_at
FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: MarkNotificationRead :exec
UPDATE notifications SET read = true
WHERE id = $1 AND user_id = $2;

-- name: MarkAllNotificationsRead :exec
UPDATE notifications SET read = true
WHERE user_id = $1 AND read = false;

-- name: CountUnreadNotifications :one
SELECT COUNT(*)::int
FROM notifications
WHERE user_id = $1 AND read = false;
