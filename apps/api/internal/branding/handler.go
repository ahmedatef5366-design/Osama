package branding

import (
	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// Handler wires the branding service into Fiber.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// Get — GET /api/branding (public). The payload is intentionally
// minimal and contains no PII, so we don't gate it on auth.
func (h *Handler) Get(c *fiber.Ctx) error {
	b, err := h.svc.Get(c.UserContext())
	if err != nil {
		return err
	}
	return httpx.OK(c, b)
}

// Update — PUT /api/admin/branding (admin).
func (h *Handler) Update(c *fiber.Ctx) error {
	var req UpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	uidStr, _ := c.Locals(auth.LocalsUserID).(string)
	uid, err := pgxutil.UUIDFromString(uidStr)
	if err != nil {
		return httpx.Internal("invalid_user_id", err)
	}
	b, err := h.svc.Update(c.UserContext(), uid, req)
	if err != nil {
		return err
	}
	return httpx.OK(c, b)
}
