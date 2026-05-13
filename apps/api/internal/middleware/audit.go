package middleware

import (
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
)

// AuditAdminWrites emits a structured `admin_action` log line every time
// an authenticated admin performs a write (POST/PUT/PATCH/DELETE). The
// line includes the actor, the method, the path, the response status,
// and the request id. We deliberately do NOT log the request body —
// admin endpoints can carry PII, plan content, and email addresses. The
// log is meant to answer "who touched what, and when", which is enough
// to reconstruct a timeline in post-incident review.
//
// Mounted globally after RequireAuth on the /api subtree; the inner
// role check makes it a no-op for non-admin traffic. Reads (GET/HEAD/
// OPTIONS) are skipped — RequestLogger already captures them.
func AuditAdminWrites(log *zap.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		err := c.Next()

		switch c.Method() {
		case fiber.MethodPost, fiber.MethodPut, fiber.MethodPatch, fiber.MethodDelete:
		default:
			return err
		}

		role, _ := c.Locals(auth.LocalsUserRole).(string)
		if role != string(auth.RoleAdmin) {
			return err
		}

		uid, _ := c.Locals(auth.LocalsUserID).(string)
		email, _ := c.Locals(auth.LocalsUserEmail).(string)
		reqID, _ := c.Locals(LocalsRequestID).(string)

		log.Info("admin_action",
			zap.String("request_id", reqID),
			zap.String("user_id", uid),
			zap.String("user_email", email),
			zap.String("user_role", role),
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
			zap.String("ip", c.IP()),
			zap.Int("status", c.Response().StatusCode()),
		)
		return err
	}
}
