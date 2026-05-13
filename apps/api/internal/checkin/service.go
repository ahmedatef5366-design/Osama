package checkin

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

func (s *Service) Submit(ctx context.Context, clientID pgtype.UUID, req SubmitCheckinRequest) (Checkin, error) {
	if req.CheckinDate == "" {
		req.CheckinDate = time.Now().Format("2006-01-02")
	}

	var id pgtype.UUID
	var cid pgtype.UUID
	var checkinDate pgtype.Date
	var submittedAt pgtype.Timestamptz
	var ch Checkin

	err := s.pool.QueryRow(ctx,
		`INSERT INTO daily_checkin (
			client_id, checkin_date, workout_status, workout_sets_done,
			diet_compliance, cardio_done, cardio_minutes, sleep_quality,
			sleep_hours, water_intake_cups, client_note
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (client_id, checkin_date) DO UPDATE SET
			workout_status   = EXCLUDED.workout_status,
			workout_sets_done = EXCLUDED.workout_sets_done,
			diet_compliance  = EXCLUDED.diet_compliance,
			cardio_done      = EXCLUDED.cardio_done,
			cardio_minutes   = EXCLUDED.cardio_minutes,
			sleep_quality    = EXCLUDED.sleep_quality,
			sleep_hours      = EXCLUDED.sleep_hours,
			water_intake_cups = EXCLUDED.water_intake_cups,
			client_note      = EXCLUDED.client_note,
			submitted_at     = NOW()
		RETURNING id, client_id, checkin_date, workout_status, workout_sets_done,
		          diet_compliance, cardio_done, cardio_minutes, sleep_quality,
		          sleep_hours, water_intake_cups, client_note, submitted_at`,
		clientID, req.CheckinDate, req.WorkoutStatus, req.WorkoutSetsDone,
		req.DietCompliance, req.CardioDone, req.CardioMinutes, req.SleepQuality,
		req.SleepHours, req.WaterIntakeCups, req.ClientNote,
	).Scan(
		&id, &cid, &checkinDate, &ch.WorkoutStatus, &ch.WorkoutSetsDone,
		&ch.DietCompliance, &ch.CardioDone, &ch.CardioMinutes, &ch.SleepQuality,
		&ch.SleepHours, &ch.WaterIntakeCups, &ch.ClientNote, &submittedAt,
	)
	if err != nil {
		return Checkin{}, httpx.Internal("checkin_submit_failed", err)
	}

	ch.ID = pgxutil.UUIDToString(id)
	ch.ClientID = pgxutil.UUIDToString(cid)
	if checkinDate.Valid {
		ch.CheckinDate = checkinDate.Time.Format("2006-01-02")
	}
	if submittedAt.Valid {
		ch.SubmittedAt = submittedAt.Time
	}
	return ch, nil
}

func (s *Service) Get(ctx context.Context, clientID pgtype.UUID, date string) (Checkin, error) {
	var id, cid pgtype.UUID
	var checkinDate pgtype.Date
	var submittedAt pgtype.Timestamptz
	var ch Checkin

	err := s.pool.QueryRow(ctx,
		`SELECT id, client_id, checkin_date, workout_status, workout_sets_done,
		        diet_compliance, cardio_done, cardio_minutes, sleep_quality,
		        sleep_hours, water_intake_cups, client_note, submitted_at
		 FROM daily_checkin
		 WHERE client_id = $1 AND checkin_date = $2`,
		clientID, date,
	).Scan(
		&id, &cid, &checkinDate, &ch.WorkoutStatus, &ch.WorkoutSetsDone,
		&ch.DietCompliance, &ch.CardioDone, &ch.CardioMinutes, &ch.SleepQuality,
		&ch.SleepHours, &ch.WaterIntakeCups, &ch.ClientNote, &submittedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return Checkin{}, httpx.NotFound("checkin_not_found", "no check-in for this date")
		}
		return Checkin{}, httpx.Internal("checkin_get_failed", err)
	}

	ch.ID = pgxutil.UUIDToString(id)
	ch.ClientID = pgxutil.UUIDToString(cid)
	if checkinDate.Valid {
		ch.CheckinDate = checkinDate.Time.Format("2006-01-02")
	}
	if submittedAt.Valid {
		ch.SubmittedAt = submittedAt.Time
	}
	return ch, nil
}

func (s *Service) List(ctx context.Context, clientID pgtype.UUID, limit, offset int) ([]Checkin, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, client_id, checkin_date, workout_status, workout_sets_done,
		        diet_compliance, cardio_done, cardio_minutes, sleep_quality,
		        sleep_hours, water_intake_cups, client_note, submitted_at
		 FROM daily_checkin
		 WHERE client_id = $1
		 ORDER BY checkin_date DESC
		 LIMIT $2 OFFSET $3`,
		clientID, limit, offset,
	)
	if err != nil {
		return nil, httpx.Internal("checkins_list_failed", err)
	}
	defer rows.Close()

	var out []Checkin
	for rows.Next() {
		var id, cid pgtype.UUID
		var checkinDate pgtype.Date
		var submittedAt pgtype.Timestamptz
		var ch Checkin
		if err := rows.Scan(
			&id, &cid, &checkinDate, &ch.WorkoutStatus, &ch.WorkoutSetsDone,
			&ch.DietCompliance, &ch.CardioDone, &ch.CardioMinutes, &ch.SleepQuality,
			&ch.SleepHours, &ch.WaterIntakeCups, &ch.ClientNote, &submittedAt,
		); err != nil {
			return nil, httpx.Internal("checkin_scan_failed", err)
		}
		ch.ID = pgxutil.UUIDToString(id)
		ch.ClientID = pgxutil.UUIDToString(cid)
		if checkinDate.Valid {
			ch.CheckinDate = checkinDate.Time.Format("2006-01-02")
		}
		if submittedAt.Valid {
			ch.SubmittedAt = submittedAt.Time
		}
		out = append(out, ch)
	}
	if out == nil {
		out = []Checkin{}
	}
	return out, nil
}

func (s *Service) AtRisk(ctx context.Context) ([]AtRiskClient, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT c.id, c.user_id, c.name, c.is_active,
		        COALESCE(AVG(dc.diet_compliance), 0)::int AS avg_compliance,
		        COUNT(dc.id)::int AS checkin_count
		 FROM clients c
		 LEFT JOIN daily_checkin dc ON dc.client_id = c.id
		   AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
		 WHERE c.is_active = true
		 GROUP BY c.id
		 HAVING COALESCE(AVG(dc.diet_compliance), 0) < 60
		 ORDER BY avg_compliance ASC`,
	)
	if err != nil {
		return nil, httpx.Internal("at_risk_query_failed", err)
	}
	defer rows.Close()

	var out []AtRiskClient
	for rows.Next() {
		var id, uid pgtype.UUID
		var a AtRiskClient
		if err := rows.Scan(&id, &uid, &a.Name, &a.IsActive, &a.AvgCompliance, &a.CheckinCount); err != nil {
			return nil, httpx.Internal("at_risk_scan_failed", err)
		}
		a.ID = pgxutil.UUIDToString(id)
		a.UserID = pgxutil.UUIDToString(uid)
		out = append(out, a)
	}
	if out == nil {
		out = []AtRiskClient{}
	}
	return out, nil
}
