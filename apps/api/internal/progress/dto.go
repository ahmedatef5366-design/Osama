package progress

import "time"

// ── Weight ─────────────────────────────────────────────────────

type WeightEntry struct {
	ClientID string    `json:"clientId"`
	LoggedAt time.Time `json:"loggedAt"`
	WeightKg float64   `json:"weightKg"`
	Notes    *string   `json:"notes,omitempty"`
}

type LogWeightRequest struct {
	WeightKg float64 `json:"weightKg"`
	Notes    *string `json:"notes,omitempty"`
}

// ── Body measurements ──────────────────────────────────────────

type Measurement struct {
	ClientID       string    `json:"clientId"`
	MeasuredAt     time.Time `json:"measuredAt"`
	WeightKg       *float64  `json:"weightKg,omitempty"`
	WaistCm        *float64  `json:"waistCm,omitempty"`
	ChestCm        *float64  `json:"chestCm,omitempty"`
	ShouldersCm    *float64  `json:"shouldersCm,omitempty"`
	HipsCm         *float64  `json:"hipsCm,omitempty"`
	LeftArmCm      *float64  `json:"leftArmCm,omitempty"`
	RightArmCm     *float64  `json:"rightArmCm,omitempty"`
	LeftThighCm    *float64  `json:"leftThighCm,omitempty"`
	RightThighCm   *float64  `json:"rightThighCm,omitempty"`
	BodyFatPercent *float64  `json:"bodyFatPercent,omitempty"`
	Notes          *string   `json:"notes,omitempty"`
}

type LogMeasurementRequest struct {
	WeightKg       *float64 `json:"weightKg,omitempty"`
	WaistCm        *float64 `json:"waistCm,omitempty"`
	ChestCm        *float64 `json:"chestCm,omitempty"`
	ShouldersCm    *float64 `json:"shouldersCm,omitempty"`
	HipsCm         *float64 `json:"hipsCm,omitempty"`
	LeftArmCm      *float64 `json:"leftArmCm,omitempty"`
	RightArmCm     *float64 `json:"rightArmCm,omitempty"`
	LeftThighCm    *float64 `json:"leftThighCm,omitempty"`
	RightThighCm   *float64 `json:"rightThighCm,omitempty"`
	BodyFatPercent *float64 `json:"bodyFatPercent,omitempty"`
	Notes          *string  `json:"notes,omitempty"`
}

// ── Photos ─────────────────────────────────────────────────────

type Photo struct {
	ID            string    `json:"id"`
	ClientID      string    `json:"clientId"`
	PhotoURL      string    `json:"photoUrl"`
	PublicID      string    `json:"publicId"`
	TakenAt       string    `json:"takenAt"`
	Pose          *string   `json:"pose,omitempty"`
	Note          *string   `json:"note,omitempty"`
	ShowOnLanding bool      `json:"showOnLanding"`
	CreatedAt     time.Time `json:"createdAt"`
}

type UploadPhotoRequest struct {
	PhotoURL      string  `json:"photoUrl"`
	PublicID      string  `json:"publicId"`
	TakenAt       string  `json:"takenAt"`
	Pose          *string `json:"pose,omitempty"`
	Note          *string `json:"note,omitempty"`
	ShowOnLanding bool    `json:"showOnLanding"`
}
