package auth

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/config"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

const (
	AccessCookieName  = "access_token"
	RefreshCookieName = "refresh_token"

	// RefreshCookiePath restricts the refresh cookie to the auth routes
	// — the access cookie is sent everywhere under /api.
	RefreshCookiePath = "/api/auth"
	AccessCookiePath  = "/"
)

// Handler bundles the HTTP-layer auth endpoints.
type Handler struct {
	svc *Service
	cfg *config.Config
}

func NewHandler(svc *Service, cfg *config.Config) *Handler {
	return &Handler{svc: svc, cfg: cfg}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Login: POST /api/auth/login
func (h *Handler) Login(c *fiber.Ctx) error {
	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	if err := validateLogin(req); err != nil {
		return err
	}

	pair, user, err := h.svc.Login(c.UserContext(), req.Email, req.Password)
	if err != nil {
		return err
	}
	h.setAuthCookies(c, pair)
	return httpx.OK(c, fiber.Map{"user": user})
}

// Refresh: POST /api/auth/refresh
func (h *Handler) Refresh(c *fiber.Ctx) error {
	raw := c.Cookies(RefreshCookieName)
	pair, user, err := h.svc.Refresh(c.UserContext(), raw)
	if err != nil {
		// Wipe stale cookies on auth failure so the client doesn't keep
		// retrying with the same bad token.
		h.clearAuthCookies(c)
		return err
	}
	h.setAuthCookies(c, pair)
	return httpx.OK(c, fiber.Map{"user": user})
}

// Logout: POST /api/auth/logout
func (h *Handler) Logout(c *fiber.Ctx) error {
	raw := c.Cookies(RefreshCookieName)
	if err := h.svc.Logout(c.UserContext(), raw); err != nil {
		return err
	}
	h.clearAuthCookies(c)
	return httpx.NoContent(c)
}

// Me: GET /api/auth/me — convenience endpoint that returns the user
// embedded in the access token. Useful for client hydration.
func (h *Handler) Me(c *fiber.Ctx) error {
	userID, _ := c.Locals(LocalsUserID).(string)
	role, _ := c.Locals(LocalsUserRole).(string)
	email, _ := c.Locals(LocalsUserEmail).(string)
	return httpx.OK(c, fiber.Map{
		"user": fiber.Map{
			"id":    userID,
			"role":  role,
			"email": email,
		},
	})
}

func validateLogin(r loginRequest) error {
	r.Email = strings.TrimSpace(r.Email)
	if r.Email == "" || !strings.Contains(r.Email, "@") {
		return httpx.BadRequest("invalid_email", "email is required")
	}
	if len(r.Password) < 8 {
		return httpx.BadRequest("invalid_password", "password must be at least 8 characters")
	}
	return nil
}

func (h *Handler) setAuthCookies(c *fiber.Ctx, p TokenPair) {
	sameSite := strings.ToLower(h.cfg.CookieSameSite)
	c.Cookie(&fiber.Cookie{
		Name:     AccessCookieName,
		Value:    p.AccessToken,
		Path:     AccessCookiePath,
		Domain:   h.cfg.CookieDomain,
		Expires:  p.AccessExpiresAt,
		HTTPOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: cookieSameSite(sameSite),
	})
	c.Cookie(&fiber.Cookie{
		Name:     RefreshCookieName,
		Value:    p.RefreshToken,
		Path:     RefreshCookiePath,
		Domain:   h.cfg.CookieDomain,
		Expires:  p.RefreshExpiresAt,
		HTTPOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: cookieSameSite(sameSite),
	})
}

func (h *Handler) clearAuthCookies(c *fiber.Ctx) {
	for _, ck := range []struct {
		name string
		path string
	}{
		{AccessCookieName, AccessCookiePath},
		{RefreshCookieName, RefreshCookiePath},
	} {
		c.Cookie(&fiber.Cookie{
			Name:     ck.name,
			Value:    "",
			Path:     ck.path,
			Domain:   h.cfg.CookieDomain,
			Expires:  time.Unix(0, 0),
			MaxAge:   -1,
			HTTPOnly: true,
			Secure:   h.cfg.CookieSecure,
			SameSite: cookieSameSite(strings.ToLower(h.cfg.CookieSameSite)),
		})
	}
}

func cookieSameSite(s string) string {
	switch s {
	case "strict":
		return "Strict"
	case "none":
		return "None"
	default:
		return "Lax"
	}
}

// Locals* are the keys used by the auth middleware to expose the
// authenticated user on a Fiber context. Handlers should read them through
// these constants instead of hard-coding the literal string.
const (
	LocalsUserID    = "user_id"
	LocalsUserRole  = "user_role"
	LocalsUserEmail = "user_email"
)
