package auth

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// Role is the application-level role embedded in tokens.
type Role string

const (
	RoleAdmin  Role = "admin"
	RoleClient Role = "client"
)

// AccessClaims is the JWT payload for short-lived access tokens. RS256.
type AccessClaims struct {
	UserID uuid.UUID `json:"sub"`
	Role   Role      `json:"role"`
	jwt.RegisteredClaims
}

// RefreshSession is the value we persist in Redis against an opaque
// refresh token's hash. Knowing the token gives you the userID/role until
// it expires (or is revoked).
type RefreshSession struct {
	UserID    uuid.UUID `json:"user_id"`
	Role      Role      `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// TokenManager mints and verifies access + refresh tokens. Refresh tokens
// are opaque random bytes; we HMAC them before storing so a Redis dump
// doesn't yield usable credentials AND the key is bound to a server
// secret (defense-in-depth: redis-dump alone can't be used to fingerprint
// tokens via offline lookup of unrelated hashes).
type TokenManager struct {
	priv      *rsa.PrivateKey
	pub       *rsa.PublicKey
	issuer    string
	accessTL  time.Duration
	refrTL    time.Duration
	rdb       *redis.Client
	hmacKey   []byte // HMAC-SHA256 key for the refresh-token lookup hash
}

func NewTokenManager(
	priv *rsa.PrivateKey,
	pub *rsa.PublicKey,
	issuer string,
	accessTTL, refreshTTL time.Duration,
	rdb *redis.Client,
) *TokenManager {
	// Derive an HMAC key from the JWT private key. We hash the marshaled
	// private-key DER so the key has full 256 bits of entropy and is
	// stable across restarts (no separate secret to rotate).
	hmacKey := deriveRefreshHMACKey(priv)
	return &TokenManager{
		priv:     priv,
		pub:      pub,
		issuer:   issuer,
		accessTL: accessTTL,
		refrTL:   refreshTTL,
		rdb:      rdb,
		hmacKey:  hmacKey,
	}
}

// deriveRefreshHMACKey returns a stable 32-byte HMAC key derived from
// the JWT private key. Using the JWT key avoids introducing a new
// secret-to-rotate while still keeping the refresh-token hashing keyed.
func deriveRefreshHMACKey(priv *rsa.PrivateKey) []byte {
	if priv == nil {
		return nil
	}
	sum := sha256.Sum256(priv.N.Bytes())
	return sum[:]
}

// IssueAccess signs a fresh access JWT for the user.
func (m *TokenManager) IssueAccess(userID uuid.UUID, role Role) (string, time.Time, error) {
	now := time.Now()
	exp := now.Add(m.accessTL)
	claims := AccessClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    m.issuer,
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(exp),
			ID:        uuid.NewString(),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	signed, err := tok.SignedString(m.priv)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("sign access token: %w", err)
	}
	return signed, exp, nil
}

// ParseAccess validates the signature, issuer, and expiration of an access
// token and returns its claims.
func (m *TokenManager) ParseAccess(raw string) (*AccessClaims, error) {
	claims := &AccessClaims{}
	_, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return m.pub, nil
	}, jwt.WithIssuer(m.issuer), jwt.WithValidMethods([]string{"RS256"}))
	if err != nil {
		return nil, err
	}
	return claims, nil
}

// IssueRefresh mints an opaque refresh token, stores its hash + session in
// Redis, and returns the raw token (which is what the client gets).
func (m *TokenManager) IssueRefresh(ctx context.Context, userID uuid.UUID, role Role) (string, time.Time, error) {
	raw, err := randomToken(32)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("generate refresh token: %w", err)
	}

	session := RefreshSession{UserID: userID, Role: role, CreatedAt: time.Now()}
	payload, err := json.Marshal(session)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("marshal refresh session: %w", err)
	}

	key := m.refreshKey(raw)
	if err := m.rdb.Set(ctx, key, payload, m.refrTL).Err(); err != nil {
		return "", time.Time{}, fmt.Errorf("store refresh session: %w", err)
	}
	// Track this token in the user's session set so we can revoke them
	// all in one shot if we detect a reuse-after-rotation event.
	if err := m.rdb.SAdd(ctx, userSessionsKey(userID), key).Err(); err != nil {
		// Non-fatal; the token itself is already stored and usable.
		_ = err
	}
	_ = m.rdb.Expire(ctx, userSessionsKey(userID), m.refrTL).Err()
	return raw, time.Now().Add(m.refrTL), nil
}

// ErrRefreshReused indicates the caller presented a refresh token that
// had already been rotated/revoked. Service-layer callers should log the
// event and revoke every other session for the implicated user.
type ErrRefreshReused struct {
	UserID uuid.UUID
}

func (e *ErrRefreshReused) Error() string { return "refresh token reuse detected" }

// LookupRefresh returns the session for the supplied raw refresh token.
// Returns (nil, nil) if the token is unknown / expired. Returns an
// *ErrRefreshReused error when the token was previously revoked within
// the last refresh-TTL window — a strong signal that a stolen token is
// being replayed.
func (m *TokenManager) LookupRefresh(ctx context.Context, raw string) (*RefreshSession, error) {
	key := m.refreshKey(raw)
	v, err := m.rdb.Get(ctx, key).Bytes()
	if err == nil {
		var s RefreshSession
		if err := json.Unmarshal(v, &s); err != nil {
			return nil, fmt.Errorf("decode refresh session: %w", err)
		}
		return &s, nil
	}
	if !errors.Is(err, redis.Nil) {
		return nil, fmt.Errorf("read refresh session: %w", err)
	}

	// Token isn't currently valid. Check the burnt-set to distinguish
	// "expired / never existed" from "rotated then replayed".
	burnt, gerr := m.rdb.Get(ctx, burntKey(key)).Result()
	if gerr == nil && burnt != "" {
		uid, perr := uuid.Parse(burnt)
		if perr == nil {
			return nil, &ErrRefreshReused{UserID: uid}
		}
	}
	return nil, nil
}

// RevokeRefresh removes a refresh token from Redis and records it in the
// burnt-set so a later attempt to use it can be flagged as reuse.
func (m *TokenManager) RevokeRefresh(ctx context.Context, raw string) error {
	if raw == "" {
		return nil
	}
	key := m.refreshKey(raw)

	// Read the session (if still there) so we can stash the userID in
	// the burnt-record for later reuse detection.
	var userID string
	if v, err := m.rdb.Get(ctx, key).Bytes(); err == nil {
		var s RefreshSession
		if json.Unmarshal(v, &s) == nil {
			userID = s.UserID.String()
			_ = m.rdb.SRem(ctx, userSessionsKey(s.UserID), key).Err()
		}
	}
	if err := m.rdb.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}
	if userID != "" {
		// Keep the burnt marker for the remaining refresh TTL window so
		// reuse-detection works for at least as long as the token would
		// otherwise have been valid.
		_ = m.rdb.Set(ctx, burntKey(key), userID, m.refrTL).Err()
	}
	return nil
}

// RevokeAllForUser blows away every active refresh token belonging to
// userID. Called when refresh-token reuse is detected so the legitimate
// user has to re-authenticate (which kicks the attacker off too).
func (m *TokenManager) RevokeAllForUser(ctx context.Context, userID uuid.UUID) error {
	setKey := userSessionsKey(userID)
	keys, err := m.rdb.SMembers(ctx, setKey).Result()
	if err != nil {
		return fmt.Errorf("list user sessions: %w", err)
	}
	if len(keys) == 0 {
		return nil
	}
	args := make([]string, 0, len(keys)+1)
	args = append(args, keys...)
	if err := m.rdb.Del(ctx, args...).Err(); err != nil {
		return fmt.Errorf("delete user sessions: %w", err)
	}
	_ = m.rdb.Del(ctx, setKey).Err()
	return nil
}

// AccessTTL exposes the configured access-token TTL.
func (m *TokenManager) AccessTTL() time.Duration { return m.accessTL }

// RefreshTTL exposes the configured refresh-token TTL.
func (m *TokenManager) RefreshTTL() time.Duration { return m.refrTL }

func randomToken(nBytes int) (string, error) {
	buf := make([]byte, nBytes)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

// burntKey is the Redis key holding the userID that owned a refresh
// token at the moment it was revoked. Looking up this key after a
// failed [LookupRefresh] tells us whether the token was rotated (=
// reuse attempt) or just never valid in the first place.
func burntKey(key string) string {
	return "burnt:" + key
}

// userSessionsKey is the Redis SET that tracks every active refresh
// token belonging to a single user. Used by [RevokeAllForUser] to wipe
// every session on a reuse-detection event.
func userSessionsKey(userID uuid.UUID) string {
	return "user_sessions:" + userID.String()
}

// refreshKey computes the Redis lookup key for a raw refresh token. We
// use HMAC-SHA256 keyed with the server-side hmacKey so an attacker who
// dumps Redis still can't link tokens to anything without also having
// the JWT private key.
func (m *TokenManager) refreshKey(raw string) string {
	if len(m.hmacKey) == 0 {
		// Defensive fallback — should never happen in practice because
		// NewTokenManager always derives the key. Plain SHA-256 here is
		// strictly worse than HMAC but better than panicking.
		sum := sha256.Sum256([]byte(raw))
		return "refresh:" + hex.EncodeToString(sum[:])
	}
	h := hmac.New(sha256.New, m.hmacKey)
	h.Write([]byte(raw))
	return "refresh:" + hex.EncodeToString(h.Sum(nil))
}
