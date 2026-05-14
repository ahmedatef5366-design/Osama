package templates

import (
	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// List — GET /api/templates  (?active=1 filters out archived rows)
func (h *Handler) List(c *fiber.Ctx) error {
	activeOnly := c.Query("active") == "1" || c.Query("active") == "true"
	rows, err := h.svc.List(c.UserContext(), activeOnly)
	if err != nil {
		return err
	}
	return httpx.OK(c, rows)
}

// Create — POST /api/admin/templates
func (h *Handler) Create(c *fiber.Ctx) error {
	var req CreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "invalid json")
	}
	t, err := h.svc.Create(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": t})
}

// Update — PATCH /api/admin/templates/:id
func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req UpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "invalid json")
	}
	t, err := h.svc.Update(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return httpx.OK(c, t)
}

// Delete — DELETE /api/admin/templates/:id
func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	if err := h.svc.Delete(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
