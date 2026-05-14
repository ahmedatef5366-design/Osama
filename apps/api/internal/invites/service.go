package invites

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

const (
	defaultExpiryHours = 7 * 24
	maxExpiryHours     = 30 * 24
	tokenBytes         = 32
)

var emailLike = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

// Service handles invite lifecycle. It needs both the pool (for the
// invite table) and the sqlc Queries handle (to create the underlying
// user + client rows on accept).
type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewService(pool *pgxpool.Pool, queries *db.Queries) *Service {
	return &Service{pool: pool, queries: queries}
}

// Create issues a new invite and returns the invite row plus the
// plaintext token. The plaintext token is *only* exposed here — the
// DB only ever stores its sha256.
func (s *Service) Create(ctx context.Context, invitedBy pgtype.UUID, req CreateRequest) (Invite, string, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	name := strings.TrimSpace(req.Name)

	if !emailLike.MatchString(email) {
		return Invite{}, "", httpx.BadRequest("invalid_email", "email must look like an email address")
	}
	if len(name) < 1 || len(name) > 120 {
		return Invite{}, "", httpx.BadRequest("invalid_name", "name must be 1–120 characters")
	}

	// Reject if the email is already a user — invites are for new
	// trainees only. Existing clients should go through normal login.
	if _, err := s.queries.GetUserByEmail(ctx, email); err == nil {
		return Invite{}, "", httpx.Conflict("user_exists", "an account with that email already exists")
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return Invite{}, "", httpx.Internal("invite_user_lookup_failed", err)
	}

	hours := defaultExpiryHours
	if req.ExpiresInHours != nil && *req.ExpiresInHours > 0 {
		hours = *req.ExpiresInHours
		if hours > maxExpiryHours {
			hours = maxExpiryHours
		}
	}
	expiresAt := time.Now().Add(time.Duration(hours) * time.Hour)

	plain, hash, err := newToken()
	if err != nil {
		return Invite{}, "", httpx.Internal("token_gen_failed", err)
	}

	row := s.pool.QueryRow(ctx,
		`INSERT INTO client_invites
		   (email, name, token_hash, invited_by, expires_at)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, email, name, status, invited_by,
		           expires_at, accepted_at, revoked_at, created_at`,
		email, name, hash, invitedBy, expiresAt,
	)
	inv, err := scan(row)
	if err != nil {
		return Invite{}, "", httpx.Internal("invite_create_failed", err)
	}
	return inv, plain, nil
}

// List returns invites sorted by created_at desc. status="" -> all.
func (s *Service) List(ctx context.Context, status string) ([]Invite, error) {
	q := `SELECT id, email, name, status, invited_by,
	             expires_at, accepted_at, revoked_at, created_at
	        FROM client_invites`
	args := []any{}
	if status != "" {
		q += ` WHERE status = $1`
		args = append(args, status)
	}
	q += ` ORDER BY created_at DESC LIMIT 200`
	rows, err := s.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, httpx.Internal("invites_list_failed", err)
	}
	defer rows.Close()
	out := make([]Invite, 0, 16)
	for rows.Next() {
		inv, err := scan(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, inv)
	}
	return out, nil
}

// Revoke marks a pending invite as revoked.
func (s *Service) Revoke(ctx context.Context, id pgtype.UUID) (Invite, error) {
	row := s.pool.QueryRow(ctx,
		`UPDATE client_invites
		    SET status = 'revoked', revoked_at = NOW()
		  WHERE id = $1 AND status = 'pending'
		RETURNING id, email, name, status, invited_by,
		          expires_at, accepted_at, revoked_at, created_at`,
		id,
	)
	inv, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Invite{}, httpx.NotFound("invite_not_revokable", "invite not found or already finalised")
		}
		return Invite{}, httpx.Internal("invite_revoke_failed", err)
	}
	return inv, nil
}

// LookupByToken hydrates a (still-pending, still-valid) invite from its
// plaintext token. Used by the public accept page.
func (s *Service) LookupByToken(ctx context.Context, plain string) (PublicInvite, error) {
	plain = strings.TrimSpace(plain)
	if plain == "" {
		return PublicInvite{}, httpx.NotFound("invite_not_found", "invite not found")
	}
	hash := hashToken(plain)
	row := s.pool.QueryRow(ctx,
		`SELECT email, name, status, expires_at
		   FROM client_invites
		  WHERE token_hash = $1`,
		hash,
	)
	var (
		email, name, status string
		expiresAt           pgtype.Timestamptz
	)
	if err := row.Scan(&email, &name, &status, &expiresAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PublicInvite{}, httpx.NotFound("invite_not_found", "invite not found")
		}
		return PublicInvite{}, httpx.Internal("invite_lookup_failed", err)
	}
	if status != "pending" {
		return PublicInvite{}, httpx.Forbidden("invite_unavailable", "this invite is no longer valid")
	}
	if expiresAt.Valid && time.Now().After(expiresAt.Time) {
		// Mark as expired so the dashboard reflects reality, but don't
		// fail the request loudly — we still tell the caller it's not
		// usable.
		_, _ = s.pool.Exec(ctx,
			`UPDATE client_invites SET status='expired'
			  WHERE token_hash=$1 AND status='pending'`, hash)
		return PublicInvite{}, httpx.Forbidden("invite_expired", "this invite has expired")
	}
	out := PublicInvite{Email: email, Name: name}
	if expiresAt.Valid {
		out.ExpiresAt = expiresAt.Time
	}
	return out, nil
}

// Accept finalises an invite: creates the user + client rows, marks the
// invite accepted, and returns the new user_id.
func (s *Service) Accept(ctx context.Context, plain, password string) (db.User, error) {
	plain = strings.TrimSpace(plain)
	if plain == "" {
		return db.User{}, httpx.NotFound("invite_not_found", "invite not found")
	}
	hash := hashToken(plain)

	// Begin a transaction so a failure halfway through doesn't leave us
	// with an orphan user without a matching client row, or a "used"
	// invite that didn't actually create anything.
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.User{}, httpx.Internal("invite_tx_begin_failed", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	row := tx.QueryRow(ctx,
		`SELECT email, name, status, expires_at
		   FROM client_invites
		  WHERE token_hash = $1
		    FOR UPDATE`,
		hash,
	)
	var (
		email, name, status string
		expiresAt           pgtype.Timestamptz
	)
	if err := row.Scan(&email, &name, &status, &expiresAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return db.User{}, httpx.NotFound("invite_not_found", "invite not found")
		}
		return db.User{}, httpx.Internal("invite_accept_lookup_failed", err)
	}
	if status != "pending" {
		return db.User{}, httpx.Forbidden("invite_unavailable", "this invite is no longer valid")
	}
	if expiresAt.Valid && time.Now().After(expiresAt.Time) {
		return db.User{}, httpx.Forbidden("invite_expired", "this invite has expired")
	}

	if len(password) < 8 {
		return db.User{}, httpx.BadRequest("weak_password", "password must be at least 8 characters")
	}
	hashedPwd, err := auth.HashPassword(password)
	if err != nil {
		if errors.Is(err, auth.ErrPasswordTooLong) {
			return db.User{}, httpx.BadRequest("password_too_long", "password is too long (max 72 bytes)")
		}
		return db.User{}, httpx.Internal("password_hash_failed", err)
	}

	// Create the user via the same SQL the bootstrap path uses, but
	// scoped to the txn. We can't reuse the sqlc Queries with a txn
	// without rebinding, so we run raw SQL here.
	userRow := tx.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, role)
		 VALUES ($1, $2, 'client')
		 RETURNING id, email, password_hash, role, last_login_at, created_at, updated_at`,
		email, hashedPwd,
	)
	var u db.User
	if err := userRow.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role,
		&u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	); err != nil {
		return db.User{}, httpx.Internal("invite_user_create_failed", err)
	}

	// Mirror the bare-minimum client profile so the trainee shows up
	// in /admin/clients straight away. The admin can fill in the rest.
	if _, err := tx.Exec(ctx,
		`INSERT INTO clients (user_id, name, is_active)
		 VALUES ($1, $2, TRUE)`,
		u.ID, name,
	); err != nil {
		return db.User{}, httpx.Internal("invite_client_create_failed", err)
	}

	if _, err := tx.Exec(ctx,
		`UPDATE client_invites
		    SET status = 'accepted',
		        accepted_at = NOW(),
		        accepted_user = $1
		  WHERE token_hash = $2`,
		u.ID, hash,
	); err != nil {
		return db.User{}, httpx.Internal("invite_finalise_failed", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return db.User{}, httpx.Internal("invite_tx_commit_failed", err)
	}
	return u, nil
}

// ── helpers ─────────────────────────────────────────────────

func newToken() (plain, hash string, err error) {
	buf := make([]byte, tokenBytes)
	if _, err := rand.Read(buf); err != nil {
		return "", "", err
	}
	plain = hex.EncodeToString(buf)
	hash = hashToken(plain)
	return plain, hash, nil
}

func hashToken(plain string) string {
	sum := sha256.Sum256([]byte(plain))
	return hex.EncodeToString(sum[:])
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scan(r rowScanner) (Invite, error) {
	var (
		idUUID, invitedBy, acceptedUser pgtype.UUID
		acceptedAt, revokedAt, expires  pgtype.Timestamptz
		createdAt                       pgtype.Timestamptz
		inv                             Invite
	)
	err := r.Scan(
		&idUUID, &inv.Email, &inv.Name, &inv.Status, &invitedBy,
		&expires, &acceptedAt, &revokedAt, &createdAt,
	)
	if err != nil {
		return Invite{}, err
	}
	inv.ID = uuidString(idUUID)
	if invitedBy.Valid {
		s := uuidString(invitedBy)
		inv.InvitedBy = &s
	}
	if expires.Valid {
		inv.ExpiresAt = expires.Time
	}
	if acceptedAt.Valid {
		t := acceptedAt.Time
		inv.AcceptedAt = &t
	}
	if revokedAt.Valid {
		t := revokedAt.Time
		inv.RevokedAt = &t
	}
	if createdAt.Valid {
		inv.CreatedAt = createdAt.Time
	}
	_ = acceptedUser
	return inv, nil
}

func uuidString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	// Hex with dashes, matching uuid.UUID.String().
	const dash = "-"
	b := u.Bytes
	hexStr := hex.EncodeToString(b[:])
	return hexStr[0:8] + dash + hexStr[8:12] + dash + hexStr[12:16] + dash + hexStr[16:20] + dash + hexStr[20:32]
}
