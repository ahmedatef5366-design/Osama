// Package auditlog reads and writes the audit_log table. The middleware
// in internal/middleware/audit.go writes one row per admin mutation;
// the admin UI calls List to display them in reverse chronological order.
package auditlog

import (
	"context"
	"encoding/json"
	"net/netip"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

// Entry is the JSON shape returned to the admin UI.
type Entry struct {
	ID         string         `json:"id"`
	UserID     *string        `json:"userId,omitempty"`
	UserEmail  *string        `json:"userEmail,omitempty"`
	Action     string         `json:"action"`
	TargetType *string        `json:"targetType,omitempty"`
	TargetID   *string        `json:"targetId,omitempty"`
	Metadata   map[string]any `json:"metadata,omitempty"`
	IPAddress  *string        `json:"ipAddress,omitempty"`
	CreatedAt  time.Time      `json:"createdAt"`
}

// Service backs both the writer (called from the audit middleware) and
// the admin reader.
type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool} }

// Insert records a single admin action. Errors are returned but the
// caller (middleware) should swallow them — failing audit must not
// fail the underlying admin request.
func (s *Service) Insert(
	ctx context.Context,
	userID pgtype.UUID,
	action, targetType, targetID string,
	metadata map[string]any,
	ip string,
) error {
	var md []byte
	if metadata != nil {
		b, err := json.Marshal(metadata)
		if err == nil {
			md = b
		}
	}
	if md == nil {
		md = []byte(`{}`)
	}

	var (
		tt *string
		tg pgtype.UUID
		ad *netip.Addr
	)
	if targetType != "" {
		v := targetType
		tt = &v
	}
	if targetID != "" {
		// parse the UUID best-effort; failures just leave it null
		var u pgtype.UUID
		if err := u.Scan(targetID); err == nil {
			tg = u
		}
	}
	if ip != "" {
		if a, err := netip.ParseAddr(ip); err == nil {
			ad = &a
		}
	}

	_, err := s.pool.Exec(ctx,
		`INSERT INTO audit_log (user_id, action, target_type, target_id, metadata, ip_address)
		 VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
		userID, action, tt, tg, md, ad,
	)
	return err
}

// ListParams controls pagination + filtering for the admin UI.
type ListParams struct {
	Page     int
	PageSize int
	Action   string // substring match on action
	UserID   string // exact match on user_id
}

// List returns a page of audit entries (newest first) and the total
// matching the same filters.
func (s *Service) List(ctx context.Context, p ListParams) ([]Entry, int64, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PageSize <= 0 || p.PageSize > 200 {
		p.PageSize = 50
	}
	offset := (p.Page - 1) * p.PageSize

	where := "WHERE 1=1"
	args := []any{}
	idx := 1
	if p.Action != "" {
		where += " AND a.action ILIKE $" + itoa(idx)
		args = append(args, "%"+p.Action+"%")
		idx++
	}
	if p.UserID != "" {
		where += " AND a.user_id = $" + itoa(idx)
		args = append(args, p.UserID)
		idx++
	}

	var total int64
	if err := s.pool.QueryRow(ctx,
		`SELECT COUNT(*)::bigint FROM audit_log a `+where, args...,
	).Scan(&total); err != nil {
		return nil, 0, httpx.Internal("audit_count_failed", err)
	}

	q := `SELECT a.id, a.user_id, u.email, a.action, a.target_type, a.target_id,
	             a.metadata, a.ip_address, a.created_at
	        FROM audit_log a
	        LEFT JOIN users u ON u.id = a.user_id
	        ` + where + `
	      ORDER BY a.created_at DESC
	      LIMIT $` + itoa(idx) + ` OFFSET $` + itoa(idx+1)
	args = append(args, p.PageSize, offset)

	rows, err := s.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, httpx.Internal("audit_list_failed", err)
	}
	defer rows.Close()

	out := make([]Entry, 0, p.PageSize)
	for rows.Next() {
		var (
			id, userID, targetID pgtype.UUID
			email                *string
			action               string
			targetType           *string
			metadata             []byte
			ip                   *netip.Addr
			createdAt            pgtype.Timestamptz
		)
		if err := rows.Scan(&id, &userID, &email, &action, &targetType, &targetID, &metadata, &ip, &createdAt); err != nil {
			return nil, 0, httpx.Internal("audit_scan_failed", err)
		}
		e := Entry{
			ID:         uuidString(id),
			Action:     action,
			TargetType: targetType,
		}
		if userID.Valid {
			s := uuidString(userID)
			e.UserID = &s
		}
		if email != nil {
			e.UserEmail = email
		}
		if targetID.Valid {
			s := uuidString(targetID)
			e.TargetID = &s
		}
		if len(metadata) > 0 {
			var m map[string]any
			if err := json.Unmarshal(metadata, &m); err == nil {
				e.Metadata = m
			}
		}
		if ip != nil {
			s := ip.String()
			e.IPAddress = &s
		}
		if createdAt.Valid {
			e.CreatedAt = createdAt.Time
		}
		out = append(out, e)
	}
	return out, total, nil
}

func uuidString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	b := u.Bytes
	const hex = "0123456789abcdef"
	dst := make([]byte, 36)
	srcIdx := 0
	for i := 0; i < 36; i++ {
		switch i {
		case 8, 13, 18, 23:
			dst[i] = '-'
		default:
			dst[i] = hex[b[srcIdx]>>4]
			i++
			dst[i] = hex[b[srcIdx]&0x0f]
			srcIdx++
		}
	}
	return string(dst)
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	buf := make([]byte, 0, 4)
	neg := false
	if n < 0 {
		neg = true
		n = -n
	}
	for n > 0 {
		buf = append([]byte{byte('0' + n%10)}, buf...)
		n /= 10
	}
	if neg {
		buf = append([]byte{'-'}, buf...)
	}
	return string(buf)
}
