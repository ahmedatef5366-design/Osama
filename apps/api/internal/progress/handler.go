package progress

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/access"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

type Handler struct {
	svc      *Service
	resolver *access.Resolver
}

// NewHandler returns a progress handler. The resolver translates the
// request identity into an authoritative client_id — handlers never
// trust query/path-supplied clientIds for client-role callers.
func NewHandler(svc *Service, resolver *access.Resolver) *Handler {
	return &Handler{svc: svc, resolver: resolver}
}

// ── Weight ─────────────────────────────────────────────────────

func (h *Handler) LogWeight(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
	if err != nil {
		return err
	}
	var req LogWeightRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "invalid request body")
	}
	if err := h.svc.LogWeight(c.UserContext(), cid, req); err != nil {
		return err
	}
	return httpx.Created(c, map[string]string{"status": "ok"})
}

func (h *Handler) ListWeight(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
	if err != nil {
		return err
	}
	from := parseTime(c.Query("from"), time.Now().AddDate(0, -3, 0))
	to := parseTime(c.Query("to"), time.Now())
	entries, err := h.svc.ListWeight(c.UserContext(), cid, from, to)
	if err != nil {
		return err
	}
	return httpx.OK(c, entries)
}

// ── Measurements ───────────────────────────────────────────────

func (h *Handler) LogMeasurement(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
	if err != nil {
		return err
	}
	var req LogMeasurementRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "invalid request body")
	}
	if err := h.svc.LogMeasurement(c.UserContext(), cid, req); err != nil {
		return err
	}
	return httpx.Created(c, map[string]string{"status": "ok"})
}

func (h *Handler) ListMeasurements(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
	if err != nil {
		return err
	}
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))
	entries, err := h.svc.ListMeasurements(c.UserContext(), cid, limit, offset)
	if err != nil {
		return err
	}
	return httpx.OK(c, entries)
}

// ── Photos ─────────────────────────────────────────────────────

func (h *Handler) UploadPhoto(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
	if err != nil {
		return err
	}
	var req UploadPhotoRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "invalid request body")
	}
	photo, err := h.svc.UploadPhoto(c.UserContext(), cid, req)
	if err != nil {
		return err
	}
	return httpx.Created(c, photo)
}

func (h *Handler) ListPhotos(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
	if err != nil {
		return err
	}
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))
	photos, err := h.svc.ListPhotos(c.UserContext(), cid, limit, offset)
	if err != nil {
		return err
	}
	return httpx.OK(c, photos)
}

func (h *Handler) DeletePhoto(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
	if err != nil {
		return err
	}
	photoID, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	if err := h.svc.DeletePhoto(c.UserContext(), photoID, cid); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

// ── helpers ────────────────────────────────────────────────────

func parseTime(s string, fallback time.Time) time.Time {
	if s == "" {
		return fallback
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		t, err = time.Parse("2006-01-02", s)
		if err != nil {
			return fallback
		}
	}
	return t
}
