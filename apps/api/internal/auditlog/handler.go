package auditlog

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// List — GET /api/admin/audit-log
func (h *Handler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "50"))
	rows, total, err := h.svc.List(c.UserContext(), ListParams{
		Page:     page,
		PageSize: pageSize,
		Action:   c.Query("action"),
		UserID:   c.Query("userId"),
	})
	if err != nil {
		return err
	}
	return httpx.Paginated(c, rows, total, page, pageSize)
}
