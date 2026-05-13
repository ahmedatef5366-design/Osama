package workouts

import (
	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// GetLibrary: GET /api/exercise-library/:id — admin or authed user.
func (h *Handler) GetLibrary(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	out, err := h.svc.GetLibrary(c.UserContext(), id)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// GetClientActivePlan: GET /api/clients/:id/workout-plan.
// Returns the full graph of the client's currently-active workout plan.
func (h *Handler) GetClientActivePlan(c *fiber.Ctx) error {
	cid, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "id must be a UUID")
	}
	out, err := h.svc.GetActivePlanFull(c.UserContext(), cid)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// CreateClientPlan: POST /api/clients/:id/workout-plan.
// The clientId is taken from the URL — the body only needs name + isActive.
func (h *Handler) CreateClientPlan(c *fiber.Ctx) error {
	cid := c.Params("id")
	if _, err := pgxutil.UUIDFromString(cid); err != nil {
		return httpx.BadRequest("invalid_client_id", "id must be a UUID")
	}
	var body struct {
		Name     string `json:"name"`
		IsActive bool   `json:"isActive"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.CreatePlan(c.UserContext(), PlanCreateRequest{
		ClientID: cid,
		Name:     body.Name,
		IsActive: body.IsActive,
	})
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// SnapshotAsTemplate: POST /api/workout-plans/:id/save-as-template — admin
// snapshots the current plan tree into a reusable plan_template.
func (h *Handler) SnapshotAsTemplate(c *fiber.Ctx) error {
	pid, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var body struct {
		Name        string  `json:"name"`
		Description *string `json:"description"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	if body.Name == "" {
		return httpx.BadRequest("invalid_name", "name is required")
	}
	snap, err := h.svc.SnapshotPlan(c.UserContext(), pid)
	if err != nil {
		return err
	}
	uid, err := adminID(c)
	if err != nil {
		return err
	}
	out, err := h.svc.CreateTemplate(c.UserContext(), TemplateCreateRequest{
		Name:        body.Name,
		Description: body.Description,
		PlanJSON:    snap,
	}, uid)
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// ApplyTemplate: POST /api/workout-templates/:id/apply — admin clones a
// template onto a client. Body: { clientId, isActive }.
func (h *Handler) ApplyTemplate(c *fiber.Ctx) error {
	tid, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var body struct {
		ClientID string `json:"clientId"`
		IsActive bool   `json:"isActive"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	cid, err := pgxutil.UUIDFromString(body.ClientID)
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId must be a UUID")
	}
	out, err := h.svc.ApplyTemplate(c.UserContext(), tid, cid, body.IsActive)
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// GetLatestLog: GET /api/workout-logs/:clientId/latest?exerciseId=...
// Returns the most recent set logged for that exercise.
func (h *Handler) GetLatestLog(c *fiber.Ctx) error {
	cid, err := pgxutil.UUIDFromString(c.Params("clientId"))
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId must be a UUID")
	}
	exID, err := pgxutil.UUIDFromString(c.Query("exerciseId"))
	if err != nil {
		return httpx.BadRequest("invalid_exercise_id", "exerciseId is required")
	}
	out, err := h.svc.GetLatestLogForExercise(c.UserContext(), cid, exID)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}
