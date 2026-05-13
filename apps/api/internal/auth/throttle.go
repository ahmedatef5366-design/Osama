package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// LoginThrottle implements a per-account exponential backoff lockout on
// repeated failed login attempts.
//
// The point of this throttle is to make password-spraying and credential
// stuffing impractical *without* relying on the IP-based limiter alone
// (which an attacker can defeat by rotating IPs). Counts are keyed by the
// lowercased target email so they survive across IPs and sessions.
//
// The lockout doubles per failure starting from a small base, up to a
// hard ceiling — short enough that legitimate users who fat-finger a few
// times aren't locked out for hours, long enough to make automated
// attacks expensive.
type LoginThrottle struct {
	rdb         *redis.Client
	maxFailures int
	baseWindow  time.Duration
	maxWindow   time.Duration
}

// NewLoginThrottle builds a throttle backed by Redis.
//
//   - maxFailures: the number of consecutive failures before the account
//     is fully locked (clamped to 3 if zero/negative).
//   - baseWindow:  the initial lockout window after maxFailures (the
//     window doubles on each subsequent failure, up to maxWindow).
//   - maxWindow:   hard ceiling on the lockout window (e.g. 30 minutes).
func NewLoginThrottle(rdb *redis.Client, maxFailures int, baseWindow, maxWindow time.Duration) *LoginThrottle {
	if maxFailures <= 0 {
		maxFailures = 5
	}
	if baseWindow <= 0 {
		baseWindow = 30 * time.Second
	}
	if maxWindow <= 0 {
		maxWindow = 30 * time.Minute
	}
	return &LoginThrottle{
		rdb:         rdb,
		maxFailures: maxFailures,
		baseWindow:  baseWindow,
		maxWindow:   maxWindow,
	}
}

// ErrLocked is returned by [LoginThrottle.Check] when the account is
// currently in a cooldown window. Callers should surface a 429 with the
// supplied Retry-After.
type ErrLocked struct {
	RetryAfter time.Duration
}

func (e *ErrLocked) Error() string {
	return fmt.Sprintf("login locked, retry after %s", e.RetryAfter)
}

// Check returns ErrLocked if the supplied identifier is currently locked
// out. Returns nil (and a noop) when Redis is unreachable — we fail open
// so an outage doesn't lock everyone out, relying on the IP-level rate
// limiter as a backstop.
func (t *LoginThrottle) Check(ctx context.Context, identifier string) error {
	key := lockKey(identifier)
	ttl, err := t.rdb.TTL(ctx, key).Result()
	if err != nil {
		return nil
	}
	if ttl > 0 {
		return &ErrLocked{RetryAfter: ttl}
	}
	return nil
}

// RegisterFailure increments the failure counter and, when the
// configured threshold is crossed, sets a lockout window. Idempotent on
// Redis errors (fails open).
func (t *LoginThrottle) RegisterFailure(ctx context.Context, identifier string) {
	if t.rdb == nil {
		return
	}
	countKey := failKey(identifier)
	lockK := lockKey(identifier)

	n, err := t.rdb.Incr(ctx, countKey).Result()
	if err != nil {
		return
	}
	if n == 1 {
		// Forget the counter eventually so old failures don't haunt the
		// user forever after they've gone away and come back.
		_ = t.rdb.Expire(ctx, countKey, t.maxWindow).Err()
	}
	if n >= int64(t.maxFailures) {
		excess := int(n - int64(t.maxFailures))
		window := t.baseWindow << excess // doubles per failure past threshold
		if window > t.maxWindow {
			window = t.maxWindow
		}
		_ = t.rdb.Set(ctx, lockK, "1", window).Err()
	}
}

// Clear forgets all failure state for the identifier. Call this on a
// successful login so a user's prior fat-fingers don't follow them
// around.
func (t *LoginThrottle) Clear(ctx context.Context, identifier string) {
	if t.rdb == nil {
		return
	}
	_, _ = t.rdb.Del(ctx, failKey(identifier), lockKey(identifier)).Result()
}

// AsLocked reports whether err is an *ErrLocked and returns it for the
// caller to introspect the Retry-After window.
func AsLocked(err error) (*ErrLocked, bool) {
	var l *ErrLocked
	if errors.As(err, &l) {
		return l, true
	}
	return nil, false
}

func normalizeIdentifier(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

func failKey(id string) string { return "login:fail:" + normalizeIdentifier(id) }
func lockKey(id string) string { return "login:lock:" + normalizeIdentifier(id) }
