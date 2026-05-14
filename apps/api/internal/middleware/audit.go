package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"go.uber.org/zap"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auditlog"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// AuditAdminWrites emits a structured `admin_action` log line every time
// an authenticated admin performs a write (POST/PUT/PATCH/DELETE). When
// a non-nil store is supplied it also persists a row to audit_log so
// the admin UI can browse the timeline.
//
// We deliberately do NOT log the request body — admin endpoints can
// carry PII, plan content, and email addresses. The log is meant to
// answer "who touched what, and when", which is enough to reconstruct
// a timeline in post-incident review.
//
// Mounted globally after RequireAuth on the /api subtree; the inner
// role check makes it a no-op for non-admin traffic. Reads (GET/HEAD/
// OPTIONS) are skipped — RequestLogger already captures them.
func AuditAdminWrites(log *zap.Logger, store *auditlog.Service) fiber.Handler {
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
		status := c.Response().StatusCode()

		log.Info("admin_action",
			zap.String("request_id", reqID),
			zap.String("user_id", uid),
			zap.String("user_email", email),
			zap.String("user_role", role),
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
			zap.String("ip", c.IP()),
			zap.Int("status", status),
		)

		// Persist to audit_log so the admin UI can browse it. Only
		// successful mutations are recorded — 4xx/5xx clutter the
		// timeline without telling the admin anything new (the zap
		// log already has the failure details).
		if store != nil && status >= 200 && status < 400 {
			var userID pgtype.UUID
			if uid != "" {
				if u, err := pgxutil.UUIDFromString(uid); err == nil {
					userID = u
				}
			}
			meta := map[string]any{
				"request_id": reqID,
				"path":       c.Path(),
				"status":     status,
			}
			if email != "" {
				meta["user_email"] = email
			}
			// best-effort: a failure here must not break the request
			_ = store.Insert(
				c.UserContext(),
				userID,
				c.Method()+" "+c.Path(),
				"http_request", "",
				meta,
				c.IP(),
			)
		}
		return err
	}
}
