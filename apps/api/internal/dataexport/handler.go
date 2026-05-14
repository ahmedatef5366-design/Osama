package dataexport

import (
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

func NewHandler(svc *Service, resolver *access.Resolver) *Handler {
	return &Handler{svc: svc, resolver: resolver}
}

// AdminClients — GET /api/admin/exports/clients.csv
func (h *Handler) AdminClients(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", `attachment; filename="clients-`+stamp()+`.csv"`)
	if err := h.svc.WriteClientsCSV(c.UserContext(), c.Response().BodyWriter()); err != nil {
		return httpx.Internal("export_failed", err)
	}
	return nil
}

// AdminCheckins — GET /api/admin/exports/checkins.csv
func (h *Handler) AdminCheckins(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", `attachment; filename="checkins-`+stamp()+`.csv"`)
	if err := h.svc.WriteCheckinsCSV(c.UserContext(), c.Response().BodyWriter()); err != nil {
		return httpx.Internal("export_failed", err)
	}
	return nil
}

// AdminClientCSV — GET /api/admin/exports/clients/:id.csv
func (h *Handler) AdminClientCSV(c *fiber.Ctx) error {
	id := c.Params("id")
	if _, err := pgxutil.UUIDFromString(id); err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", `attachment; filename="client-`+id+`-`+stamp()+`.csv"`)
	if err := h.svc.WriteSingleClientCSV(c.UserContext(), c.Response().BodyWriter(), id); err != nil {
		return httpx.Internal("export_failed", err)
	}
	return nil
}

// ClientSelfExport — GET /api/clients/me/export.json. Resolver.ClientID
// already enforces "client callers see their own row only".
func (h *Handler) ClientSelfExport(c *fiber.Ctx) error {
	cid, err := h.resolver.ClientID(c)
	if err != nil {
		return err
	}
	export, err := h.svc.BuildSelfExport(c.UserContext(), pgxutil.UUIDToString(cid))
	if err != nil {
		return httpx.Internal("export_failed", err)
	}
	c.Set("Content-Disposition", `attachment; filename="me-`+stamp()+`.json"`)
	return httpx.OK(c, export)
}

func stamp() string {
	return time.Now().UTC().Format("20060102-150405")
}
