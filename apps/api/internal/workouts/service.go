package workouts

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

// Service holds the connection pool + the generated queries. The pool is
// kept separately so we can open explicit transactions for the create-plan
// flow that needs to enforce "one active plan per client" atomically.
type Service struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewService(pool *pgxpool.Pool, queries *db.Queries) *Service {
	return &Service{pool: pool, queries: queries}
}

// ════════════════════════════════════════
// Exercise library
// ════════════════════════════════════════

// LibraryListParams controls pagination + filters for ListLibrary.
type LibraryListParams struct {
	Page        int
	PageSize    int
	Search      string
	MuscleGroup string
}

func (s *Service) ListLibrary(ctx context.Context, p LibraryListParams) ([]LibraryEntry, int64, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PageSize <= 0 || p.PageSize > 200 {
		p.PageSize = 50
	}
	var search, mg *string
	if p.Search = strings.TrimSpace(p.Search); p.Search != "" {
		search = &p.Search
	}
	if p.MuscleGroup = strings.TrimSpace(p.MuscleGroup); p.MuscleGroup != "" {
		mg = &p.MuscleGroup
	}

	rows, err := s.queries.ListExerciseLibrary(ctx, db.ListExerciseLibraryParams{
		Limit:       int32(p.PageSize),
		Offset:      int32((p.Page - 1) * p.PageSize),
		MuscleGroup: mg,
		Search:      search,
	})
	if err != nil {
		return nil, 0, httpx.Internal("library_list_failed", err)
	}
	total, err := s.queries.CountExerciseLibrary(ctx, db.CountExerciseLibraryParams{
		MuscleGroup: mg,
		Search:      search,
	})
	if err != nil {
		return nil, 0, httpx.Internal("library_count_failed", err)
	}
	out := make([]LibraryEntry, 0, len(rows))
	for _, r := range rows {
		out = append(out, libraryFromListRow(r))
	}
	return out, total, nil
}

func (s *Service) GetLibrary(ctx context.Context, id pgtype.UUID) (LibraryEntry, error) {
	r, err := s.queries.GetExerciseLibraryEntry(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LibraryEntry{}, httpx.NotFound("exercise_not_found", "library entry not found")
		}
		return LibraryEntry{}, httpx.Internal("library_get_failed", err)
	}
	return libraryFromGetRow(r), nil
}

func (s *Service) CreateLibrary(ctx context.Context, req LibraryCreateRequest, createdBy pgtype.UUID) (LibraryEntry, error) {
	if strings.TrimSpace(req.Name) == "" {
		return LibraryEntry{}, httpx.BadRequest("invalid_name", "name is required")
	}
	if strings.TrimSpace(req.MuscleGroup) == "" {
		return LibraryEntry{}, httpx.BadRequest("invalid_muscle_group", "muscleGroup is required")
	}
	r, err := s.queries.CreateExerciseLibraryEntry(ctx, db.CreateExerciseLibraryEntryParams{
		Name:         strings.TrimSpace(req.Name),
		NameAr:       req.NameAr,
		MuscleGroup:  strings.TrimSpace(req.MuscleGroup),
		Equipment:    req.Equipment,
		Instructions: req.Instructions,
		VideoUrl:     req.VideoURL,
		CreatedBy:    createdBy,
	})
	if err != nil {
		return LibraryEntry{}, httpx.Internal("library_create_failed", err)
	}
	return libraryFromCreateRow(r), nil
}

func (s *Service) UpdateLibrary(ctx context.Context, id pgtype.UUID, req LibraryUpdateRequest) (LibraryEntry, error) {
	r, err := s.queries.UpdateExerciseLibraryEntry(ctx, db.UpdateExerciseLibraryEntryParams{
		ID:           id,
		Name:         req.Name,
		NameAr:       req.NameAr,
		MuscleGroup:  req.MuscleGroup,
		Equipment:    req.Equipment,
		Instructions: req.Instructions,
		VideoUrl:     req.VideoURL,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LibraryEntry{}, httpx.NotFound("exercise_not_found", "library entry not found")
		}
		return LibraryEntry{}, httpx.Internal("library_update_failed", err)
	}
	return libraryFromUpdateRow(r), nil
}

func (s *Service) DeleteLibrary(ctx context.Context, id pgtype.UUID) error {
	if err := s.queries.DeleteExerciseLibraryEntry(ctx, id); err != nil {
		return httpx.Internal("library_delete_failed", err)
	}
	return nil
}

// ════════════════════════════════════════
// Workout plans / days / exercises
// ════════════════════════════════════════

func (s *Service) ListPlans(ctx context.Context, clientID pgtype.UUID) ([]Plan, error) {
	rows, err := s.queries.ListWorkoutPlansForClient(ctx, clientID)
	if err != nil {
		return nil, httpx.Internal("plans_list_failed", err)
	}
	out := make([]Plan, 0, len(rows))
	for _, r := range rows {
		out = append(out, planFromDB(r))
	}
	return out, nil
}

// GetPlanFull returns the plan envelope plus the full ordered tree of days
// and the exercises belonging to each day. The fetches are sequential
// (plan → days → exercises-for-plan); the exercises query joins through
// workout_days so we don't issue N+1 queries per day.
func (s *Service) GetPlanFull(ctx context.Context, planID pgtype.UUID) (PlanFull, error) {
	p, err := s.queries.GetWorkoutPlan(ctx, planID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlanFull{}, httpx.NotFound("plan_not_found", "plan not found")
		}
		return PlanFull{}, httpx.Internal("plan_get_failed", err)
	}
	days, err := s.queries.ListWorkoutDaysForPlan(ctx, planID)
	if err != nil {
		return PlanFull{}, httpx.Internal("plan_days_failed", err)
	}
	exrs, err := s.queries.ListExercisesForPlan(ctx, planID)
	if err != nil {
		return PlanFull{}, httpx.Internal("plan_exercises_failed", err)
	}

	// bucket exercises by day_id once so we can hand each day its slice
	// without an O(D*E) scan.
	byDay := make(map[string][]Exercise, len(days))
	for _, e := range exrs {
		ex := exerciseFromDB(e)
		byDay[ex.DayID] = append(byDay[ex.DayID], ex)
	}

	out := PlanFull{Plan: planFromDB(p), Days: make([]Day, 0, len(days))}
	for _, d := range days {
		day := dayFromDB(d)
		day.Exercises = byDay[day.ID]
		out.Days = append(out.Days, day)
	}
	return out, nil
}

// CreatePlan inserts a plan. If req.IsActive is true, the service first
// deactivates every other plan for the client inside the same transaction
// so the partial-unique index never sees two active rows at once.
func (s *Service) CreatePlan(ctx context.Context, req PlanCreateRequest) (Plan, error) {
	if strings.TrimSpace(req.Name) == "" {
		return Plan{}, httpx.BadRequest("invalid_name", "name is required")
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

	plan, err := q.CreateWorkoutPlan(ctx, db.CreateWorkoutPlanParams{
		ClientID: cid,
		Name:     strings.TrimSpace(req.Name),
		IsActive: req.IsActive,
	})
	if err != nil {
		return Plan{}, httpx.Internal("plan_create_failed", err)
	}
	if req.IsActive {
		if err := q.DeactivateOtherWorkoutPlans(ctx, db.DeactivateOtherWorkoutPlansParams{
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

// UpdatePlan PATCHes a plan. If is_active flips to true, we likewise
// deactivate other plans for that client inside one tx.
func (s *Service) UpdatePlan(ctx context.Context, planID pgtype.UUID, req PlanUpdateRequest) (Plan, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Plan{}, httpx.Internal("tx_begin_failed", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	q := s.queries.WithTx(tx)

	updated, err := q.UpdateWorkoutPlan(ctx, db.UpdateWorkoutPlanParams{
		ID:       planID,
		Name:     req.Name,
		IsActive: req.IsActive,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Plan{}, httpx.NotFound("plan_not_found", "plan not found")
		}
		return Plan{}, httpx.Internal("plan_update_failed", err)
	}
	if req.IsActive != nil && *req.IsActive {
		if err := q.DeactivateOtherWorkoutPlans(ctx, db.DeactivateOtherWorkoutPlansParams{
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

func (s *Service) DeletePlan(ctx context.Context, planID pgtype.UUID) error {
	if err := s.queries.DeleteWorkoutPlan(ctx, planID); err != nil {
		return httpx.Internal("plan_delete_failed", err)
	}
	return nil
}

// Days

func (s *Service) CreateDay(ctx context.Context, planID pgtype.UUID, req DayCreateRequest) (Day, error) {
	if strings.TrimSpace(req.DayName) == "" {
		return Day{}, httpx.BadRequest("invalid_day_name", "dayName is required")
	}
	if req.DayNumber < 1 {
		return Day{}, httpx.BadRequest("invalid_day_number", "dayNumber must be >= 1")
	}
	d, err := s.queries.CreateWorkoutDay(ctx, db.CreateWorkoutDayParams{
		PlanID:    planID,
		DayNumber: req.DayNumber,
		DayName:   strings.TrimSpace(req.DayName),
		DayNameAr: req.DayNameAr,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		return Day{}, httpx.Internal("day_create_failed", err)
	}
	return dayFromDB(d), nil
}

func (s *Service) UpdateDay(ctx context.Context, dayID pgtype.UUID, req DayUpdateRequest) (Day, error) {
	d, err := s.queries.UpdateWorkoutDay(ctx, db.UpdateWorkoutDayParams{
		ID:        dayID,
		DayNumber: req.DayNumber,
		DayName:   req.DayName,
		DayNameAr: req.DayNameAr,
		SortOrder: req.SortOrder,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Day{}, httpx.NotFound("day_not_found", "day not found")
		}
		return Day{}, httpx.Internal("day_update_failed", err)
	}
	return dayFromDB(d), nil
}

func (s *Service) DeleteDay(ctx context.Context, dayID pgtype.UUID) error {
	if err := s.queries.DeleteWorkoutDay(ctx, dayID); err != nil {
		return httpx.Internal("day_delete_failed", err)
	}
	return nil
}

// Exercises (within a day)

func (s *Service) CreateExercise(ctx context.Context, dayID pgtype.UUID, req ExerciseCreateRequest) (Exercise, error) {
	if strings.TrimSpace(req.Name) == "" {
		return Exercise{}, httpx.BadRequest("invalid_name", "name is required")
	}
	if req.Sets < 1 {
		return Exercise{}, httpx.BadRequest("invalid_sets", "sets must be >= 1")
	}
	if strings.TrimSpace(req.Reps) == "" {
		return Exercise{}, httpx.BadRequest("invalid_reps", "reps is required")
	}
	if req.RestSeconds < 0 {
		return Exercise{}, httpx.BadRequest("invalid_rest", "restSeconds must be >= 0")
	}

	var libID pgtype.UUID
	if req.LibraryID != nil && *req.LibraryID != "" {
		u, err := pgxutil.UUIDFromString(*req.LibraryID)
		if err != nil {
			return Exercise{}, httpx.BadRequest("invalid_library_id", "libraryId must be a UUID")
		}
		libID = u
	}

	e, err := s.queries.CreateExercise(ctx, db.CreateExerciseParams{
		DayID:          dayID,
		LibraryID:      libID,
		Name:           strings.TrimSpace(req.Name),
		Sets:           req.Sets,
		Reps:           strings.TrimSpace(req.Reps),
		RestSeconds:    req.RestSeconds,
		Notes:          req.Notes,
		CoachHighlight: req.CoachHighlight,
		VideoUrl:       req.VideoURL,
		SortOrder:      req.SortOrder,
	})
	if err != nil {
		return Exercise{}, httpx.Internal("exercise_create_failed", err)
	}
	return exerciseFromDB(e), nil
}

func (s *Service) UpdateExercise(ctx context.Context, id pgtype.UUID, req ExerciseUpdateRequest) (Exercise, error) {
	var libID pgtype.UUID
	if req.LibraryID != nil && *req.LibraryID != "" {
		u, err := pgxutil.UUIDFromString(*req.LibraryID)
		if err != nil {
			return Exercise{}, httpx.BadRequest("invalid_library_id", "libraryId must be a UUID")
		}
		libID = u
	}
	e, err := s.queries.UpdateExercise(ctx, db.UpdateExerciseParams{
		ID:             id,
		LibraryID:      libID,
		Name:           req.Name,
		Sets:           req.Sets,
		Reps:           req.Reps,
		RestSeconds:    req.RestSeconds,
		Notes:          req.Notes,
		CoachHighlight: req.CoachHighlight,
		VideoUrl:       req.VideoURL,
		SortOrder:      req.SortOrder,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Exercise{}, httpx.NotFound("exercise_not_found", "exercise not found")
		}
		return Exercise{}, httpx.Internal("exercise_update_failed", err)
	}
	return exerciseFromDB(e), nil
}

func (s *Service) DeleteExercise(ctx context.Context, id pgtype.UUID) error {
	if err := s.queries.DeleteExercise(ctx, id); err != nil {
		return httpx.Internal("exercise_delete_failed", err)
	}
	return nil
}

// ════════════════════════════════════════
// Templates
// ════════════════════════════════════════

func (s *Service) ListTemplates(ctx context.Context, page, pageSize int) ([]Template, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 50
	}
	rows, err := s.queries.ListPlanTemplates(ctx, db.ListPlanTemplatesParams{
		Limit:  int32(pageSize),
		Offset: int32((page - 1) * pageSize),
	})
	if err != nil {
		return nil, 0, httpx.Internal("templates_list_failed", err)
	}
	total, err := s.queries.CountPlanTemplates(ctx)
	if err != nil {
		return nil, 0, httpx.Internal("templates_count_failed", err)
	}
	out := make([]Template, 0, len(rows))
	for _, r := range rows {
		out = append(out, templateFromDB(r))
	}
	return out, total, nil
}

func (s *Service) CreateTemplate(ctx context.Context, req TemplateCreateRequest, createdBy pgtype.UUID) (Template, error) {
	if strings.TrimSpace(req.Name) == "" {
		return Template{}, httpx.BadRequest("invalid_name", "name is required")
	}
	if len(req.PlanJSON) == 0 {
		return Template{}, httpx.BadRequest("invalid_plan_json", "planJson is required")
	}
	t, err := s.queries.CreatePlanTemplate(ctx, db.CreatePlanTemplateParams{
		Name:        strings.TrimSpace(req.Name),
		Description: req.Description,
		CreatedBy:   createdBy,
		PlanJson:    req.PlanJSON,
	})
	if err != nil {
		return Template{}, httpx.Internal("template_create_failed", err)
	}
	return templateFromDB(t), nil
}

func (s *Service) DeleteTemplate(ctx context.Context, id pgtype.UUID) error {
	if err := s.queries.DeletePlanTemplate(ctx, id); err != nil {
		return httpx.Internal("template_delete_failed", err)
	}
	return nil
}

// ════════════════════════════════════════
// Workout logs
// ════════════════════════════════════════

// LogListParams is a paginated time-window filter for logs.
type LogListParams struct {
	Page       int
	PageSize   int
	ExerciseID string
}

func (s *Service) ListLogs(ctx context.Context, clientID pgtype.UUID, p LogListParams) ([]LogEntry, error) {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PageSize <= 0 || p.PageSize > 200 {
		p.PageSize = 50
	}
	var exID pgtype.UUID
	if p.ExerciseID != "" {
		u, err := pgxutil.UUIDFromString(p.ExerciseID)
		if err != nil {
			return nil, httpx.BadRequest("invalid_exercise_id", "exerciseId must be a UUID")
		}
		exID = u
	}
	rows, err := s.queries.ListWorkoutLogsForClient(ctx, db.ListWorkoutLogsForClientParams{
		ClientID:   clientID,
		ExerciseID: exID,
		Since:      pgtype.Timestamptz{Valid: false},
		RowLimit:   int32(p.PageSize),
		RowOffset:  int32((p.Page - 1) * p.PageSize),
	})
	if err != nil {
		return nil, httpx.Internal("logs_list_failed", err)
	}
	out := make([]LogEntry, 0, len(rows))
	for _, r := range rows {
		out = append(out, logFromDB(r))
	}
	return out, nil
}

func (s *Service) CreateLog(ctx context.Context, clientID pgtype.UUID, req LogCreateRequest) (LogEntry, error) {
	exID, err := pgxutil.UUIDFromString(req.ExerciseID)
	if err != nil {
		return LogEntry{}, httpx.BadRequest("invalid_exercise_id", "exerciseId must be a UUID")
	}
	if req.SetNumber < 1 {
		return LogEntry{}, httpx.BadRequest("invalid_set_number", "setNumber must be >= 1")
	}

	var ts pgtype.Timestamptz
	if req.LoggedAt != nil {
		ts = pgtype.Timestamptz{Time: *req.LoggedAt, Valid: true}
	}

	l, err := s.queries.CreateWorkoutLog(ctx, db.CreateWorkoutLogParams{
		ClientID:   clientID,
		ExerciseID: exID,
		Column3:    ts,
		SetNumber:  req.SetNumber,
		WeightKg:   pgxutil.FloatToNumeric(req.WeightKg),
		RepsDone:   req.RepsDone,
		Completed:  req.Completed,
	})
	if err != nil {
		return LogEntry{}, httpx.Internal("log_create_failed", err)
	}
	return logFromDB(l), nil
}
