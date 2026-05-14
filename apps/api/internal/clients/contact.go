package clients

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

// Contact holds the outbound channels the coach uses to reach a client.
// Stored on the clients table (separate from auth.email) because they're
// optional and PII-classified.
type Contact struct {
	Phone     *string `json:"phone,omitempty"`
	WhatsApp  *string `json:"whatsapp,omitempty"`
	Instagram *string `json:"instagram,omitempty"`
}

// ContactPatch carries the same fields but distinguishes "leave alone"
// (pointer is nil) from "clear" (pointer is empty string).
type ContactPatch struct {
	Phone     *string `json:"phone,omitempty"`
	WhatsApp  *string `json:"whatsapp,omitempty"`
	Instagram *string `json:"instagram,omitempty"`
}

// GetContact reads the contact channels for a client. Returns zero-value
// Contact (all nil) if the client exists but has none set.
func (s *Service) GetContact(ctx context.Context, clientID pgtype.UUID) (Contact, error) {
	row := s.pool.QueryRow(ctx,
		`SELECT phone, whatsapp, instagram FROM clients WHERE id = $1`, clientID,
	)
	var phone, whatsapp, instagram pgtype.Text
	if err := row.Scan(&phone, &whatsapp, &instagram); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Contact{}, httpx.NotFound("client_not_found", "client not found")
		}
		return Contact{}, httpx.Internal("contact_read_failed", err)
	}
	out := Contact{}
	if phone.Valid {
		v := phone.String
		out.Phone = &v
	}
	if whatsapp.Valid {
		v := whatsapp.String
		out.WhatsApp = &v
	}
	if instagram.Valid {
		v := instagram.String
		out.Instagram = &v
	}
	return out, nil
}

// UpdateContact normalises and writes the supplied channels. Empty string
// means "clear", nil means "leave alone".
func (s *Service) UpdateContact(ctx context.Context, clientID pgtype.UUID, p ContactPatch) (Contact, error) {
	// Normalise + validate first; bail with a 400 on bad input rather than
	// letting the DB constraint surface as a 500.
	clean := func(name string, v *string, max int) (pgtype.Text, error) {
		if v == nil {
			return pgtype.Text{}, nil
		}
		s := strings.TrimSpace(*v)
		if s == "" {
			return pgtype.Text{String: "", Valid: false}, nil // explicit clear; we'll convert with a sentinel below
		}
		if len(s) > max {
			return pgtype.Text{}, httpx.BadRequest(name+"_too_long", name+" is too long")
		}
		return pgtype.Text{String: s, Valid: true}, nil
	}

	phone, err := clean("phone", p.Phone, 32)
	if err != nil {
		return Contact{}, err
	}
	whatsapp, err := clean("whatsapp", p.WhatsApp, 32)
	if err != nil {
		return Contact{}, err
	}
	instagram, err := clean("instagram", p.Instagram, 64)
	if err != nil {
		return Contact{}, err
	}

	// Format guards. Reject obvious junk; we don't try to be E.164-strict
	// because mixed international tutoring traffic varies.
	if phone.Valid && !phonePattern.MatchString(phone.String) {
		return Contact{}, httpx.BadRequest("phone_invalid", "phone must contain digits, +, spaces, or dashes")
	}
	if whatsapp.Valid && !phonePattern.MatchString(whatsapp.String) {
		return Contact{}, httpx.BadRequest("whatsapp_invalid", "whatsapp must contain digits, +, spaces, or dashes")
	}
	if instagram.Valid {
		handle := strings.TrimPrefix(instagram.String, "@")
		instagram.String = handle
		if !instagramPattern.MatchString(handle) {
			return Contact{}, httpx.BadRequest("instagram_invalid", "instagram handle must be 1–30 chars, letters/digits/underscore/dot")
		}
	}

	// Build dynamic SET clause so nil means "leave alone" (vs. supplied=""
	// which clears).
	set := make([]string, 0, 3)
	args := make([]any, 0, 4)
	push := func(col string, v *string, t pgtype.Text) {
		if v == nil {
			return
		}
		args = append(args, t)
		// pgtype.Text with Valid=false serializes as SQL NULL, which is the
		// desired "clear" semantic. Valid=true writes the trimmed value.
		set = append(set, col+" = $"+itoa(len(args)))
	}
	push("phone", p.Phone, phone)
	push("whatsapp", p.WhatsApp, whatsapp)
	push("instagram", p.Instagram, instagram)

	if len(set) == 0 {
		return s.GetContact(ctx, clientID)
	}
	args = append(args, clientID)
	q := `UPDATE clients SET ` + strings.Join(set, ", ") + `, updated_at = NOW() WHERE id = $` + itoa(len(args)) + ` RETURNING phone, whatsapp, instagram`
	row := s.pool.QueryRow(ctx, q, args...)
	var ph, wh, ig pgtype.Text
	if err := row.Scan(&ph, &wh, &ig); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Contact{}, httpx.NotFound("client_not_found", "client not found")
		}
		return Contact{}, httpx.Internal("contact_write_failed", err)
	}
	out := Contact{}
	if ph.Valid {
		v := ph.String
		out.Phone = &v
	}
	if wh.Valid {
		v := wh.String
		out.WhatsApp = &v
	}
	if ig.Valid {
		v := ig.String
		out.Instagram = &v
	}
	return out, nil
}

// phonePattern is intentionally permissive — digits, plus, spaces, dashes,
// parens, dots. Length is already bounded by the DB CHECK constraint.
var phonePattern = regexp.MustCompile(`^[\d+\-\s().]{4,32}$`)

// instagramPattern follows Instagram's own rules: 1–30 chars, alnum,
// underscore, dot. We strip a leading "@" before applying this.
var instagramPattern = regexp.MustCompile(`^[A-Za-z0-9_.]{1,30}$`)

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	buf := make([]byte, 0, 4)
	neg := n < 0
	if neg {
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
