// Package nutrition implements the admin/client nutrition CRUD: plans,
// per-meal food lists, the global food database, and per-client food
// intake logging. Macro auto-calculation lives here too — it is small
// enough not to deserve its own package.
package nutrition

import (
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// ════════════════════════════════════════
// Plans
// ════════════════════════════════════════

// Plan is the public envelope for a nutrition_plans row. Mode is "fixed"
// (meals are pre-set) or "flexible" (client logs food against the macro
// targets).
type Plan struct {
	ID             string    `json:"id"`
	ClientID       string    `json:"clientId"`
	Mode           string    `json:"mode"`
	CaloriesTarget *int32    `json:"caloriesTarget,omitempty"`
	ProteinG       *float64  `json:"proteinG,omitempty"`
	CarbsG         *float64  `json:"carbsG,omitempty"`
	FatG           *float64  `json:"fatG,omitempty"`
	IsActive       bool      `json:"isActive"`
	CreatedAt      time.Time `json:"createdAt"`
}

// PlanFull adds the meals array so the editor can render a plan in one shot.
type PlanFull struct {
	Plan
	Meals []Meal `json:"meals"`
}

// Meal is one named meal slot inside a plan.
type Meal struct {
	ID        string `json:"id"`
	PlanID    string `json:"planId"`
	MealType  string `json:"mealType"`
	SortOrder int32  `json:"sortOrder"`
	// FoodItems is a JSONB blob with the shape: [{ name, grams, kcal, ... }]
	// We keep it as json.RawMessage so the client controls the exact schema
	// — Phase 3 lets admins put any structure they like and the client
	// portal renders whatever shape it knows about.
	FoodItems json.RawMessage `json:"foodItems"`
}

func planFromDB(p db.NutritionPlan) Plan {
	out := Plan{
		ID:             pgxutil.UUIDToString(p.ID),
		ClientID:       pgxutil.UUIDToString(p.ClientID),
		Mode:           p.Mode,
		CaloriesTarget: p.CaloriesTarget,
		ProteinG:       pgxutil.NumericToFloat(p.ProteinG),
		CarbsG:         pgxutil.NumericToFloat(p.CarbsG),
		FatG:           pgxutil.NumericToFloat(p.FatG),
		IsActive:       p.IsActive,
	}
	if p.CreatedAt.Valid {
		out.CreatedAt = p.CreatedAt.Time
	}
	return out
}

func mealFromDB(m db.Meal) Meal {
	return Meal{
		ID:        pgxutil.UUIDToString(m.ID),
		PlanID:    pgxutil.UUIDToString(m.PlanID),
		MealType:  m.MealType,
		SortOrder: m.SortOrder,
		FoodItems: m.FoodItems,
	}
}

// PlanCreateRequest is the body for POST /api/clients/:id/nutrition-plan.
// ClientID is taken from the URL — the request struct mirrors it only so
// the same shape can flow through the service layer.
type PlanCreateRequest struct {
	ClientID       string   `json:"clientId"`
	Mode           string   `json:"mode"`
	CaloriesTarget *int32   `json:"caloriesTarget"`
	ProteinG       *float64 `json:"proteinG"`
	CarbsG         *float64 `json:"carbsG"`
	FatG           *float64 `json:"fatG"`
	IsActive       bool     `json:"isActive"`
}

// PlanUpdateRequest is a PATCH body for the plan envelope.
type PlanUpdateRequest struct {
	Mode           *string  `json:"mode"`
	CaloriesTarget *int32   `json:"caloriesTarget"`
	ProteinG       *float64 `json:"proteinG"`
	CarbsG         *float64 `json:"carbsG"`
	FatG           *float64 `json:"fatG"`
	IsActive       *bool    `json:"isActive"`
}

// MealCreateRequest creates a meal inside an existing plan.
type MealCreateRequest struct {
	MealType  string          `json:"mealType"`
	SortOrder int32           `json:"sortOrder"`
	FoodItems json.RawMessage `json:"foodItems"`
}

// MealUpdateRequest is a PATCH body.
type MealUpdateRequest struct {
	MealType  *string         `json:"mealType"`
	SortOrder *int32          `json:"sortOrder"`
	FoodItems json.RawMessage `json:"foodItems"`
}

// ════════════════════════════════════════
// Food database
// ════════════════════════════════════════

// Food is one row of the global food database. Macros are per-100g.
type Food struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	NameAr          *string   `json:"nameAr,omitempty"`
	Brand           *string   `json:"brand,omitempty"`
	Barcode         *string   `json:"barcode,omitempty"`
	CaloriesPer100g float64   `json:"caloriesPer100g"`
	ProteinPer100g  float64   `json:"proteinPer100g"`
	CarbsPer100g    float64   `json:"carbsPer100g"`
	FatPer100g      float64   `json:"fatPer100g"`
	IsVerified      bool      `json:"isVerified"`
	CreatedAt       time.Time `json:"createdAt"`
}

func numericOrZero(n pgtype.Numeric) float64 {
	f := pgxutil.NumericToFloat(n)
	if f == nil {
		return 0
	}
	return *f
}

// FoodCreateRequest creates a new food entry. Macros are per-100g.
type FoodCreateRequest struct {
	Name            string  `json:"name"`
	NameAr          *string `json:"nameAr"`
	Brand           *string `json:"brand"`
	Barcode         *string `json:"barcode"`
	CaloriesPer100g float64 `json:"caloriesPer100g"`
	ProteinPer100g  float64 `json:"proteinPer100g"`
	CarbsPer100g    float64 `json:"carbsPer100g"`
	FatPer100g      float64 `json:"fatPer100g"`
	IsVerified      *bool   `json:"isVerified"`
}

// FoodUpdateRequest is a PATCH body.
type FoodUpdateRequest struct {
	Name            *string  `json:"name"`
	NameAr          *string  `json:"nameAr"`
	Brand           *string  `json:"brand"`
	Barcode         *string  `json:"barcode"`
	CaloriesPer100g *float64 `json:"caloriesPer100g"`
	ProteinPer100g  *float64 `json:"proteinPer100g"`
	CarbsPer100g    *float64 `json:"carbsPer100g"`
	FatPer100g      *float64 `json:"fatPer100g"`
	IsVerified      *bool    `json:"isVerified"`
}

// FoodLog is a single intake entry by a client. Calculated macros are
// frozen at log time so the food_database row can be edited later without
// retroactively changing history.
type FoodLog struct {
	ID                 string    `json:"id"`
	ClientID           string    `json:"clientId"`
	FoodID             *string   `json:"foodId,omitempty"`
	LoggedAt           time.Time `json:"loggedAt"`
	MealType           *string   `json:"mealType,omitempty"`
	WeightGrams        float64   `json:"weightGrams"`
	CalculatedCalories float64   `json:"calculatedCalories"`
	CalculatedProtein  float64   `json:"calculatedProtein"`
	CalculatedCarbs    float64   `json:"calculatedCarbs"`
	CalculatedFat      float64   `json:"calculatedFat"`
	CustomFoodName     *string   `json:"customFoodName,omitempty"`
}

// FoodLogCreateRequest is the body for POST /api/food-log. Either FoodID
// is supplied (and macros are read from the food_database row) or
// CustomFoodName + per-100g macros are supplied for one-off entries.
type FoodLogCreateRequest struct {
	FoodID         *string    `json:"foodId"`
	LoggedAt       *time.Time `json:"loggedAt"`
	MealType       *string    `json:"mealType"`
	WeightGrams    float64    `json:"weightGrams"`
	CustomFoodName *string    `json:"customFoodName"`

	// Custom entries supply per-100g values directly. Ignored when FoodID set.
	CustomCaloriesPer100g *float64 `json:"customCaloriesPer100g"`
	CustomProteinPer100g  *float64 `json:"customProteinPer100g"`
	CustomCarbsPer100g    *float64 `json:"customCarbsPer100g"`
	CustomFatPer100g      *float64 `json:"customFatPer100g"`
}

// DayTotals aggregates a client's food log over a 24h window.
type DayTotals struct {
	Calories float64 `json:"calories"`
	Protein  float64 `json:"protein"`
	Carbs    float64 `json:"carbs"`
	Fat      float64 `json:"fat"`
}
