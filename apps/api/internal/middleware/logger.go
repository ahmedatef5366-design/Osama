package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// RequestLogger emits one structured log line per request. Skips /health
// to keep logs uncluttered.
func RequestLogger(log *zap.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if c.Path() == "/health" {
			return c.Next()
		}
		start := time.Now()
		err := c.Next()
		latency := time.Since(start)

		reqID, _ := c.Locals(LocalsRequestID).(string)
		fields := []zap.Field{
			zap.String("request_id", reqID),
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
			zap.Int("status", c.Response().StatusCode()),
			zap.Duration("latency", latency),
			zap.String("ip", c.IP()),
		}
		if err != nil {
			log.Error("request_failed", append(fields, zap.Error(err))...)
		} else {
			log.Info("request", fields...)
		}
		return err
	}
}
