package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const (
	HeaderRequestID = "X-Request-ID"
	LocalsRequestID = "request_id"
)

// RequestID generates (or propagates) a request ID, exposes it on the
// Fiber locals, and echoes it back as a response header. Useful for
// correlating logs and client-side errors.
func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Get(HeaderRequestID)
		if id == "" {
			id = uuid.NewString()
		}
		c.Locals(LocalsRequestID, id)
		c.Set(HeaderRequestID, id)
		return c.Next()
	}
}
