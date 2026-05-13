package nutrition

import (
	"math"
	"testing"
)

func TestCalcMacros_MaleFatLoss(t *testing.T) {
	t.Parallel()
	got, err := CalcMacros(MacroCalcRequest{
		WeightKg:      80,
		HeightCm:      180,
		AgeYears:      28,
		Sex:           "male",
		ActivityLevel: "moderately_active",
		Goal:          "fat_loss",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Mifflin-St Jeor for 80kg, 180cm, 28y, male:
	//   10*80 + 6.25*180 - 5*28 + 5 = 800 + 1125 - 140 + 5 = 1790
	if got.BMR != 1790 {
		t.Errorf("BMR = %v, want 1790", got.BMR)
	}
	// TDEE = 1790 * 1.55 = 2774.5
	if math.Abs(got.TDEE-2774.5) > 0.01 {
		t.Errorf("TDEE = %v, want 2774.5", got.TDEE)
	}
	// fat_loss -20% → 2219.6, rounded to nearest 10 → 2220
	if got.CaloriesTarget != 2220 {
		t.Errorf("CaloriesTarget = %v, want 2220", got.CaloriesTarget)
	}
	// 2.2 g/kg * 80 = 176 g protein
	if math.Abs(got.ProteinG-176) > 0.01 {
		t.Errorf("ProteinG = %v, want 176", got.ProteinG)
	}
	if got.ActivityFactor != 1.55 {
		t.Errorf("ActivityFactor = %v, want 1.55", got.ActivityFactor)
	}
}

func TestCalcMacros_FemaleMuscleGain(t *testing.T) {
	t.Parallel()
	got, err := CalcMacros(MacroCalcRequest{
		WeightKg:      60,
		HeightCm:      165,
		AgeYears:      24,
		Sex:           "female",
		ActivityLevel: "very_active",
		Goal:          "muscle_gain",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// 10*60 + 6.25*165 - 5*24 - 161 = 600 + 1031.25 - 120 - 161 = 1350.25
	if math.Abs(got.BMR-1350.3) > 0.1 {
		t.Errorf("BMR = %v, want ~1350.3", got.BMR)
	}
	if got.GoalAdjustment != 0.10 {
		t.Errorf("GoalAdjustment = %v, want 0.10", got.GoalAdjustment)
	}
	if math.Abs(got.ProteinG-132) > 0.01 {
		t.Errorf("ProteinG = %v, want 132 (2.2 g/kg)", got.ProteinG)
	}
}

func TestCalcMacros_Maintenance(t *testing.T) {
	t.Parallel()
	got, err := CalcMacros(MacroCalcRequest{
		WeightKg:      70,
		HeightCm:      175,
		AgeYears:      30,
		Sex:           "male",
		ActivityLevel: "sedentary",
		Goal:          "maintenance",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.GoalAdjustment != 0 {
		t.Errorf("GoalAdjustment = %v, want 0", got.GoalAdjustment)
	}
	if math.Abs(got.ProteinG-126) > 0.01 {
		t.Errorf("ProteinG = %v, want 126 (1.8 g/kg)", got.ProteinG)
	}
}

func TestCalcMacros_InvalidInputs(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name string
		req  MacroCalcRequest
	}{
		{"zero_weight", MacroCalcRequest{WeightKg: 0, HeightCm: 180, AgeYears: 28, Sex: "male", ActivityLevel: "sedentary", Goal: "maintenance"}},
		{"neg_height", MacroCalcRequest{WeightKg: 80, HeightCm: -1, AgeYears: 28, Sex: "male", ActivityLevel: "sedentary", Goal: "maintenance"}},
		{"zero_age", MacroCalcRequest{WeightKg: 80, HeightCm: 180, AgeYears: 0, Sex: "male", ActivityLevel: "sedentary", Goal: "maintenance"}},
		{"bad_sex", MacroCalcRequest{WeightKg: 80, HeightCm: 180, AgeYears: 28, Sex: "other", ActivityLevel: "sedentary", Goal: "maintenance"}},
		{"bad_activity", MacroCalcRequest{WeightKg: 80, HeightCm: 180, AgeYears: 28, Sex: "male", ActivityLevel: "couch_potato", Goal: "maintenance"}},
		{"bad_goal", MacroCalcRequest{WeightKg: 80, HeightCm: 180, AgeYears: 28, Sex: "male", ActivityLevel: "sedentary", Goal: "world_domination"}},
	}
	for _, c := range cases {
		c := c
		t.Run(c.name, func(t *testing.T) {
			t.Parallel()
			if _, err := CalcMacros(c.req); err == nil {
				t.Errorf("expected error for %s", c.name)
			}
		})
	}
}

func TestCalcMacros_HonorsOverrides(t *testing.T) {
	t.Parallel()
	ppk := 3.0
	fatPct := 30.0
	got, err := CalcMacros(MacroCalcRequest{
		WeightKg:      80,
		HeightCm:      180,
		AgeYears:      28,
		Sex:           "male",
		ActivityLevel: "moderately_active",
		Goal:          "maintenance",
		ProteinPerKg:  &ppk,
		FatPercent:    &fatPct,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ProteinPerKgUsed != 3.0 {
		t.Errorf("ProteinPerKgUsed = %v, want 3.0", got.ProteinPerKgUsed)
	}
	if got.FatPercentUsed != 30 {
		t.Errorf("FatPercentUsed = %v, want 30", got.FatPercentUsed)
	}
	if math.Abs(got.ProteinG-240) > 0.01 {
		t.Errorf("ProteinG = %v, want 240 (3 g/kg)", got.ProteinG)
	}
}

func TestActivityMultiplier(t *testing.T) {
	t.Parallel()
	cases := map[string]float64{
		"sedentary":         1.2,
		"lightly_active":    1.375,
		"light":             1.375,
		"moderately_active": 1.55,
		"moderate":          1.55,
		"very_active":       1.725,
		"active":            1.725,
		"extra_active":      1.9,
		"athlete":           1.9,
		"bogus":             0,
	}
	for k, want := range cases {
		if got := activityMultiplier(k); got != want {
			t.Errorf("activityMultiplier(%q) = %v, want %v", k, got, want)
		}
	}
}
