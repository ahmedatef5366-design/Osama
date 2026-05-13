package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// RequireAuth verifies the access token and exposes user_id / user_role
// on c.Locals. Accepts either a cookie or `Authorization: Bearer <jwt>`.
//
// The queries arg is optional. When provided, we hydrate the user's email
// onto the locals so handlers like /api/auth/me don't need a second
// roundtrip. Pass nil if you don't care about the email.
func RequireAuth(tokens *auth.TokenManager, queries *db.Queries) fiber.Handler {
	return func(c *fiber.Ctx) error {
		raw := extractAccessToken(c)
		if raw == "" {
			return httpx.Unauthorized("missing_access", "missing access token")
		}
		claims, err := tokens.ParseAccess(raw)
		if err != nil {
			return httpx.Unauthorized("invalid_access", "invalid or expired access token")
		}

		c.Locals(auth.LocalsUserID, claims.UserID.String())
		c.Locals(auth.LocalsUserRole, string(claims.Role))

		if queries != nil {
			u, err := queries.GetUserByID(c.UserContext(), pgxutil.UUID(claims.UserID))
			if err != nil {
				if err == pgx.ErrNoRows {
					return httpx.Unauthorized("user_gone", "user no longer exists")
				}
				return httpx.Internal("user_lookup_failed", err)
			}
			c.Locals(auth.LocalsUserEmail, u.Email)
		}
		return c.Next()
	}
}

// RequireRole rejects any caller whose user_role local doesn't match one
// of the allowed roles. Must be mounted *after* RequireAuth.
func RequireRole(roles ...auth.Role) fiber.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[string(r)] = struct{}{}
	}
	return func(c *fiber.Ctx) error {
		role, _ := c.Locals(auth.LocalsUserRole).(string)
		if _, ok := allowed[role]; !ok {
			return httpx.Forbidden("forbidden_role", "insufficient role")
		}
		return c.Next()
	}
}

func extractAccessToken(c *fiber.Ctx) string {
	if h := c.Get("Authorization"); h != "" {
		if strings.HasPrefix(h, "Bearer ") {
			return strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
		}
	}
	return c.Cookies(auth.AccessCookieName)
}
