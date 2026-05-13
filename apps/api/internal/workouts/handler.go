package workouts

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// adminID pulls the authenticated user's UUID out of fiber.Locals — used as
// the created_by FK on library entries / templates.
func adminID(c *fiber.Ctx) (pgtype.UUID, error) {
	idStr, _ := c.Locals(auth.LocalsUserID).(string)
	u, err := pgxutil.UUIDFromString(idStr)
	if err != nil {
		return pgtype.UUID{}, httpx.Internal("invalid_user_id", err)
	}
	return u, nil
}

// ════════════════════════════════════════
// Library
// ════════════════════════════════════════

// ListLibrary: GET /api/exercises/library — paginated, optional ?muscle &
// ?search.
func (h *Handler) ListLibrary(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "50"))
	items, total, err := h.svc.ListLibrary(c.UserContext(), LibraryListParams{
		Page:        page,
		PageSize:    pageSize,
		Search:      c.Query("search"),
		MuscleGroup: c.Query("muscle"),
	})
	if err != nil {
		return err
	}
	return httpx.Paginated(c, items, total, page, pageSize)
}

// CreateLibrary: POST /api/exercises/library — admin only.
func (h *Handler) CreateLibrary(c *fiber.Ctx) error {
	var req LibraryCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	uid, err := adminID(c)
	if err != nil {
		return err
	}
	entry, err := h.svc.CreateLibrary(c.UserContext(), req, uid)
	if err != nil {
		return err
	}
	return httpx.Created(c, entry)
}

// PatchLibrary: PATCH /api/exercises/library/:id — admin only.
func (h *Handler) PatchLibrary(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req LibraryUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.UpdateLibrary(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// DeleteLibrary: DELETE /api/exercises/library/:id — admin only.
func (h *Handler) DeleteLibrary(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	if err := h.svc.DeleteLibrary(c.UserContext(), id); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

// ════════════════════════════════════════
// Plans
// ════════════════════════════════════════

// ListPlans: GET /api/workouts/plans?clientId=…
func (h *Handler) ListPlans(c *fiber.Ctx) error {
	cid, err := pgxutil.UUIDFromString(c.Query("clientId"))
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId is required")
	}
	out, err := h.svc.ListPlans(c.UserContext(), cid)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// GetPlan: GET /api/workouts/plans/:id — full graph (days + exercises).
func (h *Handler) GetPlan(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	out, err := h.svc.GetPlanFull(c.UserContext(), id)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// CreatePlan: POST /api/workouts/plans — admin only.
func (h *Handler) CreatePlan(c *fiber.Ctx) error {
	var req PlanCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.CreatePlan(c.UserContext(), req)
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// PatchPlan: PATCH /api/workouts/plans/:id — admin only.
func (h *Handler) PatchPlan(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req PlanUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.UpdatePlan(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// DeletePlan: DELETE /api/workouts/plans/:id — admin only.
func (h *Handler) DeletePlan(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	if err := h.svc.DeletePlan(c.UserContext(), id); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

// ════════════════════════════════════════
// Days
// ════════════════════════════════════════

// CreateDay: POST /api/workouts/plans/:id/days — admin only.
func (h *Handler) CreateDay(c *fiber.Ctx) error {
	pid, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req DayCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.CreateDay(c.UserContext(), pid, req)
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// PatchDay: PATCH /api/workouts/days/:id — admin only.
func (h *Handler) PatchDay(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req DayUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.UpdateDay(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// DeleteDay: DELETE /api/workouts/days/:id — admin only.
func (h *Handler) DeleteDay(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	if err := h.svc.DeleteDay(c.UserContext(), id); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

// ════════════════════════════════════════
// Exercises
// ════════════════════════════════════════

// CreateExercise: POST /api/workouts/days/:id/exercises — admin only.
func (h *Handler) CreateExercise(c *fiber.Ctx) error {
	did, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req ExerciseCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.CreateExercise(c.UserContext(), did, req)
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// PatchExercise: PATCH /api/workouts/exercises/:id — admin only.
func (h *Handler) PatchExercise(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req ExerciseUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.UpdateExercise(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// DeleteExercise: DELETE /api/workouts/exercises/:id — admin only.
func (h *Handler) DeleteExercise(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	if err := h.svc.DeleteExercise(c.UserContext(), id); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

// ════════════════════════════════════════
// Templates
// ════════════════════════════════════════

// ListTemplates: GET /api/workouts/templates — admin only.
func (h *Handler) ListTemplates(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "50"))
	items, total, err := h.svc.ListTemplates(c.UserContext(), page, pageSize)
	if err != nil {
		return err
	}
	return httpx.Paginated(c, items, total, page, pageSize)
}

// CreateTemplate: POST /api/workouts/templates — admin only.
func (h *Handler) CreateTemplate(c *fiber.Ctx) error {
	var req TemplateCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	uid, err := adminID(c)
	if err != nil {
		return err
	}
	out, err := h.svc.CreateTemplate(c.UserContext(), req, uid)
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// DeleteTemplate: DELETE /api/workouts/templates/:id — admin only.
func (h *Handler) DeleteTemplate(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	if err := h.svc.DeleteTemplate(c.UserContext(), id); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

// ════════════════════════════════════════
// Logs
// ════════════════════════════════════════

// ListLogs: GET /api/workouts/logs?clientId=…&exerciseId=…
//
// Admin-only in Phase 3. The client portal endpoints (Phase 4) will derive
// the client_id from the JWT and route through this same service.
func (h *Handler) ListLogs(c *fiber.Ctx) error {
	cid, err := pgxutil.UUIDFromString(c.Query("clientId"))
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId is required")
	}
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "50"))

	out, err := h.svc.ListLogs(c.UserContext(), cid, LogListParams{
		Page:       page,
		PageSize:   pageSize,
		ExerciseID: c.Query("exerciseId"),
	})
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// CreateLog: POST /api/workouts/logs — admin-only in Phase 3. Body must
// include clientId. The Phase 4 client portal will expose a sibling route
// that injects clientId from the JWT.
func (h *Handler) CreateLog(c *fiber.Ctx) error {
	var body struct {
		LogCreateRequest
		ClientID string `json:"clientId"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	cid, err := pgxutil.UUIDFromString(body.ClientID)
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId is required")
	}
	out, err := h.svc.CreateLog(c.UserContext(), cid, body.LogCreateRequest)
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}
