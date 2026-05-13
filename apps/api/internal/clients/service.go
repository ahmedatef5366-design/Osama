// Package clients implements the client-profile CRUD used by the admin.
package clients

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewService(pool *pgxpool.Pool, queries *db.Queries) *Service {
	return &Service{pool: pool, queries: queries}
}

// ListParams controls the result window of List.
type ListParams struct {
	Page       int
	PageSize   int
	Search     string
	ActiveOnly *bool
}

// List returns a page of clients and the total matching the same filters.
func (s *Service) List(ctx context.Context, p ListParams) ([]Client, int64, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PageSize <= 0 || p.PageSize > 100 {
		p.PageSize = 20
	}

	var search *string
	if p.Search != "" {
		search = &p.Search
	}

	rows, err := s.queries.ListClients(ctx, db.ListClientsParams{
		Limit:      int32(p.PageSize),
		Offset:     int32((p.Page - 1) * p.PageSize),
		ActiveOnly: p.ActiveOnly,
		Search:     search,
	})
	if err != nil {
		return nil, 0, httpx.Internal("clients_list_failed", err)
	}
	total, err := s.queries.CountClients(ctx, db.CountClientsParams{
		ActiveOnly: p.ActiveOnly,
		Search:     search,
	})
	if err != nil {
		return nil, 0, httpx.Internal("clients_count_failed", err)
	}

	out := make([]Client, 0, len(rows))
	for _, r := range rows {
		out = append(out, fromDB(r))
	}
	return out, total, nil
}

// Get returns a single client by ID.
func (s *Service) Get(ctx context.Context, clientID pgtype.UUID) (Client, error) {
	c, err := s.queries.GetClient(ctx, clientID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Client{}, httpx.NotFound("client_not_found", "client not found")
		}
		return Client{}, httpx.Internal("client_get_failed", err)
	}
	return fromDB(c), nil
}

// GetByUserID is used by client-self routes: a client fetches their own
// profile based on the userID embedded in their access token.
func (s *Service) GetByUserID(ctx context.Context, userID pgtype.UUID) (Client, error) {
	c, err := s.queries.GetClientByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Client{}, httpx.NotFound("client_not_found", "client profile has not been created yet")
		}
		return Client{}, httpx.Internal("client_get_failed", err)
	}
	return fromDB(c), nil
}

// Create inserts a user (role=client) and their client profile in one
// transaction.
func (s *Service) Create(ctx context.Context, req CreateRequest) (Client, error) {
	if err := validateCreate(req); err != nil {
		return Client{}, err
	}
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		return Client{}, httpx.Internal("password_hash_failed", err)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Client{}, httpx.Internal("tx_begin_failed", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := s.queries.WithTx(tx)
	u, err := q.CreateUser(ctx, db.CreateUserParams{
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		PasswordHash: hash,
		Role:         string(auth.RoleClient),
	})
	if err != nil {
		if isUniqueViolation(err) {
			return Client{}, httpx.Conflict("email_in_use", "email already in use")
		}
		return Client{}, httpx.Internal("user_create_failed", err)
	}

	start, err := parseDate(req.StartDate)
	if err != nil {
		return Client{}, httpx.BadRequest("invalid_start_date", "startDate must be YYYY-MM-DD")
	}
	target, err := parseDate(req.TargetDate)
	if err != nil {
		return Client{}, httpx.BadRequest("invalid_target_date", "targetDate must be YYYY-MM-DD")
	}

	c, err := q.CreateClient(ctx, db.CreateClientParams{
		UserID:          u.ID,
		Name:            strings.TrimSpace(req.Name),
		Age:             req.Age,
		HeightCm:        pgxutil.FloatToNumeric(req.HeightCm),
		CurrentWeightKg: pgxutil.FloatToNumeric(req.CurrentWeightKg),
		Sex:             req.Sex,
		ExperienceLevel: req.ExperienceLevel,
		Goal:            req.Goal,
		ActivityLevel:   req.ActivityLevel,
		HealthNotes:     req.HealthNotes,
		StartDate:       start,
		TargetDate:      target,
	})
	if err != nil {
		return Client{}, httpx.Internal("client_create_failed", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Client{}, httpx.Internal("tx_commit_failed", err)
	}
	return fromDB(c), nil
}

// Update applies a PATCH-style update. Only the fields supplied are touched.
func (s *Service) Update(ctx context.Context, clientID pgtype.UUID, req UpdateRequest) (Client, error) {
	if err := validateUpdate(req); err != nil {
		return Client{}, err
	}
	start, err := parseDate(req.StartDate)
	if err != nil {
		return Client{}, httpx.BadRequest("invalid_start_date", "startDate must be YYYY-MM-DD")
	}
	target, err := parseDate(req.TargetDate)
	if err != nil {
		return Client{}, httpx.BadRequest("invalid_target_date", "targetDate must be YYYY-MM-DD")
	}

	c, err := s.queries.UpdateClient(ctx, db.UpdateClientParams{
		ID:              clientID,
		Name:            req.Name,
		Age:             req.Age,
		HeightCm:        pgxutil.FloatToNumeric(req.HeightCm),
		CurrentWeightKg: pgxutil.FloatToNumeric(req.CurrentWeightKg),
		Sex:             req.Sex,
		ExperienceLevel: req.ExperienceLevel,
		Goal:            req.Goal,
		ActivityLevel:   req.ActivityLevel,
		HealthNotes:     req.HealthNotes,
		StartDate:       start,
		TargetDate:      target,
		IsActive:        req.IsActive,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Client{}, httpx.NotFound("client_not_found", "client not found")
		}
		return Client{}, httpx.Internal("client_update_failed", err)
	}
	return fromDB(c), nil
}

func parseDate(s *string) (pgtype.Date, error) {
	if s == nil || *s == "" {
		return pgtype.Date{Valid: false}, nil
	}
	t, err := time.Parse("2006-01-02", *s)
	if err != nil {
		return pgtype.Date{}, err
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}

func validateCreate(r CreateRequest) error {
	if !strings.Contains(r.Email, "@") {
		return httpx.BadRequest("invalid_email", "email is required")
	}
	if len(r.Password) < 8 {
		return httpx.BadRequest("invalid_password", "password must be at least 8 characters")
	}
	if strings.TrimSpace(r.Name) == "" {
		return httpx.BadRequest("invalid_name", "name is required")
	}
	return validateEnums(r.Sex, r.ExperienceLevel, r.Goal, r.ActivityLevel)
}

func validateUpdate(r UpdateRequest) error {
	if r.Name != nil && strings.TrimSpace(*r.Name) == "" {
		return httpx.BadRequest("invalid_name", "name cannot be empty")
	}
	return validateEnums(r.Sex, r.ExperienceLevel, r.Goal, r.ActivityLevel)
}

func validateEnums(sex, level, goal, activity *string) error {
	if sex != nil && !oneOf(*sex, "male", "female") {
		return httpx.BadRequest("invalid_sex", "sex must be male or female")
	}
	if level != nil && !oneOf(*level, "beginner", "intermediate", "advanced") {
		return httpx.BadRequest("invalid_experience_level", "experienceLevel must be beginner|intermediate|advanced")
	}
	if goal != nil && !oneOf(*goal, "fat_loss", "muscle_gain", "recomposition", "athletic") {
		return httpx.BadRequest("invalid_goal", "goal must be fat_loss|muscle_gain|recomposition|athletic")
	}
	if activity != nil && !oneOf(*activity, "sedentary", "light", "moderate", "very", "athlete") {
		return httpx.BadRequest("invalid_activity_level", "activityLevel must be sedentary|light|moderate|very|athlete")
	}
	return nil
}

func oneOf(v string, allowed ...string) bool {
	for _, a := range allowed {
		if v == a {
			return true
		}
	}
	return false
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}
