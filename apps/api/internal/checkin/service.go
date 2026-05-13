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

// Summary returns a roll-up of the client's last 7 days plus the
// current consecutive-day streak. The streak window is computed by
// pulling the distinct checkin dates and walking backwards from today
// (or yesterday, if today isn't logged yet) over contiguous days.
func (s *Service) Summary(ctx context.Context, clientID pgtype.UUID) (Summary, error) {
	var sm Summary

	// 1) Weekly aggregates over the last 7 calendar days.
	err := s.pool.QueryRow(ctx,
		`SELECT
			COUNT(*)::int                                                  AS week_checkins,
			COALESCE(AVG(diet_compliance), 0)::int                         AS week_compliance,
			COALESCE(SUM(water_intake_cups), 0)::int                       AS week_water,
			COALESCE(SUM(sleep_hours), 0)::int                             AS week_sleep,
			COALESCE(SUM(cardio_minutes), 0)::int                          AS week_cardio,
			BOOL_OR(checkin_date = CURRENT_DATE)                           AS checked_today
		 FROM daily_checkin
		 WHERE client_id = $1
		   AND checkin_date >= CURRENT_DATE - INTERVAL '6 days'
		   AND checkin_date <= CURRENT_DATE`,
		clientID,
	).Scan(
		&sm.WeekCheckins, &sm.WeekCompliance, &sm.WeekWaterCups,
		&sm.WeekSleepHours, &sm.WeekCardioMins, &sm.CheckedInToday,
	)
	if err != nil {
		return sm, httpx.Internal("summary_week_failed", err)
	}

	// 2) Current streak — walk distinct checkin dates from today backwards.
	rows, err := s.pool.Query(ctx,
		`SELECT DISTINCT checkin_date
		 FROM daily_checkin
		 WHERE client_id = $1
		   AND checkin_date <= CURRENT_DATE
		 ORDER BY checkin_date DESC
		 LIMIT 400`,
		clientID,
	)
	if err != nil {
		return sm, httpx.Internal("summary_dates_failed", err)
	}
	defer rows.Close()

	var dates []time.Time
	for rows.Next() {
		var d pgtype.Date
		if err := rows.Scan(&d); err != nil {
			return sm, httpx.Internal("summary_date_scan_failed", err)
		}
		if d.Valid {
			dates = append(dates, d.Time)
		}
	}

	sm.CurrentStreak = computeCurrentStreak(dates, time.Now().UTC())
	sm.LongestStreak = computeLongestStreak(dates)
	return sm, nil
}

// computeCurrentStreak counts the consecutive days ending at today (or
// yesterday if today isn't in the set). Dates are expected newest-first.
func computeCurrentStreak(dates []time.Time, now time.Time) int {
	if len(dates) == 0 {
		return 0
	}
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	cursor := today
	gotToday := sameDay(dates[0], today)
	if !gotToday {
		// Today missing — start from yesterday so a missed day TODAY
		// doesn't show a 0 streak when yesterday is logged.
		cursor = today.AddDate(0, 0, -1)
		if !sameDay(dates[0], cursor) {
			return 0
		}
	}
	streak := 0
	for _, d := range dates {
		if sameDay(d, cursor) {
			streak++
			cursor = cursor.AddDate(0, 0, -1)
		} else if d.Before(cursor) {
			break
		}
	}
	return streak
}

// computeLongestStreak walks the (newest-first) date set and tracks
// the longest run of contiguous days.
func computeLongestStreak(dates []time.Time) int {
	if len(dates) == 0 {
		return 0
	}
	// Sort ascending for a single forward pass. Avoid sort.Slice import
	// pressure — small N (<=400), simple insertion is fine.
	asc := make([]time.Time, len(dates))
	copy(asc, dates)
	for i := 1; i < len(asc); i++ {
		for j := i; j > 0 && asc[j].Before(asc[j-1]); j-- {
			asc[j], asc[j-1] = asc[j-1], asc[j]
		}
	}
	longest, run := 1, 1
	for i := 1; i < len(asc); i++ {
		if asc[i].Sub(asc[i-1]) == 24*time.Hour {
			run++
			if run > longest {
				longest = run
			}
		} else if !sameDay(asc[i], asc[i-1]) {
			run = 1
		}
	}
	return longest
}

func sameDay(a, b time.Time) bool {
	ay, am, ad := a.Date()
	by, bm, bd := b.Date()
	return ay == by && am == bm && ad == bd
}
