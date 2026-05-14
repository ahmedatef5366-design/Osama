package branding

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// Service handles the singleton branding row. The DB schema guarantees
// there is exactly one row via a unique constraint, so every read/write
// pattern is "first()" / "update where singleton = TRUE".
type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// hexColor matches the DB-level CHECK constraint. Validating client-side
// gives a friendlier 400 than a Postgres constraint error.
var hexColor = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

// emailLike is the same loose pattern used in the migrations. We don't
// try to validate RFC 5322 — anything plausible is fine.
var emailLike = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

// Get fetches the singleton branding row.
func (s *Service) Get(ctx context.Context) (Branding, error) {
	row := s.pool.QueryRow(ctx,
		`SELECT coach_name, tagline_ar, tagline_en, logo_url, accent_color,
		        whatsapp_number, support_email, instagram_url, updated_at
		   FROM branding
		  WHERE singleton = TRUE
		  LIMIT 1`,
	)
	return scanBranding(row)
}

// Update applies a partial update to the singleton row. Caller supplies
// the admin user_id so we record who last touched the branding.
func (s *Service) Update(ctx context.Context, updatedBy pgtype.UUID, req UpdateRequest) (Branding, error) {
	if err := validate(req); err != nil {
		return Branding{}, err
	}

	row := s.pool.QueryRow(ctx,
		`UPDATE branding SET
		    coach_name      = COALESCE($1, coach_name),
		    tagline_ar      = COALESCE($2, tagline_ar),
		    tagline_en      = COALESCE($3, tagline_en),
		    logo_url        = COALESCE($4, logo_url),
		    accent_color    = COALESCE($5, accent_color),
		    whatsapp_number = COALESCE($6, whatsapp_number),
		    support_email   = COALESCE($7, support_email),
		    instagram_url   = COALESCE($8, instagram_url),
		    updated_by      = $9
		  WHERE singleton = TRUE
		RETURNING coach_name, tagline_ar, tagline_en, logo_url, accent_color,
		          whatsapp_number, support_email, instagram_url, updated_at`,
		req.CoachName, req.TaglineAR, req.TaglineEN, req.LogoURL,
		req.AccentColor, req.WhatsappNumber, req.SupportEmail, req.InstagramURL,
		updatedBy,
	)
	b, err := scanBranding(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Branding{}, httpx.Internal("branding_singleton_missing", err)
		}
		return Branding{}, err
	}
	return b, nil
}

func validate(req UpdateRequest) error {
	if req.CoachName != nil {
		s := strings.TrimSpace(*req.CoachName)
		if s == "" {
			return httpx.BadRequest("invalid_coach_name", "coach name must not be empty")
		}
		if len(s) > 80 {
			return httpx.BadRequest("invalid_coach_name", "coach name is too long")
		}
		*req.CoachName = s
	}
	if req.AccentColor != nil && !hexColor.MatchString(*req.AccentColor) {
		return httpx.BadRequest("invalid_accent_color", "accentColor must be #RRGGBB")
	}
	if req.SupportEmail != nil && *req.SupportEmail != "" && !emailLike.MatchString(*req.SupportEmail) {
		return httpx.BadRequest("invalid_support_email", "supportEmail must look like an email address")
	}
	if req.LogoURL != nil && *req.LogoURL != "" {
		if !strings.HasPrefix(*req.LogoURL, "https://") && !strings.HasPrefix(*req.LogoURL, "/") {
			return httpx.BadRequest("invalid_logo_url", "logoUrl must be https:// or a relative path")
		}
	}
	return nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanBranding(s scanner) (Branding, error) {
	var (
		b   Branding
		ts  pgtype.Timestamptz
		err = s.Scan(
			&b.CoachName, &b.TaglineAR, &b.TaglineEN, &b.LogoURL, &b.AccentColor,
			&b.WhatsappNumber, &b.SupportEmail, &b.InstagramURL, &ts,
		)
	)
	if err != nil {
		return Branding{}, err
	}
	if ts.Valid {
		b.UpdatedAt = ts.Time
	}
	return b, nil
}

// Ensure pgxutil is referenced — keeps go vet happy if we later add
// helpers that need it.
var _ = pgxutil.UUIDToString
