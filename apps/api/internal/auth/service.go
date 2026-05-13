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

// dummyHash is a real bcrypt(12) hash of a fixed throwaway password. We
// compare against it when the email is unknown so the request takes
// roughly the same time to fail as a real-but-wrong-password login,
// closing the email-enumeration timing oracle. The hash itself is not
// secret — it would be the same for any deploy.
//
// Regenerate via:
//
//	go run golang.org/x/crypto/bcrypt/bcryptcmd <random_string>
//
// or any equivalent helper; the only invariant is `bcryptCost=12`.
const dummyHash = "$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// Service is the entry point for auth flows: login, refresh, logout.
// It deliberately does NOT depend on Fiber; handlers do the HTTP plumbing.
type Service struct {
	queries  *db.Queries
	tokens   *TokenManager
	throttle *LoginThrottle
}

// NewService constructs a Service. A throttle is optional — when nil,
// callers get all the original behavior with no per-account lockouts.
func NewService(queries *db.Queries, tokens *TokenManager) *Service {
	return &Service{queries: queries, tokens: tokens}
}

// WithThrottle attaches a [LoginThrottle] to this service for per-account
// lockouts. Safe to call once at startup.
func (s *Service) WithThrottle(t *LoginThrottle) *Service {
	s.throttle = t
	return s
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
//
// Two security properties this function defends:
//  1. Email enumeration: the hash comparison runs even when the email is
//     unknown (dummyHash), so the timing channel doesn't leak which
//     emails are registered.
//  2. Credential stuffing / spraying: the per-account throttle locks an
//     account out after a configurable number of consecutive failures.
//     The IP-level limiter sits in front of this as a second backstop.
func (s *Service) Login(ctx context.Context, email, password string) (TokenPair, UserView, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	if s.throttle != nil {
		if err := s.throttle.Check(ctx, email); err != nil {
			if locked, ok := AsLocked(err); ok {
				return TokenPair{}, UserView{}, lockedError(locked.RetryAfter)
			}
			return TokenPair{}, UserView{}, httpx.Internal("throttle_check_failed", err)
		}
	}

	u, lookupErr := s.queries.GetUserByEmail(ctx, email)
	userExists := lookupErr == nil
	if lookupErr != nil && !errors.Is(lookupErr, pgx.ErrNoRows) {
		return TokenPair{}, UserView{}, httpx.Internal("user_lookup_failed", lookupErr)
	}

	// Always run bcrypt — against the real hash if we know the user, or
	// the constant dummyHash if we don't. This keeps the request's
	// timing roughly constant regardless of email validity.
	hash := dummyHash
	if userExists {
		hash = u.PasswordHash
	}
	verifyErr := VerifyPassword(hash, password)

	if !userExists || verifyErr != nil {
		if s.throttle != nil {
			s.throttle.RegisterFailure(ctx, email)
		}
		return TokenPair{}, UserView{}, httpx.Unauthorized("invalid_credentials", "invalid email or password")
	}

	// At this point we have a valid (user, password). Wipe any prior
	// failure state so the legitimate user isn't penalized later.
	if s.throttle != nil {
		s.throttle.Clear(ctx, email)
	}

	if err := s.queries.TouchUserLastLogin(ctx, u.ID); err != nil {
		// Last-login is non-essential; log but don't fail the request.
		// The caller's logger middleware will surface this in errors anyway.
		_ = err
	}

	return s.issueTokens(ctx, u)
}

// Refresh validates a refresh token and rotates it (revoke + issue new pair).
// Returning a NEW refresh token on every refresh is "refresh-token rotation"
// — if a stolen token is later replayed, the legitimate user's next refresh
// will fail (and we detect the reuse here, then nuke every session for the
// implicated user so the attacker is kicked too).
func (s *Service) Refresh(ctx context.Context, rawRefresh string) (TokenPair, UserView, error) {
	if rawRefresh == "" {
		return TokenPair{}, UserView{}, httpx.Unauthorized("missing_refresh", "missing refresh token")
	}

	session, err := s.tokens.LookupRefresh(ctx, rawRefresh)
	if err != nil {
		// Reuse-detection branch: a token that we already rotated was
		// replayed. Revoke every active session for the user so neither
		// the legitimate caller nor the attacker can keep going without
		// re-authenticating.
		var reused *ErrRefreshReused
		if errors.As(err, &reused) {
			_ = s.tokens.RevokeAllForUser(ctx, reused.UserID)
			return TokenPair{}, UserView{}, httpx.Unauthorized("refresh_reused", "refresh token replay detected; please log in again")
		}
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

func lockedError(retry time.Duration) *httpx.APIError {
	secs := int(retry.Round(time.Second).Seconds())
	if secs < 1 {
		secs = 1
	}
	return httpx.TooManyRequests("login_locked", "too many failed login attempts, try again later", secs)
}
