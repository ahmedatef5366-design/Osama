package content

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

// Handler holds the CMS HTTP handlers.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// GetPublic: GET /api/site-content/:section — unauthenticated read.
// Used by the landing page during server rendering.
func (h *Handler) GetPublic(c *fiber.Ctx) error {
	section := c.Params("section")
	sec, err := h.svc.Get(c.UserContext(), section)
	if err != nil {
		return err
	}
	// Short browser cache + revalidate; bust happens at the API level on save.
	c.Set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
	return httpx.OK(c, sec)
}

// List: GET /api/site-content — admin-only, returns every section.
func (h *Handler) List(c *fiber.Ctx) error {
	sections, err := h.svc.List(c.UserContext())
	if err != nil {
		return err
	}
	return httpx.OK(c, sections)
}

// Upsert: PUT /api/site-content/:section — admin-only.
func (h *Handler) Upsert(c *fiber.Ctx) error {
	section := c.Params("section")
	var req UpsertRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	actorID, _ := c.Locals(auth.LocalsUserID).(string)
	sec, err := h.svc.Upsert(c.UserContext(), section, req, actorID)
	if err != nil {
		return err
	}
	return httpx.OK(c, sec)
}

// History: GET /api/site-content/:section/history — admin-only.
func (h *Handler) History(c *fiber.Ctx) error {
	section := c.Params("section")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))
	rows, total, err := h.svc.ListHistory(c.UserContext(), section, page, pageSize)
	if err != nil {
		return err
	}
	return httpx.Paginated(c, rows, total, page, pageSize)
}

// Rollback: POST /api/site-content/:section/rollback — admin-only.
func (h *Handler) Rollback(c *fiber.Ctx) error {
	section := c.Params("section")
	var req RollbackRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	if req.HistoryID == "" {
		return httpx.BadRequest("invalid_history_id", "historyId is required")
	}
	actorID, _ := c.Locals(auth.LocalsUserID).(string)
	sec, err := h.svc.Rollback(c.UserContext(), section, req.HistoryID, actorID)
	if err != nil {
		return err
	}
	return httpx.OK(c, sec)
}
