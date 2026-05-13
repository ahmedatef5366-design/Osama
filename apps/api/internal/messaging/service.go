package messaging

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

func (s *Service) Send(ctx context.Context, fromUserID pgtype.UUID, req SendMessageRequest) (Message, error) {
	if req.Content == "" {
		return Message{}, httpx.BadRequest("empty_content", "message content cannot be empty")
	}
	toUID, err := pgxutil.UUIDFromString(req.ToUserID)
	if err != nil {
		return Message{}, httpx.BadRequest("invalid_to_user_id", "toUserId must be a UUID")
	}

	var id pgtype.UUID
	var readAt *time.Time
	var createdAt pgtype.Timestamptz
	var m Message
	err = s.pool.QueryRow(ctx,
		`INSERT INTO messages (from_user_id, to_user_id, content)
		 VALUES ($1, $2, $3)
		 RETURNING id, from_user_id, to_user_id, content, read_at, created_at`,
		fromUserID, toUID, req.Content,
	).Scan(&id, &fromUserID, &toUID, &m.Content, &readAt, &createdAt)
	if err != nil {
		return Message{}, httpx.Internal("message_send_failed", err)
	}
	m.ID = pgxutil.UUIDToString(id)
	m.FromUserID = pgxutil.UUIDToString(fromUserID)
	m.ToUserID = pgxutil.UUIDToString(toUID)
	m.ReadAt = readAt
	if createdAt.Valid {
		m.CreatedAt = createdAt.Time
	}
	return m, nil
}

func (s *Service) ListThread(ctx context.Context, userA, userB pgtype.UUID, limit, offset int) ([]Message, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, from_user_id, to_user_id, content, read_at, created_at
		 FROM messages
		 WHERE (from_user_id = $1 AND to_user_id = $2)
		    OR (from_user_id = $2 AND to_user_id = $1)
		 ORDER BY created_at DESC
		 LIMIT $3 OFFSET $4`,
		userA, userB, limit, offset,
	)
	if err != nil {
		return nil, httpx.Internal("messages_list_failed", err)
	}
	defer rows.Close()

	var out []Message
	for rows.Next() {
		var id, from, to pgtype.UUID
		var readAt *time.Time
		var createdAt pgtype.Timestamptz
		var m Message
		if err := rows.Scan(&id, &from, &to, &m.Content, &readAt, &createdAt); err != nil {
			return nil, httpx.Internal("message_scan_failed", err)
		}
		m.ID = pgxutil.UUIDToString(id)
		m.FromUserID = pgxutil.UUIDToString(from)
		m.ToUserID = pgxutil.UUIDToString(to)
		m.ReadAt = readAt
		if createdAt.Valid {
			m.CreatedAt = createdAt.Time
		}
		out = append(out, m)
	}
	if out == nil {
		out = []Message{}
	}
	return out, nil
}

func (s *Service) MarkRead(ctx context.Context, readerID, senderID pgtype.UUID) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE messages SET read_at = NOW()
		 WHERE to_user_id = $1 AND from_user_id = $2 AND read_at IS NULL`,
		readerID, senderID,
	)
	if err != nil {
		return httpx.Internal("mark_read_failed", err)
	}
	return nil
}

func (s *Service) ListNotifications(ctx context.Context, userID pgtype.UUID, limit, offset int) ([]Notification, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, user_id, type, title, body, read, created_at
		 FROM notifications
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, httpx.Internal("notifications_list_failed", err)
	}
	defer rows.Close()

	var out []Notification
	for rows.Next() {
		var id, uid pgtype.UUID
		var createdAt pgtype.Timestamptz
		var n Notification
		if err := rows.Scan(&id, &uid, &n.Type, &n.Title, &n.Body, &n.Read, &createdAt); err != nil {
			return nil, httpx.Internal("notification_scan_failed", err)
		}
		n.ID = pgxutil.UUIDToString(id)
		n.UserID = pgxutil.UUIDToString(uid)
		if createdAt.Valid {
			n.CreatedAt = createdAt.Time
		}
		out = append(out, n)
	}
	if out == nil {
		out = []Notification{}
	}
	return out, nil
}

func (s *Service) MarkNotificationRead(ctx context.Context, notifID, userID pgtype.UUID) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
		notifID, userID,
	)
	if err != nil {
		return httpx.Internal("mark_notif_read_failed", err)
	}
	return nil
}

func (s *Service) MarkAllNotificationsRead(ctx context.Context, userID pgtype.UUID) error {
	_, err := s.pool.Exec(ctx,
		`UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
		userID,
	)
	if err != nil {
		return httpx.Internal("mark_all_notif_read_failed", err)
	}
	return nil
}

func (s *Service) CountUnread(ctx context.Context, userID pgtype.UUID) (int, error) {
	var count int
	err := s.pool.QueryRow(ctx,
		`SELECT COUNT(*)::int FROM notifications WHERE user_id = $1 AND read = false`,
		userID,
	).Scan(&count)
	if err != nil {
		return 0, httpx.Internal("count_unread_failed", err)
	}
	return count, nil
}
