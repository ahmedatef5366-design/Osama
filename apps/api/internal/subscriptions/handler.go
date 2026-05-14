package subscriptions

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/access"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

type Handler struct {
	svc      *Service
	resolver *access.Resolver
}

func NewHandler(svc *Service, resolver *access.Resolver) *Handler {
	return &Handler{svc: svc, resolver: resolver}
}

// ListPlans — GET /api/plans (public; the pricing section also calls this)
func (h *Handler) ListPlans(c *fiber.Ctx) error {
	plans, err := h.svc.ListPlans(c.UserContext())
	if err != nil {
		return err
	}
	return httpx.OK(c, plans)
}

// AdminList — GET /api/admin/subscriptions
func (h *Handler) AdminList(c *fiber.Ctx) error {
	list, err := h.svc.ListAll(c.UserContext())
	if err != nil {
		return err
	}
	return httpx.OK(c, list)
}

// AdminUpsert — POST /api/admin/subscriptions
func (h *Handler) AdminUpsert(c *fiber.Ctx) error {
	var req UpsertRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "invalid json")
	}
	sub, err := h.svc.Upsert(c.UserContext(), req, currentUserID(c))
	if err != nil {
		return err
	}
	return httpx.OK(c, sub)
}

// AdminCancel — POST /api/admin/subscriptions/:clientId/cancel
func (h *Handler) AdminCancel(c *fiber.Ctx) error {
	cid, err := pgxutil.UUIDFromString(c.Params("clientId"))
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId must be a UUID")
	}
	var req CancelRequest
	_ = c.BodyParser(&req)
	sub, err := h.svc.Cancel(c.UserContext(), cid, req.Reason, currentUserID(c))
	if err != nil {
		return err
	}
	return httpx.OK(c, sub)
}

// AdminHistory — GET /api/admin/subscriptions/:clientId/history
func (h *Handler) AdminHistory(c *fiber.Ctx) error {
	cid, err := pgxutil.UUIDFromString(c.Params("clientId"))
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId must be a UUID")
	}
	rows, err := h.svc.History(c.UserContext(), cid)
	if err != nil {
		return err
	}
	return httpx.OK(c, rows)
}

// ClientGet — GET /api/subscription (client-scoped; reads identity from JWT)
func (h *Handler) ClientGet(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
	if err != nil {
		return err
	}
	sub, err := h.svc.GetForClient(c.UserContext(), cid)
	if err != nil {
		return err
	}
	return httpx.OK(c, sub)
}

func currentUserID(c *fiber.Ctx) pgtype.UUID {
	uid, _ := c.Locals(auth.LocalsUserID).(string)
	if uid == "" {
		return pgtype.UUID{}
	}
	u, err := pgxutil.UUIDFromString(uid)
	if err != nil {
		return pgtype.UUID{}
	}
	return u
}
