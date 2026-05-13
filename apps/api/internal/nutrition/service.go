package nutrition

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// Service is the nutrition module's application layer. It exposes
// transactional flows for plan activation and aggregate reads for the
// admin dashboard.
type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewService(pool *pgxpool.Pool, queries *db.Queries) *Service {
	return &Service{pool: pool, queries: queries}
}

// ════════════════════════════════════════
// Plans
// ════════════════════════════════════════

// ListPlans returns every nutrition plan for a client (active first).
func (s *Service) ListPlans(ctx context.Context, clientID pgtype.UUID) ([]Plan, error) {
	rows, err := s.queries.ListNutritionPlansForClient(ctx, clientID)
	if err != nil {
		return nil, httpx.Internal("plans_list_failed", err)
	}
	out := make([]Plan, 0, len(rows))
	for _, r := range rows {
		out = append(out, planFromDB(r))
	}
	return out, nil
}

// GetPlanFull returns the plan + meals tree.
func (s *Service) GetPlanFull(ctx context.Context, planID pgtype.UUID) (PlanFull, error) {
	p, err := s.queries.GetNutritionPlan(ctx, planID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlanFull{}, httpx.NotFound("plan_not_found", "plan not found")
		}
		return PlanFull{}, httpx.Internal("plan_get_failed", err)
	}
	meals, err := s.queries.ListMealsForPlan(ctx, planID)
	if err != nil {
		return PlanFull{}, httpx.Internal("plan_meals_failed", err)
	}
	out := PlanFull{Plan: planFromDB(p), Meals: make([]Meal, 0, len(meals))}
	for _, m := range meals {
		out.Meals = append(out.Meals, mealFromDB(m))
	}
	return out, nil
}

// GetActivePlanFull returns the active plan's full graph, or 404.
func (s *Service) GetActivePlanFull(ctx context.Context, clientID pgtype.UUID) (PlanFull, error) {
	p, err := s.queries.GetActiveNutritionPlanForClient(ctx, clientID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlanFull{}, httpx.NotFound("no_active_plan", "client has no active nutrition plan")
		}
		return PlanFull{}, httpx.Internal("plan_get_failed", err)
	}
	return s.GetPlanFull(ctx, p.ID)
}

// CreatePlan inserts a plan; if IsActive deactivates other plans atomically.
func (s *Service) CreatePlan(ctx context.Context, req PlanCreateRequest) (Plan, error) {
	if req.Mode != "fixed" && req.Mode != "flexible" {
		return Plan{}, httpx.BadRequest("invalid_mode", "mode must be fixed or flexible")
	}
	cid, err := pgxutil.UUIDFromString(req.ClientID)
	if err != nil {
		return Plan{}, httpx.BadRequest("invalid_client_id", "clientId must be a UUID")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Plan{}, httpx.Internal("tx_begin_failed", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	q := s.queries.WithTx(tx)

	plan, err := q.CreateNutritionPlan(ctx, db.CreateNutritionPlanParams{
		ClientID:       cid,
		Mode:           req.Mode,
		CaloriesTarget: req.CaloriesTarget,
		ProteinG:       pgxutil.FloatToNumeric(req.ProteinG),
		CarbsG:         pgxutil.FloatToNumeric(req.CarbsG),
		FatG:           pgxutil.FloatToNumeric(req.FatG),
		IsActive:       req.IsActive,
	})
	if err != nil {
		return Plan{}, httpx.Internal("plan_create_failed", err)
	}
	if req.IsActive {
		if err := q.DeactivateOtherNutritionPlans(ctx, db.DeactivateOtherNutritionPlansParams{
			ClientID: cid,
			ID:       plan.ID,
		}); err != nil {
			return Plan{}, httpx.Internal("deactivate_failed", err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return Plan{}, httpx.Internal("tx_commit_failed", err)
	}
	return planFromDB(plan), nil
}

func (s *Service) UpdatePlan(ctx context.Context, id pgtype.UUID, req PlanUpdateRequest) (Plan, error) {
	if req.Mode != nil && *req.Mode != "fixed" && *req.Mode != "flexible" {
		return Plan{}, httpx.BadRequest("invalid_mode", "mode must be fixed or flexible")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Plan{}, httpx.Internal("tx_begin_failed", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	q := s.queries.WithTx(tx)

	updated, err := q.UpdateNutritionPlan(ctx, db.UpdateNutritionPlanParams{
		ID:             id,
		Mode:           req.Mode,
		CaloriesTarget: req.CaloriesTarget,
		ProteinG:       pgxutil.FloatToNumeric(req.ProteinG),
		CarbsG:         pgxutil.FloatToNumeric(req.CarbsG),
		FatG:           pgxutil.FloatToNumeric(req.FatG),
		IsActive:       req.IsActive,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Plan{}, httpx.NotFound("plan_not_found", "plan not found")
		}
		return Plan{}, httpx.Internal("plan_update_failed", err)
	}
	if req.IsActive != nil && *req.IsActive {
		if err := q.DeactivateOtherNutritionPlans(ctx, db.DeactivateOtherNutritionPlansParams{
			ClientID: updated.ClientID,
			ID:       updated.ID,
		}); err != nil {
			return Plan{}, httpx.Internal("deactivate_failed", err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return Plan{}, httpx.Internal("tx_commit_failed", err)
	}
	return planFromDB(updated), nil
}

func (s *Service) DeletePlan(ctx context.Context, id pgtype.UUID) error {
	if err := s.queries.DeleteNutritionPlan(ctx, id); err != nil {
		return httpx.Internal("plan_delete_failed", err)
	}
	return nil
}

// ════════════════════════════════════════
// Meals
// ════════════════════════════════════════

func (s *Service) CreateMeal(ctx context.Context, planID pgtype.UUID, req MealCreateRequest) (Meal, error) {
	if strings.TrimSpace(req.MealType) == "" {
		return Meal{}, httpx.BadRequest("invalid_meal_type", "mealType is required")
	}
	if len(req.FoodItems) == 0 {
		req.FoodItems = []byte("[]")
	}
	m, err := s.queries.CreateMeal(ctx, db.CreateMealParams{
		PlanID:    planID,
		MealType:  strings.TrimSpace(req.MealType),
		SortOrder: req.SortOrder,
		FoodItems: req.FoodItems,
	})
	if err != nil {
		return Meal{}, httpx.Internal("meal_create_failed", err)
	}
	return mealFromDB(m), nil
}

func (s *Service) UpdateMeal(ctx context.Context, id pgtype.UUID, req MealUpdateRequest) (Meal, error) {
	m, err := s.queries.UpdateMeal(ctx, db.UpdateMealParams{
		ID:        id,
		MealType:  req.MealType,
		SortOrder: req.SortOrder,
		FoodItems: req.FoodItems,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Meal{}, httpx.NotFound("meal_not_found", "meal not found")
		}
		return Meal{}, httpx.Internal("meal_update_failed", err)
	}
	return mealFromDB(m), nil
}

func (s *Service) DeleteMeal(ctx context.Context, id pgtype.UUID) error {
	if err := s.queries.DeleteMeal(ctx, id); err != nil {
		return httpx.Internal("meal_delete_failed", err)
	}
	return nil
}

// ════════════════════════════════════════
// Food database
// ════════════════════════════════════════

// FoodListParams controls pagination + filter on SearchFood.
type FoodListParams struct {
	Page     int
	PageSize int
	Search   string
}

func (s *Service) SearchFoods(ctx context.Context, p FoodListParams) ([]Food, int64, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PageSize <= 0 || p.PageSize > 200 {
		p.PageSize = 50
	}
	var search *string
	if s := strings.TrimSpace(p.Search); s != "" {
		search = &s
	}
	rows, err := s.queries.SearchFood(ctx, db.SearchFoodParams{
		Limit:  int32(p.PageSize),
		Offset: int32((p.Page - 1) * p.PageSize),
		Search: search,
	})
	if err != nil {
		return nil, 0, httpx.Internal("food_search_failed", err)
	}
	total, err := s.queries.CountFood(ctx, search)
	if err != nil {
		return nil, 0, httpx.Internal("food_count_failed", err)
	}
	out := make([]Food, 0, len(rows))
	for _, r := range rows {
		out = append(out, foodFromSearchRow(r))
	}
	return out, total, nil
}

func (s *Service) GetFood(ctx context.Context, id pgtype.UUID) (Food, error) {
	r, err := s.queries.GetFoodByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Food{}, httpx.NotFound("food_not_found", "food not found")
		}
		return Food{}, httpx.Internal("food_get_failed", err)
	}
	return foodFromGetIDRow(r), nil
}

func (s *Service) GetFoodByBarcode(ctx context.Context, barcode string) (Food, error) {
	r, err := s.queries.GetFoodByBarcode(ctx, &barcode)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Food{}, httpx.NotFound("food_not_found", "food not found for barcode")
		}
		return Food{}, httpx.Internal("food_get_failed", err)
	}
	return foodFromBarcodeRow(r), nil
}

func (s *Service) CreateFood(ctx context.Context, req FoodCreateRequest, createdBy pgtype.UUID) (Food, error) {
	if strings.TrimSpace(req.Name) == "" {
		return Food{}, httpx.BadRequest("invalid_name", "name is required")
	}
	verified := false
	if req.IsVerified != nil {
		verified = *req.IsVerified
	}
	r, err := s.queries.CreateFood(ctx, db.CreateFoodParams{
		Name:            strings.TrimSpace(req.Name),
		NameAr:          req.NameAr,
		Brand:           req.Brand,
		Barcode:         req.Barcode,
		CaloriesPer100g: pgxutil.FloatToNumeric(&req.CaloriesPer100g),
		ProteinPer100g:  pgxutil.FloatToNumeric(&req.ProteinPer100g),
		CarbsPer100g:    pgxutil.FloatToNumeric(&req.CarbsPer100g),
		FatPer100g:      pgxutil.FloatToNumeric(&req.FatPer100g),
		IsVerified:      verified,
		CreatedBy:       createdBy,
	})
	if err != nil {
		return Food{}, httpx.Internal("food_create_failed", err)
	}
	return foodFromCreateRow(r), nil
}

func (s *Service) UpdateFood(ctx context.Context, id pgtype.UUID, req FoodUpdateRequest) (Food, error) {
	r, err := s.queries.UpdateFood(ctx, db.UpdateFoodParams{
		ID:              id,
		Name:            req.Name,
		NameAr:          req.NameAr,
		Brand:           req.Brand,
		Barcode:         req.Barcode,
		CaloriesPer100g: pgxutil.FloatToNumeric(req.CaloriesPer100g),
		ProteinPer100g:  pgxutil.FloatToNumeric(req.ProteinPer100g),
		CarbsPer100g:    pgxutil.FloatToNumeric(req.CarbsPer100g),
		FatPer100g:      pgxutil.FloatToNumeric(req.FatPer100g),
		IsVerified:      req.IsVerified,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Food{}, httpx.NotFound("food_not_found", "food not found")
		}
		return Food{}, httpx.Internal("food_update_failed", err)
	}
	return foodFromUpdateRow(r), nil
}

func (s *Service) DeleteFood(ctx context.Context, id pgtype.UUID) error {
	if err := s.queries.DeleteFood(ctx, id); err != nil {
		return httpx.Internal("food_delete_failed", err)
	}
	return nil
}

// BulkCreateFoods inserts many food rows in a single transaction. Used by
// the CSV-import endpoint. Returns the inserted rows in input order.
func (s *Service) BulkCreateFoods(ctx context.Context, items []FoodCreateRequest, createdBy pgtype.UUID) ([]Food, error) {
	if len(items) == 0 {
		return []Food{}, nil
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, httpx.Internal("tx_begin_failed", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	q := s.queries.WithTx(tx)

	out := make([]Food, 0, len(items))
	for i, it := range items {
		if strings.TrimSpace(it.Name) == "" {
			return nil, httpx.BadRequest("invalid_row",
				"row "+itoa(i+1)+": name is required")
		}
		verified := false
		if it.IsVerified != nil {
			verified = *it.IsVerified
		}
		r, err := q.CreateFood(ctx, db.CreateFoodParams{
			Name:            strings.TrimSpace(it.Name),
			NameAr:          it.NameAr,
			Brand:           it.Brand,
			Barcode:         it.Barcode,
			CaloriesPer100g: pgxutil.FloatToNumeric(&it.CaloriesPer100g),
			ProteinPer100g:  pgxutil.FloatToNumeric(&it.ProteinPer100g),
			CarbsPer100g:    pgxutil.FloatToNumeric(&it.CarbsPer100g),
			FatPer100g:      pgxutil.FloatToNumeric(&it.FatPer100g),
			IsVerified:      verified,
			CreatedBy:       createdBy,
		})
		if err != nil {
			return nil, httpx.Internal("food_create_failed", err)
		}
		out = append(out, foodFromCreateRow(r))
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, httpx.Internal("tx_commit_failed", err)
	}
	return out, nil
}

// ════════════════════════════════════════
// Food log
// ════════════════════════════════════════

// FoodLogListParams paginates the food_log table for one client.
type FoodLogListParams struct {
	Page     int
	PageSize int
	Since    *pgtype.Timestamptz
	Until    *pgtype.Timestamptz
}

func (s *Service) ListFoodLog(ctx context.Context, clientID pgtype.UUID, p FoodLogListParams) ([]FoodLog, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PageSize <= 0 || p.PageSize > 200 {
		p.PageSize = 50
	}
	var since, until pgtype.Timestamptz
	if p.Since != nil {
		since = *p.Since
	}
	if p.Until != nil {
		until = *p.Until
	}
	rows, err := s.queries.ListFoodLogForClient(ctx, db.ListFoodLogForClientParams{
		ClientID:  clientID,
		Since:     since,
		Until:     until,
		RowLimit:  int32(p.PageSize),
		RowOffset: int32((p.Page - 1) * p.PageSize),
	})
	if err != nil {
		return nil, httpx.Internal("food_log_list_failed", err)
	}
	out := make([]FoodLog, 0, len(rows))
	for _, r := range rows {
		out = append(out, foodLogFromDB(r))
	}
	return out, nil
}

// SumDay returns the calorie/macro totals between two timestamps.
func (s *Service) SumDay(ctx context.Context, clientID pgtype.UUID, from, to pgtype.Timestamptz) (DayTotals, error) {
	r, err := s.queries.SumFoodLogForDay(ctx, db.SumFoodLogForDayParams{
		ClientID:   clientID,
		LoggedAt:   from,
		LoggedAt_2: to,
	})
	if err != nil {
		return DayTotals{}, httpx.Internal("food_log_sum_failed", err)
	}
	return DayTotals{
		Calories: numericOrZero(r.TotalCalories),
		Protein:  numericOrZero(r.TotalProtein),
		Carbs:    numericOrZero(r.TotalCarbs),
		Fat:      numericOrZero(r.TotalFat),
	}, nil
}

// CreateFoodLog stores a single food intake row. If FoodID is supplied,
// the per-100g macros are read from the food_database row and multiplied
// by the entry weight. Otherwise the request must include explicit
// per-100g values.
func (s *Service) CreateFoodLog(ctx context.Context, clientID pgtype.UUID, req FoodLogCreateRequest) (FoodLog, error) {
	if req.WeightGrams <= 0 {
		return FoodLog{}, httpx.BadRequest("invalid_weight", "weightGrams must be > 0")
	}
	var (
		foodID                      pgtype.UUID
		caloriesP, proteinP, carbsP float64
		fatP                        float64
		haveSource                  bool
	)
	if req.FoodID != nil && *req.FoodID != "" {
		u, err := pgxutil.UUIDFromString(*req.FoodID)
		if err != nil {
			return FoodLog{}, httpx.BadRequest("invalid_food_id", "foodId must be a UUID")
		}
		foodID = u
		f, err := s.GetFood(ctx, u)
		if err != nil {
			return FoodLog{}, err
		}
		caloriesP = f.CaloriesPer100g
		proteinP = f.ProteinPer100g
		carbsP = f.CarbsPer100g
		fatP = f.FatPer100g
		haveSource = true
	} else if req.CustomCaloriesPer100g != nil {
		caloriesP = *req.CustomCaloriesPer100g
		if req.CustomProteinPer100g != nil {
			proteinP = *req.CustomProteinPer100g
		}
		if req.CustomCarbsPer100g != nil {
			carbsP = *req.CustomCarbsPer100g
		}
		if req.CustomFatPer100g != nil {
			fatP = *req.CustomFatPer100g
		}
		haveSource = true
	}
	if !haveSource {
		return FoodLog{}, httpx.BadRequest("missing_source",
			"either foodId or customCaloriesPer100g must be provided")
	}

	scale := req.WeightGrams / 100.0
	cal := caloriesP * scale
	prot := proteinP * scale
	carb := carbsP * scale
	fat := fatP * scale

	var ts any
	if req.LoggedAt != nil {
		ts = pgtype.Timestamptz{Time: *req.LoggedAt, Valid: true}
	}

	l, err := s.queries.CreateFoodLog(ctx, db.CreateFoodLogParams{
		ClientID:           clientID,
		FoodID:             foodID,
		Column3:            ts,
		MealType:           req.MealType,
		WeightGrams:        pgxutil.FloatToNumeric(&req.WeightGrams),
		CalculatedCalories: pgxutil.FloatToNumeric(&cal),
		CalculatedProtein:  pgxutil.FloatToNumeric(&prot),
		CalculatedCarbs:    pgxutil.FloatToNumeric(&carb),
		CalculatedFat:      pgxutil.FloatToNumeric(&fat),
		CustomFoodName:     req.CustomFoodName,
	})
	if err != nil {
		return FoodLog{}, httpx.Internal("food_log_create_failed", err)
	}
	return foodLogFromDB(l), nil
}

func (s *Service) DeleteFoodLog(ctx context.Context, clientID, id pgtype.UUID) error {
	if err := s.queries.DeleteFoodLog(ctx, db.DeleteFoodLogParams{
		ID:       id,
		ClientID: clientID,
	}); err != nil {
		return httpx.Internal("food_log_delete_failed", err)
	}
	return nil
}

// ════════════════════════════════════════
// Row conversions
// ════════════════════════════════════════

func foodFromSearchRow(r db.SearchFoodRow) Food {
	return foodFromFields(r.ID, r.Name, r.NameAr, r.Brand, r.Barcode,
		r.CaloriesPer100g, r.ProteinPer100g, r.CarbsPer100g, r.FatPer100g,
		r.IsVerified, r.CreatedAt)
}

func foodFromGetIDRow(r db.GetFoodByIDRow) Food {
	return foodFromFields(r.ID, r.Name, r.NameAr, r.Brand, r.Barcode,
		r.CaloriesPer100g, r.ProteinPer100g, r.CarbsPer100g, r.FatPer100g,
		r.IsVerified, r.CreatedAt)
}

func foodFromBarcodeRow(r db.GetFoodByBarcodeRow) Food {
	return foodFromFields(r.ID, r.Name, r.NameAr, r.Brand, r.Barcode,
		r.CaloriesPer100g, r.ProteinPer100g, r.CarbsPer100g, r.FatPer100g,
		r.IsVerified, r.CreatedAt)
}

func foodFromCreateRow(r db.CreateFoodRow) Food {
	return foodFromFields(r.ID, r.Name, r.NameAr, r.Brand, r.Barcode,
		r.CaloriesPer100g, r.ProteinPer100g, r.CarbsPer100g, r.FatPer100g,
		r.IsVerified, r.CreatedAt)
}

func foodFromUpdateRow(r db.UpdateFoodRow) Food {
	return foodFromFields(r.ID, r.Name, r.NameAr, r.Brand, r.Barcode,
		r.CaloriesPer100g, r.ProteinPer100g, r.CarbsPer100g, r.FatPer100g,
		r.IsVerified, r.CreatedAt)
}

func foodFromFields(
	id pgtype.UUID, name string, nameAr, brand, barcode *string,
	cals, prot, carbs, fat pgtype.Numeric,
	verified bool, createdAt pgtype.Timestamptz,
) Food {
	out := Food{
		ID:              pgxutil.UUIDToString(id),
		Name:            name,
		NameAr:          nameAr,
		Brand:           brand,
		Barcode:         barcode,
		CaloriesPer100g: numericOrZero(cals),
		ProteinPer100g:  numericOrZero(prot),
		CarbsPer100g:    numericOrZero(carbs),
		FatPer100g:      numericOrZero(fat),
		IsVerified:      verified,
	}
	if createdAt.Valid {
		out.CreatedAt = createdAt.Time
	}
	return out
}

func foodLogFromDB(l db.FoodLog) FoodLog {
	out := FoodLog{
		ID:                 pgxutil.UUIDToString(l.ID),
		ClientID:           pgxutil.UUIDToString(l.ClientID),
		MealType:           l.MealType,
		WeightGrams:        numericOrZero(l.WeightGrams),
		CalculatedCalories: numericOrZero(l.CalculatedCalories),
		CalculatedProtein:  numericOrZero(l.CalculatedProtein),
		CalculatedCarbs:    numericOrZero(l.CalculatedCarbs),
		CalculatedFat:      numericOrZero(l.CalculatedFat),
		CustomFoodName:     l.CustomFoodName,
	}
	if l.FoodID.Valid {
		s := pgxutil.UUIDToString(l.FoodID)
		out.FoodID = &s
	}
	if l.LoggedAt.Valid {
		out.LoggedAt = l.LoggedAt.Time
	}
	return out
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}
