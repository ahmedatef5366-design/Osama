package workouts

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

// GetActivePlanFull returns the full graph for the currently-active plan
// of a client, or 404 if the client has no active plan.
func (s *Service) GetActivePlanFull(ctx context.Context, clientID pgtype.UUID) (PlanFull, error) {
	p, err := s.queries.GetActiveWorkoutPlanForClient(ctx, clientID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlanFull{}, httpx.NotFound("no_active_plan", "client has no active workout plan")
		}
		return PlanFull{}, httpx.Internal("plan_get_failed", err)
	}
	return s.GetPlanFull(ctx, p.ID)
}

// GetLatestLogForExercise returns the client's most recent set logged
// against a given exercise — used by the client portal to draw the
// "ghost placeholder" of the previous session.
func (s *Service) GetLatestLogForExercise(ctx context.Context, clientID, exerciseID pgtype.UUID) (LogEntry, error) {
	l, err := s.queries.GetLatestLogForExercise(ctx, db.GetLatestLogForExerciseParams{
		ClientID:   clientID,
		ExerciseID: exerciseID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LogEntry{}, httpx.NotFound("no_log", "no prior log for this exercise")
		}
		return LogEntry{}, httpx.Internal("log_lookup_failed", err)
	}
	return logFromDB(l), nil
}

// templateSnapshot is the shape persisted into plan_templates.plan_json so a
// template can be re-applied later. It is a flat copy of the plan/day/exercise
// tree; we deliberately do not include IDs or timestamps because they have to
// be regenerated on apply.
type templateSnapshot struct {
	Name string                `json:"name"`
	Days []templateSnapshotDay `json:"days"`
}

type templateSnapshotDay struct {
	DayNumber int32                      `json:"dayNumber"`
	DayName   string                     `json:"dayName"`
	DayNameAr *string                    `json:"dayNameAr,omitempty"`
	SortOrder int32                      `json:"sortOrder"`
	Exercises []templateSnapshotExercise `json:"exercises"`
}

type templateSnapshotExercise struct {
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

// SnapshotPlan reads the full plan/day/exercise tree and returns the JSON
// blob that's stored in plan_templates.plan_json. Used by "save as template".
func (s *Service) SnapshotPlan(ctx context.Context, planID pgtype.UUID) ([]byte, error) {
	full, err := s.GetPlanFull(ctx, planID)
	if err != nil {
		return nil, err
	}
	snap := templateSnapshot{Name: full.Name, Days: make([]templateSnapshotDay, 0, len(full.Days))}
	for _, d := range full.Days {
		td := templateSnapshotDay{
			DayNumber: d.DayNumber,
			DayName:   d.DayName,
			DayNameAr: d.DayNameAr,
			SortOrder: d.SortOrder,
			Exercises: make([]templateSnapshotExercise, 0, len(d.Exercises)),
		}
		for _, e := range d.Exercises {
			td.Exercises = append(td.Exercises, templateSnapshotExercise{
				LibraryID:      e.LibraryID,
				Name:           e.Name,
				Sets:           e.Sets,
				Reps:           e.Reps,
				RestSeconds:    e.RestSeconds,
				Notes:          e.Notes,
				CoachHighlight: e.CoachHighlight,
				VideoURL:       e.VideoURL,
				SortOrder:      e.SortOrder,
			})
		}
		snap.Days = append(snap.Days, td)
	}
	return json.Marshal(snap)
}

// ApplyTemplate clones the contents of a saved plan_template onto a new
// active workout plan for the given client. Runs inside a single
// transaction so a partial clone never lands in the DB.
func (s *Service) ApplyTemplate(ctx context.Context, templateID, clientID pgtype.UUID, makeActive bool) (Plan, error) {
	t, err := s.queries.GetPlanTemplate(ctx, templateID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Plan{}, httpx.NotFound("template_not_found", "template not found")
		}
		return Plan{}, httpx.Internal("template_get_failed", err)
	}
	var snap templateSnapshot
	if err := json.Unmarshal(t.PlanJson, &snap); err != nil {
		return Plan{}, httpx.Internal("template_parse_failed",
			fmt.Errorf("malformed template JSON: %w", err))
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Plan{}, httpx.Internal("tx_begin_failed", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	q := s.queries.WithTx(tx)

	planName := snap.Name
	if strings.TrimSpace(planName) == "" {
		planName = t.Name
	}

	plan, err := q.CreateWorkoutPlan(ctx, db.CreateWorkoutPlanParams{
		ClientID: clientID,
		Name:     planName,
		IsActive: makeActive,
	})
	if err != nil {
		return Plan{}, httpx.Internal("plan_create_failed", err)
	}
	if makeActive {
		if err := q.DeactivateOtherWorkoutPlans(ctx, db.DeactivateOtherWorkoutPlansParams{
			ClientID: clientID,
			ID:       plan.ID,
		}); err != nil {
			return Plan{}, httpx.Internal("deactivate_failed", err)
		}
	}
	for _, d := range snap.Days {
		day, err := q.CreateWorkoutDay(ctx, db.CreateWorkoutDayParams{
			PlanID:    plan.ID,
			DayNumber: d.DayNumber,
			DayName:   d.DayName,
			DayNameAr: d.DayNameAr,
			SortOrder: d.SortOrder,
		})
		if err != nil {
			return Plan{}, httpx.Internal("day_create_failed", err)
		}
		for _, e := range d.Exercises {
			var libID pgtype.UUID
			if e.LibraryID != nil && *e.LibraryID != "" {
				if u, perr := uuidFromMaybe(*e.LibraryID); perr == nil {
					libID = u
				}
			}
			if _, err := q.CreateExercise(ctx, db.CreateExerciseParams{
				DayID:          day.ID,
				LibraryID:      libID,
				Name:           e.Name,
				Sets:           e.Sets,
				Reps:           e.Reps,
				RestSeconds:    e.RestSeconds,
				Notes:          e.Notes,
				CoachHighlight: e.CoachHighlight,
				VideoUrl:       e.VideoURL,
				SortOrder:      e.SortOrder,
			}); err != nil {
				return Plan{}, httpx.Internal("exercise_create_failed", err)
			}
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return Plan{}, httpx.Internal("tx_commit_failed", err)
	}
	return planFromDB(plan), nil
}

func uuidFromMaybe(s string) (pgtype.UUID, error) {
	if s == "" {
		return pgtype.UUID{Valid: false}, nil
	}
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		return u, err
	}
	return u, nil
}
