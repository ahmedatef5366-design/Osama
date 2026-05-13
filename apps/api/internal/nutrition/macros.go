package nutrition

import (
	"strings"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

// MacroCalcRequest is the body for POST /api/macros/calc. Sex is "male" or
// "female"; ActivityLevel is one of sedentary, lightly_active, moderately_active,
// very_active; Goal is one of fat_loss, maintenance, muscle_gain.
type MacroCalcRequest struct {
	WeightKg      float64 `json:"weightKg"`
	HeightCm      float64 `json:"heightCm"`
	AgeYears      int32   `json:"ageYears"`
	Sex           string  `json:"sex"`
	ActivityLevel string  `json:"activityLevel"`
	Goal          string  `json:"goal"`
	// ProteinPerKg overrides the default per-goal protein multiplier (in g/kg)
	// when supplied. Optional.
	ProteinPerKg *float64 `json:"proteinPerKg"`
	// FatPercent overrides the default 25% kcal-from-fat split. Optional.
	FatPercent *float64 `json:"fatPercent"`
}

// MacroCalcResponse echoes the inputs back plus the derived target.
type MacroCalcResponse struct {
	BMR              float64 `json:"bmr"`
	TDEE             float64 `json:"tdee"`
	CaloriesTarget   int32   `json:"caloriesTarget"`
	ProteinG         float64 `json:"proteinG"`
	CarbsG           float64 `json:"carbsG"`
	FatG             float64 `json:"fatG"`
	ActivityFactor   float64 `json:"activityFactor"`
	GoalAdjustment   float64 `json:"goalAdjustment"`
	ProteinPerKgUsed float64 `json:"proteinPerKgUsed"`
	FatPercentUsed   float64 `json:"fatPercentUsed"`
}

// activityMultiplier returns the standard TDEE multiplier for a string label.
func activityMultiplier(level string) float64 {
	switch strings.ToLower(level) {
	case "sedentary":
		return 1.2
	case "lightly_active", "light":
		return 1.375
	case "moderately_active", "moderate":
		return 1.55
	case "very_active", "active":
		return 1.725
	case "extra_active", "athlete":
		return 1.9
	default:
		return 0
	}
}

// goalDelta is the % adjustment applied to TDEE to derive calories_target.
// Fat loss = -20%, muscle gain = +10%, maintenance = 0%.
func goalDelta(goal string) (float64, bool) {
	switch strings.ToLower(goal) {
	case "fat_loss", "cut":
		return -0.20, true
	case "muscle_gain", "bulk":
		return 0.10, true
	case "maintenance", "maintain":
		return 0.0, true
	default:
		return 0, false
	}
}

// defaultProteinPerKg returns sensible defaults: 2.2 g/kg for fat_loss and
// muscle_gain, 1.8 g/kg for maintenance.
func defaultProteinPerKg(goal string) float64 {
	switch strings.ToLower(goal) {
	case "fat_loss", "muscle_gain":
		return 2.2
	default:
		return 1.8
	}
}

// CalcMacros runs the Mifflin-St Jeor formula and partitions kcal across
// macros. It returns an APIError when the inputs are invalid.
func CalcMacros(req MacroCalcRequest) (MacroCalcResponse, error) {
	if req.WeightKg <= 0 {
		return MacroCalcResponse{}, httpx.BadRequest("invalid_weight", "weightKg must be > 0")
	}
	if req.HeightCm <= 0 {
		return MacroCalcResponse{}, httpx.BadRequest("invalid_height", "heightCm must be > 0")
	}
	if req.AgeYears <= 0 {
		return MacroCalcResponse{}, httpx.BadRequest("invalid_age", "ageYears must be > 0")
	}
	sex := strings.ToLower(req.Sex)
	if sex != "male" && sex != "female" {
		return MacroCalcResponse{}, httpx.BadRequest("invalid_sex", "sex must be male or female")
	}
	af := activityMultiplier(req.ActivityLevel)
	if af == 0 {
		return MacroCalcResponse{}, httpx.BadRequest("invalid_activity",
			"activityLevel must be sedentary, lightly_active, moderately_active, very_active, or extra_active")
	}
	delta, ok := goalDelta(req.Goal)
	if !ok {
		return MacroCalcResponse{}, httpx.BadRequest("invalid_goal",
			"goal must be fat_loss, maintenance, or muscle_gain")
	}

	// Mifflin-St Jeor BMR
	base := 10*req.WeightKg + 6.25*req.HeightCm - 5*float64(req.AgeYears)
	var bmr float64
	if sex == "male" {
		bmr = base + 5
	} else {
		bmr = base - 161
	}

	tdee := bmr * af
	target := tdee * (1 + delta)
	if target < 1200 {
		target = 1200 // floor to keep things safe
	}

	proteinPerKg := defaultProteinPerKg(req.Goal)
	if req.ProteinPerKg != nil && *req.ProteinPerKg > 0 {
		proteinPerKg = *req.ProteinPerKg
	}
	fatFraction := 0.25
	if req.FatPercent != nil && *req.FatPercent > 0 {
		fatFraction = *req.FatPercent / 100
		if fatFraction > 0.6 {
			fatFraction = 0.6
		}
	}

	proteinG := proteinPerKg * req.WeightKg
	fatG := (target * fatFraction) / 9
	// Remaining kcal go to carbs.
	carbsKcal := target - (proteinG * 4) - (fatG * 9)
	if carbsKcal < 0 {
		carbsKcal = 0
	}
	carbsG := carbsKcal / 4

	return MacroCalcResponse{
		BMR:              round1(bmr),
		TDEE:             round1(tdee),
		CaloriesTarget:   int32(roundToNearest(target, 10)),
		ProteinG:         round1(proteinG),
		CarbsG:           round1(carbsG),
		FatG:             round1(fatG),
		ActivityFactor:   af,
		GoalAdjustment:   delta,
		ProteinPerKgUsed: proteinPerKg,
		FatPercentUsed:   fatFraction * 100,
	}, nil
}

func round1(f float64) float64 {
	// 1 decimal place
	if f >= 0 {
		return float64(int(f*10+0.5)) / 10
	}
	return float64(int(f*10-0.5)) / 10
}

func roundToNearest(v float64, step float64) float64 {
	if step <= 0 {
		return v
	}
	r := v / step
	if r >= 0 {
		return float64(int(r+0.5)) * step
	}
	return float64(int(r-0.5)) * step
}
