// Package workouts implements the admin-facing workout-planning CRUD and the
// client-facing workout-log endpoints. The data model is plan → days →
// exercises, with a global exercise_library that day-level exercises may
// reference for video/instruction content.
package workouts

import (
	"time"

	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// ════════════════════════════════════════
// Exercise library (global, reusable)
// ════════════════════════════════════════

// LibraryEntry is the public shape for the exercise_library table. Admins
// curate this list and day-level exercises can reference it via LibraryID
// to inherit video/instructions defaults.
type LibraryEntry struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	NameAr       *string   `json:"nameAr,omitempty"`
	MuscleGroup  string    `json:"muscleGroup"`
	Equipment    *string   `json:"equipment,omitempty"`
	Instructions *string   `json:"instructions,omitempty"`
	VideoURL     *string   `json:"videoUrl,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

func libraryFromDB(e db.ExerciseLibrary) LibraryEntry {
	out := LibraryEntry{
		ID:           pgxutil.UUIDToString(e.ID),
		Name:         e.Name,
		NameAr:       e.NameAr,
		MuscleGroup:  e.MuscleGroup,
		Equipment:    e.Equipment,
		Instructions: e.Instructions,
		VideoURL:     e.VideoUrl,
	}
	if e.CreatedAt.Valid {
		out.CreatedAt = e.CreatedAt.Time
	}
	return out
}

func libraryFromListRow(r db.ListExerciseLibraryRow) LibraryEntry {
	return libraryFromDB(db.ExerciseLibrary{
		ID: r.ID, Name: r.Name, NameAr: r.NameAr,
		MuscleGroup: r.MuscleGroup, Equipment: r.Equipment,
		Instructions: r.Instructions, VideoUrl: r.VideoUrl,
		CreatedAt: r.CreatedAt,
	})
}

func libraryFromGetRow(r db.GetExerciseLibraryEntryRow) LibraryEntry {
	return libraryFromDB(db.ExerciseLibrary{
		ID: r.ID, Name: r.Name, NameAr: r.NameAr,
		MuscleGroup: r.MuscleGroup, Equipment: r.Equipment,
		Instructions: r.Instructions, VideoUrl: r.VideoUrl,
		CreatedAt: r.CreatedAt,
	})
}

func libraryFromCreateRow(r db.CreateExerciseLibraryEntryRow) LibraryEntry {
	return libraryFromDB(db.ExerciseLibrary{
		ID: r.ID, Name: r.Name, NameAr: r.NameAr,
		MuscleGroup: r.MuscleGroup, Equipment: r.Equipment,
		Instructions: r.Instructions, VideoUrl: r.VideoUrl,
		CreatedAt: r.CreatedAt,
	})
}

func libraryFromUpdateRow(r db.UpdateExerciseLibraryEntryRow) LibraryEntry {
	return libraryFromDB(db.ExerciseLibrary{
		ID: r.ID, Name: r.Name, NameAr: r.NameAr,
		MuscleGroup: r.MuscleGroup, Equipment: r.Equipment,
		Instructions: r.Instructions, VideoUrl: r.VideoUrl,
		CreatedAt: r.CreatedAt,
	})
}

// LibraryCreateRequest creates a library entry. NameAr / Equipment /
// Instructions / VideoURL are optional.
type LibraryCreateRequest struct {
	Name         string  `json:"name"`
	NameAr       *string `json:"nameAr"`
	MuscleGroup  string  `json:"muscleGroup"`
	Equipment    *string `json:"equipment"`
	Instructions *string `json:"instructions"`
	VideoURL     *string `json:"videoUrl"`
}

// LibraryUpdateRequest is a PATCH body — every field optional.
type LibraryUpdateRequest struct {
	Name         *string `json:"name"`
	NameAr       *string `json:"nameAr"`
	MuscleGroup  *string `json:"muscleGroup"`
	Equipment    *string `json:"equipment"`
	Instructions *string `json:"instructions"`
	VideoURL     *string `json:"videoUrl"`
}

// ════════════════════════════════════════
// Workout plans / days / exercises
// ════════════════════════════════════════

// Plan is the top-level workout-plan envelope. The full graph (days +
// exercises) is returned by GetPlanFull; the bare row is fine for List.
type Plan struct {
	ID        string    `json:"id"`
	ClientID  string    `json:"clientId"`
	Name      string    `json:"name"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
}

// PlanFull is the editor-friendly aggregate returned by GetPlanFull: a plan
// with all of its days and each day's exercises pre-loaded.
type PlanFull struct {
	Plan
	Days []Day `json:"days"`
}

// Day is one workout day inside a plan (e.g. "Push A").
type Day struct {
	ID        string     `json:"id"`
	PlanID    string     `json:"planId"`
	DayNumber int32      `json:"dayNumber"`
	DayName   string     `json:"dayName"`
	DayNameAr *string    `json:"dayNameAr,omitempty"`
	SortOrder int32      `json:"sortOrder"`
	Exercises []Exercise `json:"exercises,omitempty"`
}

// Exercise is a single prescribed exercise in a day.
type Exercise struct {
	ID             string  `json:"id"`
	DayID          string  `json:"dayId"`
	LibraryID      *string `json:"libraryId,omitempty"`
	Name           string  `json:"name"`
	Sets           int32   `json:"sets"`
	Reps           string  `json:"reps"`
	RestSeconds    int32   `json:"restSeconds"`
	Notes          *string `json:"notes,omitempty"`
	CoachHighlight *string `json:"coachHighlight,omitempty"`
	VideoURL       *string `json:"videoUrl,omitempty"`
	SortOrder      int32   `json:"sortOrder"`
}

func planFromDB(p db.WorkoutPlan) Plan {
	out := Plan{
		ID:       pgxutil.UUIDToString(p.ID),
		ClientID: pgxutil.UUIDToString(p.ClientID),
		Name:     p.Name,
		IsActive: p.IsActive,
	}
	if p.CreatedAt.Valid {
		out.CreatedAt = p.CreatedAt.Time
	}
	return out
}

func dayFromDB(d db.WorkoutDay) Day {
	return Day{
		ID:        pgxutil.UUIDToString(d.ID),
		PlanID:    pgxutil.UUIDToString(d.PlanID),
		DayNumber: d.DayNumber,
		DayName:   d.DayName,
		DayNameAr: d.DayNameAr,
		SortOrder: d.SortOrder,
	}
}

func exerciseFromDB(e db.Exercise) Exercise {
	libID := pgxutil.UUIDToString(e.LibraryID)
	out := Exercise{
		ID:             pgxutil.UUIDToString(e.ID),
		DayID:          pgxutil.UUIDToString(e.DayID),
		Name:           e.Name,
		Sets:           e.Sets,
		Reps:           e.Reps,
		RestSeconds:    e.RestSeconds,
		Notes:          e.Notes,
		CoachHighlight: e.CoachHighlight,
		VideoURL:       e.VideoUrl,
		SortOrder:      e.SortOrder,
	}
	if libID != "" {
		out.LibraryID = &libID
	}
	return out
}

// PlanCreateRequest creates a new plan for a client. If IsActive=true, the
// service deactivates other plans for the same client inside the same tx.
type PlanCreateRequest struct {
	ClientID string `json:"clientId"`
	Name     string `json:"name"`
	IsActive bool   `json:"isActive"`
}

// PlanUpdateRequest is a PATCH body for the plan envelope only.
type PlanUpdateRequest struct {
	Name     *string `json:"name"`
	IsActive *bool   `json:"isActive"`
}

// DayCreateRequest creates a day inside an existing plan.
type DayCreateRequest struct {
	DayNumber int32   `json:"dayNumber"`
	DayName   string  `json:"dayName"`
	DayNameAr *string `json:"dayNameAr"`
	SortOrder int32   `json:"sortOrder"`
}

// DayUpdateRequest is a PATCH body.
type DayUpdateRequest struct {
	DayNumber *int32  `json:"dayNumber"`
	DayName   *string `json:"dayName"`
	DayNameAr *string `json:"dayNameAr"`
	SortOrder *int32  `json:"sortOrder"`
}

// ExerciseCreateRequest creates an exercise inside an existing day.
type ExerciseCreateRequest struct {
	LibraryID      *string `json:"libraryId"`
	Name           string  `json:"name"`
	Sets           int32   `json:"sets"`
	Reps           string  `json:"reps"`
	RestSeconds    int32   `json:"restSeconds"`
	Notes          *string `json:"notes"`
	CoachHighlight *string `json:"coachHighlight"`
	VideoURL       *string `json:"videoUrl"`
	SortOrder      int32   `json:"sortOrder"`
}

// ExerciseUpdateRequest is a PATCH body.
type ExerciseUpdateRequest struct {
	LibraryID      *string `json:"libraryId"`
	Name           *string `json:"name"`
	Sets           *int32  `json:"sets"`
	Reps           *string `json:"reps"`
	RestSeconds    *int32  `json:"restSeconds"`
	Notes          *string `json:"notes"`
	CoachHighlight *string `json:"coachHighlight"`
	VideoURL       *string `json:"videoUrl"`
	SortOrder      *int32  `json:"sortOrder"`
}

// ════════════════════════════════════════
// Plan templates
// ════════════════════════════════════════

// Template is a saved snapshot of a plan that can be cloned onto another
// client. The plan_json blob stores the full graph as JSONB.
type Template struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	CreatedBy   string    `json:"createdBy"`
	PlanJSON    []byte    `json:"planJson"`
	CreatedAt   time.Time `json:"createdAt"`
}

func templateFromDB(t db.PlanTemplate) Template {
	out := Template{
		ID:          pgxutil.UUIDToString(t.ID),
		Name:        t.Name,
		Description: t.Description,
		CreatedBy:   pgxutil.UUIDToString(t.CreatedBy),
		PlanJSON:    t.PlanJson,
	}
	if t.CreatedAt.Valid {
		out.CreatedAt = t.CreatedAt.Time
	}
	return out
}

// TemplateCreateRequest creates a template from arbitrary JSON.
type TemplateCreateRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	PlanJSON    []byte  `json:"planJson"`
}

// ════════════════════════════════════════
// Workout logs
// ════════════════════════════════════════

// LogEntry is a single set logged by a client during a workout.
type LogEntry struct {
	ID         string    `json:"id"`
	ClientID   string    `json:"clientId"`
	ExerciseID string    `json:"exerciseId"`
	LoggedAt   time.Time `json:"loggedAt"`
	SetNumber  int32     `json:"setNumber"`
	WeightKg   *float64  `json:"weightKg,omitempty"`
	RepsDone   *int32    `json:"repsDone,omitempty"`
	Completed  bool      `json:"completed"`
}

func logFromDB(l db.WorkoutLog) LogEntry {
	out := LogEntry{
		ID:         pgxutil.UUIDToString(l.ID),
		ClientID:   pgxutil.UUIDToString(l.ClientID),
		ExerciseID: pgxutil.UUIDToString(l.ExerciseID),
		SetNumber:  l.SetNumber,
		WeightKg:   pgxutil.NumericToFloat(l.WeightKg),
		RepsDone:   l.RepsDone,
		Completed:  l.Completed,
	}
	if l.LoggedAt.Valid {
		out.LoggedAt = l.LoggedAt.Time
	}
	return out
}

// LogCreateRequest creates a single log entry. LoggedAt is optional — when
// nil the DB defaults to NOW().
type LogCreateRequest struct {
	ExerciseID string     `json:"exerciseId"`
	LoggedAt   *time.Time `json:"loggedAt"`
	SetNumber  int32      `json:"setNumber"`
	WeightKg   *float64   `json:"weightKg"`
	RepsDone   *int32     `json:"repsDone"`
	Completed  bool       `json:"completed"`
}

// LogBulkRequest submits a complete session (many sets across many
// exercises) in one call. Each parallel slice MUST be the same length;
// the service validates this before issuing the SQL.
type LogBulkRequest struct {
	Sets []LogCreateRequest `json:"sets"`
}
