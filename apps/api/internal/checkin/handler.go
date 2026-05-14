package checkin

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/access"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

type Handler struct {
	svc      *Service
	resolver *access.Resolver
}

// NewHandler returns a check-in handler. The resolver translates the
// request identity into an authoritative client_id — handlers never
// trust query/path-supplied clientIds for client-role callers.
func NewHandler(svc *Service, resolver *access.Resolver) *Handler {
	return &Handler{svc: svc, resolver: resolver}
}

func (h *Handler) Submit(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
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
	cid, err := h.resolver.ClientID(c)
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
	cid, err := h.resolver.ClientID(c)
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

// Summary returns the per-client streak + weekly compliance roll-up.
// Used by /client/today's hero strip.
func (h *Handler) Summary(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
	if err != nil {
		return err
	}
	sm, err := h.svc.Summary(c.UserContext(), cid)
	if err != nil {
		return err
	}
	return httpx.OK(c, sm)
}
