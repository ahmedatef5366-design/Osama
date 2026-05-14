package checkin

import "time"

type Checkin struct {
	ID              string    `json:"id"`
	ClientID        string    `json:"clientId"`
	CheckinDate     string    `json:"checkinDate"`
	WorkoutStatus   *string   `json:"workoutStatus,omitempty"`
	WorkoutSetsDone *int      `json:"workoutSetsDone,omitempty"`
	DietCompliance  *int      `json:"dietCompliance,omitempty"`
	CardioDone      *bool     `json:"cardioDone,omitempty"`
	CardioMinutes   *int      `json:"cardioMinutes,omitempty"`
	SleepQuality    *int      `json:"sleepQuality,omitempty"`
	SleepHours      *float64  `json:"sleepHours,omitempty"`
	WaterIntakeCups *int      `json:"waterIntakeCups,omitempty"`
	ClientNote      *string   `json:"clientNote,omitempty"`
	SubmittedAt     time.Time `json:"submittedAt"`
}

type SubmitCheckinRequest struct {
	CheckinDate     string   `json:"checkinDate"`
	WorkoutStatus   *string  `json:"workoutStatus,omitempty"`
	WorkoutSetsDone *int     `json:"workoutSetsDone,omitempty"`
	DietCompliance  *int     `json:"dietCompliance,omitempty"`
	CardioDone      *bool    `json:"cardioDone,omitempty"`
	CardioMinutes   *int     `json:"cardioMinutes,omitempty"`
	SleepQuality    *int     `json:"sleepQuality,omitempty"`
	SleepHours      *float64 `json:"sleepHours,omitempty"`
	WaterIntakeCups *int     `json:"waterIntakeCups,omitempty"`
	ClientNote      *string  `json:"clientNote,omitempty"`
}

type AtRiskClient struct {
	ID            string `json:"id"`
	UserID        string `json:"userId"`
	Name          string `json:"name"`
	IsActive      bool   `json:"isActive"`
	AvgCompliance int    `json:"avgCompliance"`
	CheckinCount  int    `json:"checkinCount"`
}

// Summary is what the client today-page reads to render its streak,
// weekly compliance, and "checked-in today" widgets. Single roundtrip
// keeps the page paint count down.
type Summary struct {
	CurrentStreak  int  `json:"currentStreak"`
	LongestStreak  int  `json:"longestStreak"`
	WeekCheckins   int  `json:"weekCheckins"`
	WeekCompliance int  `json:"weekCompliance"`
	WeekWaterCups  int  `json:"weekWaterCups"`
	WeekSleepHours int  `json:"weekSleepHours"`
	WeekCardioMins int  `json:"weekCardioMins"`
	CheckedInToday bool `json:"checkedInToday"`
}
