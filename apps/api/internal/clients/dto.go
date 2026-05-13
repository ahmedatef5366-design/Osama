package clients

import (
	"time"

	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// Client is the JSON shape we expose externally. Keep this stable; the
// internal db.Client may grow new fields without leaking them.
type Client struct {
	ID              string    `json:"id"`
	UserID          string    `json:"userId"`
	Name            string    `json:"name"`
	Age             *int32    `json:"age,omitempty"`
	HeightCm        *float64  `json:"heightCm,omitempty"`
	CurrentWeightKg *float64  `json:"currentWeightKg,omitempty"`
	Sex             *string   `json:"sex,omitempty"`
	ExperienceLevel *string   `json:"experienceLevel,omitempty"`
	Goal            *string   `json:"goal,omitempty"`
	ActivityLevel   *string   `json:"activityLevel,omitempty"`
	HealthNotes     *string   `json:"healthNotes,omitempty"`
	StartDate       *string   `json:"startDate,omitempty"`
	TargetDate      *string   `json:"targetDate,omitempty"`
	IsActive        bool      `json:"isActive"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

func fromDB(c db.Client) Client {
	out := Client{
		ID:              pgxutil.UUIDToString(c.ID),
		UserID:          pgxutil.UUIDToString(c.UserID),
		Name:            c.Name,
		Age:             c.Age,
		HeightCm:        pgxutil.NumericToFloat(c.HeightCm),
		CurrentWeightKg: pgxutil.NumericToFloat(c.CurrentWeightKg),
		Sex:             c.Sex,
		ExperienceLevel: c.ExperienceLevel,
		Goal:            c.Goal,
		ActivityLevel:   c.ActivityLevel,
		HealthNotes:     c.HealthNotes,
		IsActive:        c.IsActive,
	}
	if c.StartDate.Valid {
		s := c.StartDate.Time.Format("2006-01-02")
		out.StartDate = &s
	}
	if c.TargetDate.Valid {
		s := c.TargetDate.Time.Format("2006-01-02")
		out.TargetDate = &s
	}
	if c.CreatedAt.Valid {
		out.CreatedAt = c.CreatedAt.Time
	}
	if c.UpdatedAt.Valid {
		out.UpdatedAt = c.UpdatedAt.Time
	}
	return out
}

// CreateRequest is the body for POST /api/clients. The admin creates both
// the user account and the client profile in one shot.
type CreateRequest struct {
	Email           string   `json:"email"`
	Password        string   `json:"password"`
	Name            string   `json:"name"`
	Age             *int32   `json:"age"`
	HeightCm        *float64 `json:"heightCm"`
	CurrentWeightKg *float64 `json:"currentWeightKg"`
	Sex             *string  `json:"sex"`
	ExperienceLevel *string  `json:"experienceLevel"`
	Goal            *string  `json:"goal"`
	ActivityLevel   *string  `json:"activityLevel"`
	HealthNotes     *string  `json:"healthNotes"`
	StartDate       *string  `json:"startDate"` // YYYY-MM-DD
	TargetDate      *string  `json:"targetDate"`
}

// UpdateRequest is the body for PATCH /api/clients/:id. All fields optional.
type UpdateRequest struct {
	Name            *string  `json:"name"`
	Age             *int32   `json:"age"`
	HeightCm        *float64 `json:"heightCm"`
	CurrentWeightKg *float64 `json:"currentWeightKg"`
	Sex             *string  `json:"sex"`
	ExperienceLevel *string  `json:"experienceLevel"`
	Goal            *string  `json:"goal"`
	ActivityLevel   *string  `json:"activityLevel"`
	HealthNotes     *string  `json:"healthNotes"`
	StartDate       *string  `json:"startDate"`
	TargetDate      *string  `json:"targetDate"`
	IsActive        *bool    `json:"isActive"`
}
