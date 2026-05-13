package middleware

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

// ErrorHandler is Fiber's terminal error handler. It maps:
//   - *httpx.APIError       → its own Status + Code + Message
//   - *fiber.Error          → its own Status + generic message
//   - everything else        → 500 + generic message + logged cause
//
// Logged details never leak to the client; only the safe Code/Message do.
func ErrorHandler(log *zap.Logger) fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		reqID, _ := c.Locals(LocalsRequestID).(string)

		if apiErr, ok := httpx.As(err); ok {
			if apiErr.Status >= 500 {
				log.Error("api_error",
					zap.String("request_id", reqID),
					zap.String("code", apiErr.Code),
					zap.Error(err),
				)
			}
			return c.Status(apiErr.Status).JSON(httpx.Response{
				Error: apiErr.Message,
				Code:  apiErr.Code,
			})
		}

		var fe *fiber.Error
		if errors.As(err, &fe) {
			return c.Status(fe.Code).JSON(httpx.Response{
				Error: fe.Message,
				Code:  "fiber_error",
			})
		}

		log.Error("unhandled_error",
			zap.String("request_id", reqID),
			zap.Error(err),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(httpx.Response{
			Error: "internal server error",
			Code:  "internal",
		})
	}
}
