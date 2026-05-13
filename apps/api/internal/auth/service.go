package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// Service is the entry point for auth flows: login, refresh, logout.
// It deliberately does NOT depend on Fiber; handlers do the HTTP plumbing.
type Service struct {
	queries *db.Queries
	tokens  *TokenManager
}

func NewService(queries *db.Queries, tokens *TokenManager) *Service {
	return &Service{queries: queries, tokens: tokens}
}

// TokenPair is what the handler hands back to the caller; the handler
// then sets cookies and returns the user shape.
type TokenPair struct {
	AccessToken      string
	AccessExpiresAt  time.Time
	RefreshToken     string
	RefreshExpiresAt time.Time
}

// UserView is the safe representation we expose to clients.
type UserView struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
	Role  Role      `json:"role"`
}

// Login verifies email + password and issues a fresh token pair.
func (s *Service) Login(ctx context.Context, email, password string) (TokenPair, UserView, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	u, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return TokenPair{}, UserView{}, httpx.Unauthorized("invalid_credentials", "invalid email or password")
		}
		return TokenPair{}, UserView{}, httpx.Internal("user_lookup_failed", err)
	}

	if err := VerifyPassword(u.PasswordHash, password); err != nil {
		if errors.Is(err, ErrPasswordMismatch) {
			return TokenPair{}, UserView{}, httpx.Unauthorized("invalid_credentials", "invalid email or password")
		}
		return TokenPair{}, UserView{}, httpx.Internal("password_verify_failed", err)
	}

	if err := s.queries.TouchUserLastLogin(ctx, u.ID); err != nil {
		// Last login is non-essential; log but don't fail the request.
		// The caller's logger middleware will surface this in errors anyway.
		_ = err
	}

	return s.issueTokens(ctx, u)
}

// Refresh validates a refresh token and rotates it (revoke + issue new pair).
// Returning a NEW refresh token on every refresh is "refresh-token rotation"
// — if a stolen token is later replayed, the legitimate user's next refresh
// will fail, alerting us to the compromise.
func (s *Service) Refresh(ctx context.Context, rawRefresh string) (TokenPair, UserView, error) {
	if rawRefresh == "" {
		return TokenPair{}, UserView{}, httpx.Unauthorized("missing_refresh", "missing refresh token")
	}

	session, err := s.tokens.LookupRefresh(ctx, rawRefresh)
	if err != nil {
		return TokenPair{}, UserView{}, httpx.Internal("refresh_lookup_failed", err)
	}
	if session == nil {
		return TokenPair{}, UserView{}, httpx.Unauthorized("invalid_refresh", "refresh token is invalid or expired")
	}

	// Revoke the supplied token *before* issuing a new one (rotation).
	if err := s.tokens.RevokeRefresh(ctx, rawRefresh); err != nil {
		return TokenPair{}, UserView{}, httpx.Internal("refresh_revoke_failed", err)
	}

	u, err := s.queries.GetUserByID(ctx, pgxutil.UUID(session.UserID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return TokenPair{}, UserView{}, httpx.Unauthorized("user_gone", "user no longer exists")
		}
		return TokenPair{}, UserView{}, httpx.Internal("user_lookup_failed", err)
	}
	return s.issueTokens(ctx, u)
}

// Logout revokes the supplied refresh token (best-effort).
func (s *Service) Logout(ctx context.Context, rawRefresh string) error {
	if err := s.tokens.RevokeRefresh(ctx, rawRefresh); err != nil {
		return httpx.Internal("refresh_revoke_failed", err)
	}
	return nil
}

func (s *Service) issueTokens(ctx context.Context, u db.User) (TokenPair, UserView, error) {
	userID := uuid.UUID(u.ID.Bytes)
	role := Role(u.Role)

	access, accessExp, err := s.tokens.IssueAccess(userID, role)
	if err != nil {
		return TokenPair{}, UserView{}, httpx.Internal("access_issue_failed", err)
	}
	refresh, refreshExp, err := s.tokens.IssueRefresh(ctx, userID, role)
	if err != nil {
		return TokenPair{}, UserView{}, httpx.Internal("refresh_issue_failed", err)
	}
	return TokenPair{
			AccessToken:      access,
			AccessExpiresAt:  accessExp,
			RefreshToken:     refresh,
			RefreshExpiresAt: refreshExp,
		}, UserView{
			ID:    userID,
			Email: u.Email,
			Role:  role,
		}, nil
}
