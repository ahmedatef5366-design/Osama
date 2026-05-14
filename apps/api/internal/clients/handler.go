package clients

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// List: GET /api/clients
func (h *Handler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))
	search := c.Query("search")

	var active *bool
	if v := c.Query("active"); v != "" {
		b, err := strconv.ParseBool(v)
		if err != nil {
			return httpx.BadRequest("invalid_active", "active must be true or false")
		}
		active = &b
	}

	rows, total, err := h.svc.List(c.UserContext(), ListParams{
		Page:       page,
		PageSize:   pageSize,
		Search:     search,
		ActiveOnly: active,
	})
	if err != nil {
		return err
	}
	return httpx.Paginated(c, rows, total, page, pageSize)
}

// Get: GET /api/clients/:id — admin OR the client themselves.
func (h *Handler) Get(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}

	role, _ := c.Locals(auth.LocalsUserRole).(string)
	userID, _ := c.Locals(auth.LocalsUserID).(string)

	client, err := h.svc.Get(c.UserContext(), id)
	if err != nil {
		return err
	}
	if role != string(auth.RoleAdmin) && client.UserID != userID {
		return httpx.Forbidden("forbidden", "you can only access your own profile")
	}
	return httpx.OK(c, client)
}

// Me: GET /api/clients/me — client fetches their own profile.
func (h *Handler) Me(c *fiber.Ctx) error {
	userIDStr, _ := c.Locals(auth.LocalsUserID).(string)
	uid, err := pgxutil.UUIDFromString(userIDStr)
	if err != nil {
		return httpx.Internal("invalid_user_id", err)
	}
	client, err := h.svc.GetByUserID(c.UserContext(), uid)
	if err != nil {
		return err
	}
	return httpx.OK(c, client)
}

// Create: POST /api/clients — admin only.
func (h *Handler) Create(c *fiber.Ctx) error {
	var req CreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	client, err := h.svc.Create(c.UserContext(), req)
	if err != nil {
		return err
	}
	return httpx.Created(c, client)
}

// Patch: PATCH /api/clients/:id — admin only.
func (h *Handler) Patch(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req UpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	client, err := h.svc.Update(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return httpx.OK(c, client)
}

// GetContact: GET /api/clients/:id/contact — admin OR the client themselves.
func (h *Handler) GetContact(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	// Authorisation parity with Get: admins can read any client, the
	// client themselves can read their own, no-one else.
	role, _ := c.Locals(auth.LocalsUserRole).(string)
	if role != string(auth.RoleAdmin) {
		userIDStr, _ := c.Locals(auth.LocalsUserID).(string)
		uid, _ := pgxutil.UUIDFromString(userIDStr)
		self, err := h.svc.GetByUserID(c.UserContext(), uid)
		if err != nil {
			return err
		}
		if self.ID != c.Params("id") {
			return httpx.Forbidden("forbidden", "cannot read contact for another client")
		}
	}
	contact, err := h.svc.GetContact(c.UserContext(), id)
	if err != nil {
		return err
	}
	return httpx.OK(c, contact)
}

// PatchContact: PATCH /api/clients/:id/contact — admin only.
func (h *Handler) PatchContact(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req ContactPatch
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	contact, err := h.svc.UpdateContact(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return httpx.OK(c, contact)
}
