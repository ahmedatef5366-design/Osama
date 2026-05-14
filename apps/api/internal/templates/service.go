package templates

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
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

// List returns every template ordered by sort_order. activeOnly filters
// inactive entries — the client portal and admin pickers use this.
func (s *Service) List(ctx context.Context, activeOnly bool) ([]Template, error) {
	q := `SELECT id, slug, category, label_ar, label_en, body_ar, body_en,
	             sort_order, is_active, created_at, updated_at
	        FROM message_templates`
	if activeOnly {
		q += ` WHERE is_active = TRUE`
	}
	q += ` ORDER BY sort_order ASC, label_en ASC`
	rows, err := s.pool.Query(ctx, q)
	if err != nil {
		return nil, httpx.Internal("templates_list_failed", err)
	}
	defer rows.Close()
	out := make([]Template, 0)
	for rows.Next() {
		t, err := scanTemplate(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, nil
}

func (s *Service) Create(ctx context.Context, req CreateRequest) (Template, error) {
	if err := validateCreate(req); err != nil {
		return Template{}, err
	}
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}
	if req.Category == "" {
		req.Category = "custom"
	}
	row := s.pool.QueryRow(ctx,
		`INSERT INTO message_templates
		   (slug, category, label_ar, label_en, body_ar, body_en, sort_order, is_active)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, slug, category, label_ar, label_en, body_ar, body_en,
		           sort_order, is_active, created_at, updated_at`,
		strings.ToLower(strings.TrimSpace(req.Slug)),
		req.Category,
		req.LabelAR, req.LabelEN, req.BodyAR, req.BodyEN,
		req.SortOrder, active,
	)
	t, err := scanTemplate(row)
	if err != nil {
		// crude unique-violation detection — pgx wraps PG errors but we don't
		// want to import pgconn just for this single case.
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique") {
			return Template{}, httpx.Conflict("template_slug_taken", "a template with that slug already exists")
		}
		return Template{}, err
	}
	return t, nil
}

func (s *Service) Update(ctx context.Context, id pgtype.UUID, req UpdateRequest) (Template, error) {
	// Build a dynamic SET clause. Each *T pointer that is non-nil adds a
	// "$N" placeholder and pushes its value into args. Safe because the
	// columns are a fixed allow-list.
	set := make([]string, 0, 7)
	args := make([]any, 0, 8)
	push := func(col string, v any) {
		args = append(args, v)
		set = append(set, col+" = $"+itoa(len(args)))
	}
	if req.Category != nil {
		push("category", *req.Category)
	}
	if req.LabelAR != nil {
		push("label_ar", *req.LabelAR)
	}
	if req.LabelEN != nil {
		push("label_en", *req.LabelEN)
	}
	if req.BodyAR != nil {
		push("body_ar", *req.BodyAR)
	}
	if req.BodyEN != nil {
		push("body_en", *req.BodyEN)
	}
	if req.SortOrder != nil {
		push("sort_order", *req.SortOrder)
	}
	if req.IsActive != nil {
		push("is_active", *req.IsActive)
	}
	if len(set) == 0 {
		return s.Get(ctx, id)
	}
	args = append(args, id)
	q := `UPDATE message_templates
	         SET ` + strings.Join(set, ", ") + `, updated_at = NOW()
	       WHERE id = $` + itoa(len(args)) + `
	   RETURNING id, slug, category, label_ar, label_en, body_ar, body_en,
	             sort_order, is_active, created_at, updated_at`
	row := s.pool.QueryRow(ctx, q, args...)
	t, err := scanTemplate(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Template{}, httpx.NotFound("template_not_found", "template not found")
		}
		return Template{}, err
	}
	return t, nil
}

func (s *Service) Get(ctx context.Context, id pgtype.UUID) (Template, error) {
	row := s.pool.QueryRow(ctx,
		`SELECT id, slug, category, label_ar, label_en, body_ar, body_en,
		        sort_order, is_active, created_at, updated_at
		   FROM message_templates WHERE id = $1`, id,
	)
	t, err := scanTemplate(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Template{}, httpx.NotFound("template_not_found", "template not found")
		}
		return Template{}, err
	}
	return t, nil
}

func (s *Service) Delete(ctx context.Context, id pgtype.UUID) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM message_templates WHERE id = $1`, id)
	if err != nil {
		return httpx.Internal("template_delete_failed", err)
	}
	if tag.RowsAffected() == 0 {
		return httpx.NotFound("template_not_found", "template not found")
	}
	return nil
}

// ════════════════════════════════════════
// helpers
// ════════════════════════════════════════

func validateCreate(req CreateRequest) error {
	if strings.TrimSpace(req.Slug) == "" {
		return httpx.BadRequest("slug_required", "slug is required")
	}
	if len(req.Slug) > 64 {
		return httpx.BadRequest("slug_too_long", "slug must be ≤ 64 chars")
	}
	if strings.TrimSpace(req.LabelAR) == "" || strings.TrimSpace(req.LabelEN) == "" {
		return httpx.BadRequest("label_required", "label_ar and label_en are required")
	}
	if strings.TrimSpace(req.BodyAR) == "" || strings.TrimSpace(req.BodyEN) == "" {
		return httpx.BadRequest("body_required", "body_ar and body_en are required")
	}
	if len(req.BodyAR) > 4000 || len(req.BodyEN) > 4000 {
		return httpx.BadRequest("body_too_long", "body must be ≤ 4000 chars")
	}
	return nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanTemplate(r rowScanner) (Template, error) {
	var (
		t                    Template
		id                   pgtype.UUID
		createdAt, updatedAt pgtype.Timestamptz
	)
	if err := r.Scan(
		&id, &t.Slug, &t.Category, &t.LabelAR, &t.LabelEN, &t.BodyAR, &t.BodyEN,
		&t.SortOrder, &t.IsActive, &createdAt, &updatedAt,
	); err != nil {
		return Template{}, err
	}
	t.ID = pgxutil.UUIDToString(id)
	if createdAt.Valid {
		t.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		t.UpdatedAt = updatedAt.Time
	}
	return t, nil
}

// itoa avoids importing strconv just for placeholder numbering.
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
