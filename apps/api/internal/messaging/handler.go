package messaging

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

func (h *Handler) Send(c *fiber.Ctx) error {
	userID, _ := c.Locals(auth.LocalsUserID).(string)
	uid, err := pgxutil.UUIDFromString(userID)
	if err != nil {
		return httpx.Unauthorized("invalid_user", "invalid user")
	}
	var req SendMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "invalid request body")
	}
	msg, err := h.svc.Send(c.UserContext(), uid, req)
	if err != nil {
		return err
	}
	return httpx.Created(c, msg)
}

func (h *Handler) ListThread(c *fiber.Ctx) error {
	userID, _ := c.Locals(auth.LocalsUserID).(string)
	uid, err := pgxutil.UUIDFromString(userID)
	if err != nil {
		return httpx.Unauthorized("invalid_user", "invalid user")
	}
	otherID, err := pgxutil.UUIDFromString(c.Params("userId"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "userId must be a UUID")
	}
	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	// Mark as read while listing
	_ = h.svc.MarkRead(c.UserContext(), uid, otherID)

	msgs, err := h.svc.ListThread(c.UserContext(), uid, otherID, limit, offset)
	if err != nil {
		return err
	}
	return httpx.OK(c, msgs)
}

func (h *Handler) ListNotifications(c *fiber.Ctx) error {
	userID, _ := c.Locals(auth.LocalsUserID).(string)
	uid, err := pgxutil.UUIDFromString(userID)
	if err != nil {
		return httpx.Unauthorized("invalid_user", "invalid user")
	}
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))
	notifs, err := h.svc.ListNotifications(c.UserContext(), uid, limit, offset)
	if err != nil {
		return err
	}
	return httpx.OK(c, notifs)
}

func (h *Handler) MarkNotificationRead(c *fiber.Ctx) error {
	userID, _ := c.Locals(auth.LocalsUserID).(string)
	uid, err := pgxutil.UUIDFromString(userID)
	if err != nil {
		return httpx.Unauthorized("invalid_user", "invalid user")
	}
	nid, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	if err := h.svc.MarkNotificationRead(c.UserContext(), nid, uid); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

func (h *Handler) MarkAllNotificationsRead(c *fiber.Ctx) error {
	userID, _ := c.Locals(auth.LocalsUserID).(string)
	uid, err := pgxutil.UUIDFromString(userID)
	if err != nil {
		return httpx.Unauthorized("invalid_user", "invalid user")
	}
	if err := h.svc.MarkAllNotificationsRead(c.UserContext(), uid); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

func (h *Handler) CountUnread(c *fiber.Ctx) error {
	userID, _ := c.Locals(auth.LocalsUserID).(string)
	uid, err := pgxutil.UUIDFromString(userID)
	if err != nil {
		return httpx.Unauthorized("invalid_user", "invalid user")
	}
	count, err := h.svc.CountUnread(c.UserContext(), uid)
	if err != nil {
		return err
	}
	return httpx.OK(c, map[string]int{"count": count})
}
