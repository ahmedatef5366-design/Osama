package checkin

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Submit(c *fiber.Ctx) error {
	userID, _ := c.Locals(auth.LocalsUserID).(string)
	cid, err := resolveClientID(c, userID)
	if err != nil {
		return err
	}
	var req SubmitCheckinRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "invalid request body")
	}
	ch, err := h.svc.Submit(c.UserContext(), cid, req)
	if err != nil {
		return err
	}
	return httpx.Created(c, ch)
}

func (h *Handler) Get(c *fiber.Ctx) error {
	userID, _ := c.Locals(auth.LocalsUserID).(string)
	cid, err := resolveClientID(c, userID)
	if err != nil {
		return err
	}
	date := c.Query("date", time.Now().Format("2006-01-02"))
	ch, err := h.svc.Get(c.UserContext(), cid, date)
	if err != nil {
		return err
	}
	return httpx.OK(c, ch)
}

func (h *Handler) List(c *fiber.Ctx) error {
	userID, _ := c.Locals(auth.LocalsUserID).(string)
	cid, err := resolveClientID(c, userID)
	if err != nil {
		return err
	}
	limit, _ := strconv.Atoi(c.Query("limit", "30"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))
	checkins, err := h.svc.List(c.UserContext(), cid, limit, offset)
	if err != nil {
		return err
	}
	return httpx.OK(c, checkins)
}

func (h *Handler) AtRisk(c *fiber.Ctx) error {
	clients, err := h.svc.AtRisk(c.UserContext())
	if err != nil {
		return err
	}
	return httpx.OK(c, clients)
}

func resolveClientID(c *fiber.Ctx, userID string) (pgtype.UUID, error) {
	if id := c.Params("clientId"); id != "" {
		return pgxutil.UUIDFromString(id)
	}
	if id := c.Query("clientId"); id != "" {
		return pgxutil.UUIDFromString(id)
	}
	return pgxutil.UUIDFromString(userID)
}
