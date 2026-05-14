package invites

import (
	"net/url"
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// Handler wires the invite service into Fiber. WebBaseURL is the
// public-facing origin of the web app; it's used to assemble the invite
// URL handed to the trainee. Falls back to "" — the admin can also
// build the URL themselves from the returned token.
type Handler struct {
	svc        *Service
	WebBaseURL string
}

func NewHandler(svc *Service, webBaseURL string) *Handler {
	return &Handler{svc: svc, WebBaseURL: strings.TrimRight(webBaseURL, "/")}
}

// Create — POST /api/admin/invites
func (h *Handler) Create(c *fiber.Ctx) error {
	var req CreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	uidStr, _ := c.Locals(auth.LocalsUserID).(string)
	uid, err := pgxutil.UUIDFromString(uidStr)
	if err != nil {
		return httpx.Internal("invalid_user_id", err)
	}
	inv, plain, err := h.svc.Create(c.UserContext(), uid, req)
	if err != nil {
		return err
	}
	resp := CreateResponse{Invite: inv, Token: plain}
	if h.WebBaseURL != "" {
		resp.URL = h.WebBaseURL + "/invite/" + url.PathEscape(plain)
	}
	return httpx.Created(c, resp)
}

// List — GET /api/admin/invites?status=pending
func (h *Handler) List(c *fiber.Ctx) error {
	status := c.Query("status")
	out, err := h.svc.List(c.UserContext(), status)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// Revoke — POST /api/admin/invites/:id/revoke
func (h *Handler) Revoke(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	inv, err := h.svc.Revoke(c.UserContext(), id)
	if err != nil {
		return err
	}
	return httpx.OK(c, inv)
}

// Lookup — GET /api/invites/:token (public)
func (h *Handler) Lookup(c *fiber.Ctx) error {
	inv, err := h.svc.LookupByToken(c.UserContext(), c.Params("token"))
	if err != nil {
		return err
	}
	return httpx.OK(c, inv)
}

// Accept — POST /api/invites/:token/accept (public)
func (h *Handler) Accept(c *fiber.Ctx) error {
	var req AcceptRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	if _, err := h.svc.Accept(c.UserContext(), c.Params("token"), req.Password); err != nil {
		return err
	}
	return httpx.OK(c, fiber.Map{"ok": true})
}
