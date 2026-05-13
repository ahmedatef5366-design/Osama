package middleware

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

// RateLimit implements a Redis-backed fixed-window rate limit, keyed by
// authenticated userID when available, falling back to the request IP.
// 100 req/min per the spec; tunable via RATE_LIMIT_PER_MINUTE.
//
// We INCR a per-minute key and EXPIRE it on first increment. That's a
// fixed-window counter — simple, fast, ~1 ms overhead. Burstiness at
// window boundaries is acceptable for this app's load profile.
func RateLimit(rdb *redis.Client, perMinute int) fiber.Handler {
	if perMinute <= 0 {
		// Disabled — return a no-op handler.
		return func(c *fiber.Ctx) error { return c.Next() }
	}
	limit := int64(perMinute)
	window := time.Minute

	return func(c *fiber.Ctx) error {
		subject, _ := c.Locals("user_id").(string)
		if subject == "" {
			subject = c.IP()
		}
		now := time.Now().UTC()
		bucket := now.Unix() / int64(window.Seconds())
		key := "ratelimit:" + subject + ":" + strconv.FormatInt(bucket, 10)

		ctx := c.UserContext()
		count, err := rdb.Incr(ctx, key).Result()
		if err != nil {
			// Fail open — never block real traffic on Redis hiccups.
			return c.Next()
		}
		if count == 1 {
			_ = rdb.Expire(ctx, key, window).Err()
		}
		remaining := limit - count
		if remaining < 0 {
			remaining = 0
		}
		c.Set("X-RateLimit-Limit", strconv.FormatInt(limit, 10))
		c.Set("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))

		if count > limit {
			retry := window - time.Duration(now.Unix()%int64(window.Seconds()))*time.Second
			c.Set("Retry-After", strconv.Itoa(int(retry.Seconds())))
			return &httpx.APIError{
				Status:  fiber.StatusTooManyRequests,
				Code:    "rate_limited",
				Message: "too many requests",
			}
		}
		return c.Next()
	}
}
