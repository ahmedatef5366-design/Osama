package nutrition

import (
	"encoding/csv"
	"errors"
	"io"
	"strconv"
	"strings"
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

func NewHandler(s *Service) *Handler { return &Handler{svc: s} }

// adminID extracts the authenticated user's UUID from fiber.Locals — used
// as the created_by column on inserts.
func adminID(c *fiber.Ctx) (pgtype.UUID, error) {
	idStr, _ := c.Locals(auth.LocalsUserID).(string)
	if idStr == "" {
		return pgtype.UUID{}, httpx.Unauthorized("not_authenticated", "missing auth")
	}
	u, err := pgxutil.UUIDFromString(idStr)
	if err != nil {
		return pgtype.UUID{}, httpx.Unauthorized("invalid_subject", "bad user_id local")
	}
	return u, nil
}

// ════════════════════════════════════════
// Plans
// ════════════════════════════════════════

// ListPlans: GET /api/clients/:id/nutrition-plans — admin.
func (h *Handler) ListPlans(c *fiber.Ctx) error {
	cid, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "id must be a UUID")
	}
	out, err := h.svc.ListPlans(c.UserContext(), cid)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// GetClientActivePlan: GET /api/clients/:id/nutrition-plan.
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

// GetPlan: GET /api/nutrition-plans/:id — admin.
func (h *Handler) GetPlan(c *fiber.Ctx) error {
	pid, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	out, err := h.svc.GetPlanFull(c.UserContext(), pid)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// CreateClientPlan: POST /api/clients/:id/nutrition-plan — admin.
func (h *Handler) CreateClientPlan(c *fiber.Ctx) error {
	cid := c.Params("id")
	if _, err := pgxutil.UUIDFromString(cid); err != nil {
		return httpx.BadRequest("invalid_client_id", "id must be a UUID")
	}
	var body struct {
		Mode           string   `json:"mode"`
		CaloriesTarget *int32   `json:"caloriesTarget"`
		ProteinG       *float64 `json:"proteinG"`
		CarbsG         *float64 `json:"carbsG"`
		FatG           *float64 `json:"fatG"`
		IsActive       bool     `json:"isActive"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.CreatePlan(c.UserContext(), PlanCreateRequest{
		ClientID:       cid,
		Mode:           body.Mode,
		CaloriesTarget: body.CaloriesTarget,
		ProteinG:       body.ProteinG,
		CarbsG:         body.CarbsG,
		FatG:           body.FatG,
		IsActive:       body.IsActive,
	})
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// PatchPlan: PATCH /api/nutrition-plans/:id — admin.
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

// DeletePlan: DELETE /api/nutrition-plans/:id — admin.
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
// Meals
// ════════════════════════════════════════

// CreateMeal: POST /api/nutrition-plans/:id/meals — admin.
func (h *Handler) CreateMeal(c *fiber.Ctx) error {
	pid, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req MealCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.CreateMeal(c.UserContext(), pid, req)
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// PatchMeal: PATCH /api/meals/:id — admin.
func (h *Handler) PatchMeal(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req MealUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.UpdateMeal(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// DeleteMeal: DELETE /api/meals/:id — admin.
func (h *Handler) DeleteMeal(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	if err := h.svc.DeleteMeal(c.UserContext(), id); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

// ════════════════════════════════════════
// Food database
// ════════════════════════════════════════

// SearchFoods: GET /api/food-database?search=…&page=…&pageSize=… — admin + client.
func (h *Handler) SearchFoods(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "50"))
	out, total, err := h.svc.SearchFoods(c.UserContext(), FoodListParams{
		Page:     page,
		PageSize: pageSize,
		Search:   c.Query("search"),
	})
	if err != nil {
		return err
	}
	return httpx.Paginated(c, out, total, page, pageSize)
}

// GetFood: GET /api/food-database/:id.
func (h *Handler) GetFood(c *fiber.Ctx) error {
	// Allow lookup by barcode via "barcode:XYZ" prefix, otherwise treat as UUID.
	p := c.Params("id")
	if strings.HasPrefix(p, "barcode:") {
		out, err := h.svc.GetFoodByBarcode(c.UserContext(), strings.TrimPrefix(p, "barcode:"))
		if err != nil {
			return err
		}
		return httpx.OK(c, out)
	}
	id, err := pgxutil.UUIDFromString(p)
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	out, err := h.svc.GetFood(c.UserContext(), id)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// CreateFood: POST /api/food-database — admin.
func (h *Handler) CreateFood(c *fiber.Ctx) error {
	var req FoodCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	uid, err := adminID(c)
	if err != nil {
		return err
	}
	out, err := h.svc.CreateFood(c.UserContext(), req, uid)
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// PatchFood: PATCH /api/food-database/:id — admin.
func (h *Handler) PatchFood(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	var req FoodUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := h.svc.UpdateFood(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// DeleteFood: DELETE /api/food-database/:id — admin.
func (h *Handler) DeleteFood(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	if err := h.svc.DeleteFood(c.UserContext(), id); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

// ImportFoodsCSV: POST /api/food-database/import — admin uploads a CSV file.
//
// Expected columns (header row required, case-insensitive):
//
//	name, name_ar, brand, barcode,
//	calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
//	is_verified
//
// Empty cells are treated as NULL for optional fields. Numeric cells
// default to 0 when blank. The upload is all-or-nothing (single tx).
func (h *Handler) ImportFoodsCSV(c *fiber.Ctx) error {
	fh, err := c.FormFile("file")
	if err != nil {
		return httpx.BadRequest("missing_file", "multipart field 'file' is required")
	}
	f, err := fh.Open()
	if err != nil {
		return httpx.BadRequest("file_open_failed", "could not open uploaded file")
	}
	defer func() { _ = f.Close() }()

	r := csv.NewReader(f)
	r.TrimLeadingSpace = true
	r.FieldsPerRecord = -1 // allow ragged rows; we validate column-by-name

	header, err := r.Read()
	if err != nil {
		return httpx.BadRequest("empty_csv", "CSV has no header row")
	}
	idx := map[string]int{}
	for i, h := range header {
		idx[strings.ToLower(strings.TrimSpace(h))] = i
	}
	requireCol := func(name string) (int, error) {
		i, ok := idx[name]
		if !ok {
			return 0, httpx.BadRequest("missing_column", "CSV is missing required column: "+name)
		}
		return i, nil
	}
	colName, err := requireCol("name")
	if err != nil {
		return err
	}
	colCals, err := requireCol("calories_per_100g")
	if err != nil {
		return err
	}
	colProt, err := requireCol("protein_per_100g")
	if err != nil {
		return err
	}
	colCarb, err := requireCol("carbs_per_100g")
	if err != nil {
		return err
	}
	colFat, err := requireCol("fat_per_100g")
	if err != nil {
		return err
	}

	items := make([]FoodCreateRequest, 0, 64)
	row := 1 // for human-friendly errors
	for {
		rec, err := r.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return httpx.BadRequest("csv_parse_failed", err.Error())
		}
		row++
		get := func(col int) string {
			if col < 0 || col >= len(rec) {
				return ""
			}
			return strings.TrimSpace(rec[col])
		}
		req := FoodCreateRequest{Name: get(colName)}
		if v := get(colName); v == "" {
			return httpx.BadRequest("invalid_row",
				"row "+strconv.Itoa(row)+": name is required")
		}
		if i, ok := idx["name_ar"]; ok {
			if v := get(i); v != "" {
				req.NameAr = &v
			}
		}
		if i, ok := idx["brand"]; ok {
			if v := get(i); v != "" {
				req.Brand = &v
			}
		}
		if i, ok := idx["barcode"]; ok {
			if v := get(i); v != "" {
				req.Barcode = &v
			}
		}
		parseFloat := func(col int, label string) (float64, error) {
			s := get(col)
			if s == "" {
				return 0, nil
			}
			v, perr := strconv.ParseFloat(s, 64)
			if perr != nil {
				return 0, httpx.BadRequest("invalid_row",
					"row "+strconv.Itoa(row)+": "+label+" is not a number")
			}
			return v, nil
		}
		if req.CaloriesPer100g, err = parseFloat(colCals, "calories_per_100g"); err != nil {
			return err
		}
		if req.ProteinPer100g, err = parseFloat(colProt, "protein_per_100g"); err != nil {
			return err
		}
		if req.CarbsPer100g, err = parseFloat(colCarb, "carbs_per_100g"); err != nil {
			return err
		}
		if req.FatPer100g, err = parseFloat(colFat, "fat_per_100g"); err != nil {
			return err
		}
		if i, ok := idx["is_verified"]; ok {
			s := strings.ToLower(get(i))
			if s == "true" || s == "1" || s == "yes" {
				v := true
				req.IsVerified = &v
			} else if s == "false" || s == "0" || s == "no" {
				v := false
				req.IsVerified = &v
			}
		}
		items = append(items, req)
	}

	uid, err := adminID(c)
	if err != nil {
		return err
	}
	out, err := h.svc.BulkCreateFoods(c.UserContext(), items, uid)
	if err != nil {
		return err
	}
	return httpx.Created(c, fiber.Map{"imported": len(out), "items": out})
}

// ════════════════════════════════════════
// Food log
// ════════════════════════════════════════

// ListFoodLog: GET /api/food-log?clientId=…&date=YYYY-MM-DD — admin.
func (h *Handler) ListFoodLog(c *fiber.Ctx) error {
	cid, err := pgxutil.UUIDFromString(c.Query("clientId"))
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId is required")
	}
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "50"))
	params := FoodLogListParams{Page: page, PageSize: pageSize}
	if dateStr := c.Query("date"); dateStr != "" {
		d, perr := time.Parse("2006-01-02", dateStr)
		if perr != nil {
			return httpx.BadRequest("invalid_date", "date must be YYYY-MM-DD")
		}
		from := pgtype.Timestamptz{Time: d, Valid: true}
		to := pgtype.Timestamptz{Time: d.Add(24 * time.Hour), Valid: true}
		params.Since = &from
		params.Until = &to
	}
	out, err := h.svc.ListFoodLog(c.UserContext(), cid, params)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// SumFoodLog: GET /api/food-log/sum?clientId=…&date=YYYY-MM-DD — admin.
func (h *Handler) SumFoodLog(c *fiber.Ctx) error {
	cid, err := pgxutil.UUIDFromString(c.Query("clientId"))
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId is required")
	}
	dateStr := c.Query("date")
	if dateStr == "" {
		dateStr = time.Now().UTC().Format("2006-01-02")
	}
	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return httpx.BadRequest("invalid_date", "date must be YYYY-MM-DD")
	}
	from := pgtype.Timestamptz{Time: d, Valid: true}
	to := pgtype.Timestamptz{Time: d.Add(24 * time.Hour), Valid: true}
	out, err := h.svc.SumDay(c.UserContext(), cid, from, to)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}

// CreateFoodLog: POST /api/food-log — admin (clientId in body) only in Phase 3.
func (h *Handler) CreateFoodLog(c *fiber.Ctx) error {
	var body struct {
		FoodLogCreateRequest
		ClientID string `json:"clientId"`
	}
	if err := c.BodyParser(&body); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	cid, err := pgxutil.UUIDFromString(body.ClientID)
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId is required")
	}
	out, err := h.svc.CreateFoodLog(c.UserContext(), cid, body.FoodLogCreateRequest)
	if err != nil {
		return err
	}
	return httpx.Created(c, out)
}

// DeleteFoodLog: DELETE /api/food-log/:id?clientId=…
func (h *Handler) DeleteFoodLog(c *fiber.Ctx) error {
	id, err := pgxutil.UUIDFromString(c.Params("id"))
	if err != nil {
		return httpx.BadRequest("invalid_id", "id must be a UUID")
	}
	cid, err := pgxutil.UUIDFromString(c.Query("clientId"))
	if err != nil {
		return httpx.BadRequest("invalid_client_id", "clientId is required")
	}
	if err := h.svc.DeleteFoodLog(c.UserContext(), cid, id); err != nil {
		return err
	}
	return httpx.NoContent(c)
}

// ════════════════════════════════════════
// Macro calculator
// ════════════════════════════════════════

// CalcMacros: POST /api/macros/calc — admin tool to compute macro targets
// from a client's stats. Pure function; no DB writes.
func (h *Handler) CalcMacros(c *fiber.Ctx) error {
	var req MacroCalcRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest("invalid_body", "request body could not be parsed")
	}
	out, err := CalcMacros(req)
	if err != nil {
		return err
	}
	return httpx.OK(c, out)
}
