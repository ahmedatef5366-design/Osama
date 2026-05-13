package auth

import (
	"context"
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
// are opaque random bytes; we hash them before storing so a Redis dump
// doesn't yield usable credentials.
type TokenManager struct {
	priv     *rsa.PrivateKey
	pub      *rsa.PublicKey
	issuer   string
	accessTL time.Duration
	refrTL   time.Duration
	rdb      *redis.Client
}

func NewTokenManager(
	priv *rsa.PrivateKey,
	pub *rsa.PublicKey,
	issuer string,
	accessTTL, refreshTTL time.Duration,
	rdb *redis.Client,
) *TokenManager {
	return &TokenManager{
		priv:     priv,
		pub:      pub,
		issuer:   issuer,
		accessTL: accessTTL,
		refrTL:   refreshTTL,
		rdb:      rdb,
	}
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

	if err := m.rdb.Set(ctx, refreshKey(raw), payload, m.refrTL).Err(); err != nil {
		return "", time.Time{}, fmt.Errorf("store refresh session: %w", err)
	}
	return raw, time.Now().Add(m.refrTL), nil
}

// LookupRefresh returns the session for the supplied raw refresh token.
// Returns (nil, nil) if the token is unknown / expired.
func (m *TokenManager) LookupRefresh(ctx context.Context, raw string) (*RefreshSession, error) {
	v, err := m.rdb.Get(ctx, refreshKey(raw)).Bytes()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, fmt.Errorf("read refresh session: %w", err)
	}
	var s RefreshSession
	if err := json.Unmarshal(v, &s); err != nil {
		return nil, fmt.Errorf("decode refresh session: %w", err)
	}
	return &s, nil
}

// RevokeRefresh removes a refresh token from Redis.
func (m *TokenManager) RevokeRefresh(ctx context.Context, raw string) error {
	if raw == "" {
		return nil
	}
	if err := m.rdb.Del(ctx, refreshKey(raw)).Err(); err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}
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

func refreshKey(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return "refresh:" + hex.EncodeToString(sum[:])
}
