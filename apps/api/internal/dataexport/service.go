// Package dataexport produces CSV (and JSON) dumps of the platform's
// operational data for the admin. Three CSVs cover the bulk of "give
// me everything" requests:
//
//   - clients.csv:  one row per client with their profile, contact,
//     subscription, and aggregated check-in counts.
//   - checkins.csv: one row per daily check-in (last 365 days), with
//     the client's name and email for context.
//   - workout-logs.csv: one row per logged exercise across all clients.
//
// In addition, /api/clients/me/export.json gives the trainee a
// machine-readable copy of their own profile + progress — useful for
// GDPR self-service and for moving to a different coach.
package dataexport

import (
	"context"
	"encoding/csv"
	"io"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool} }

// ── Clients CSV ─────────────────────────────────────────────

var clientsCSVHeader = []string{
	"id", "email", "name", "age", "sex", "height_cm", "current_weight_kg",
	"goal", "experience_level", "activity_level",
	"start_date", "target_date", "is_active",
	"phone", "whatsapp", "instagram",
	"created_at",
}

// WriteClientsCSV streams every client row as CSV into w.
func (s *Service) WriteClientsCSV(ctx context.Context, w io.Writer) error {
	rows, err := s.pool.Query(ctx,
		`SELECT c.id, u.email, c.name, c.age, c.sex, c.height_cm, c.current_weight_kg,
		        c.goal, c.experience_level, c.activity_level,
		        c.start_date, c.target_date, c.is_active,
		        c.phone, c.whatsapp, c.instagram,
		        c.created_at
		   FROM clients c
		   JOIN users u ON u.id = c.user_id
		  ORDER BY c.created_at DESC`,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	cw := csv.NewWriter(w)
	defer cw.Flush()
	if err := cw.Write(clientsCSVHeader); err != nil {
		return err
	}
	for rows.Next() {
		var (
			id                         pgtype.UUID
			email, name                string
			age                        *int32
			sex                        *string
			height, weight             pgtype.Numeric
			goal, exp, activity        *string
			startDate, targetDate      pgtype.Date
			isActive                   bool
			phone, whatsapp, instagram *string
			createdAt                  pgtype.Timestamptz
		)
		if err := rows.Scan(&id, &email, &name, &age, &sex, &height, &weight,
			&goal, &exp, &activity, &startDate, &targetDate, &isActive,
			&phone, &whatsapp, &instagram, &createdAt); err != nil {
			return err
		}
		if err := cw.Write([]string{
			uuidString(id),
			email,
			name,
			i32ptr(age),
			strDeref(sex),
			numericString(height),
			numericString(weight),
			strDeref(goal),
			strDeref(exp),
			strDeref(activity),
			dateString(startDate),
			dateString(targetDate),
			boolString(isActive),
			strDeref(phone),
			strDeref(whatsapp),
			strDeref(instagram),
			tsString(createdAt),
		}); err != nil {
			return err
		}
	}
	return rows.Err()
}

// ── Daily check-ins CSV ────────────────────────────────────

var checkinsCSVHeader = []string{
	"client_id", "client_name", "email",
	"checkin_date", "diet_compliance", "workout_compliance",
	"weight_kg", "sleep_hours", "stress_level", "notes",
}

func (s *Service) WriteCheckinsCSV(ctx context.Context, w io.Writer) error {
	rows, err := s.pool.Query(ctx,
		`SELECT dc.client_id, c.name, u.email,
		        dc.checkin_date,
		        dc.diet_compliance, dc.workout_compliance,
		        dc.weight_kg, dc.sleep_hours, dc.stress_level, dc.notes
		   FROM daily_checkin dc
		   JOIN clients c ON c.id = dc.client_id
		   JOIN users   u ON u.id = c.user_id
		  WHERE dc.checkin_date >= CURRENT_DATE - INTERVAL '365 days'
		  ORDER BY dc.checkin_date DESC, c.name ASC`,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	cw := csv.NewWriter(w)
	defer cw.Flush()
	if err := cw.Write(checkinsCSVHeader); err != nil {
		return err
	}
	for rows.Next() {
		var (
			clientID                     pgtype.UUID
			name, email                  string
			day                          pgtype.Date
			diet, workout, sleep, stress pgtype.Int4
			weight                       pgtype.Numeric
			notes                        *string
		)
		if err := rows.Scan(&clientID, &name, &email, &day,
			&diet, &workout, &weight, &sleep, &stress, &notes); err != nil {
			return err
		}
		if err := cw.Write([]string{
			uuidString(clientID),
			name,
			email,
			dateString(day),
			intString(diet),
			intString(workout),
			numericString(weight),
			intString(sleep),
			intString(stress),
			strDeref(notes),
		}); err != nil {
			return err
		}
	}
	return rows.Err()
}

// ── Per-client CSV (single export) ─────────────────────────

func (s *Service) WriteSingleClientCSV(ctx context.Context, w io.Writer, clientID string) error {
	rows, err := s.pool.Query(ctx,
		`SELECT dc.checkin_date, dc.diet_compliance, dc.workout_compliance,
		        dc.weight_kg, dc.sleep_hours, dc.stress_level, dc.notes
		   FROM daily_checkin dc
		  WHERE dc.client_id = $1
		  ORDER BY dc.checkin_date DESC`,
		clientID,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	cw := csv.NewWriter(w)
	defer cw.Flush()
	if err := cw.Write([]string{
		"checkin_date", "diet_compliance", "workout_compliance",
		"weight_kg", "sleep_hours", "stress_level", "notes",
	}); err != nil {
		return err
	}
	for rows.Next() {
		var (
			day                          pgtype.Date
			diet, workout, sleep, stress pgtype.Int4
			weight                       pgtype.Numeric
			notes                        *string
		)
		if err := rows.Scan(&day, &diet, &workout, &weight, &sleep, &stress, &notes); err != nil {
			return err
		}
		if err := cw.Write([]string{
			dateString(day),
			intString(diet),
			intString(workout),
			numericString(weight),
			intString(sleep),
			intString(stress),
			strDeref(notes),
		}); err != nil {
			return err
		}
	}
	return rows.Err()
}

// ── Client self-export JSON ────────────────────────────────

// ClientSelfExport is the structured JSON dump a logged-in client can
// request via /api/clients/me/export.json. Trim, GDPR-friendly.
type ClientSelfExport struct {
	Profile  map[string]any   `json:"profile"`
	Weights  []map[string]any `json:"weightLog"`
	Checkins []map[string]any `json:"dailyCheckins"`
}

func (s *Service) BuildSelfExport(ctx context.Context, clientID string) (ClientSelfExport, error) {
	out := ClientSelfExport{
		Profile:  map[string]any{"id": clientID},
		Weights:  []map[string]any{},
		Checkins: []map[string]any{},
	}

	// Profile
	prow := s.pool.QueryRow(ctx,
		`SELECT u.email, c.name, c.age, c.sex, c.height_cm, c.current_weight_kg,
		        c.goal, c.experience_level, c.activity_level,
		        c.start_date, c.target_date, c.is_active, c.created_at
		   FROM clients c JOIN users u ON u.id = c.user_id
		  WHERE c.id = $1`, clientID)
	var (
		email, name           string
		age                   *int32
		sex                   *string
		h, w                  pgtype.Numeric
		goal, exp, activity   *string
		startDate, targetDate pgtype.Date
		isActive              bool
		createdAt             pgtype.Timestamptz
	)
	if err := prow.Scan(&email, &name, &age, &sex, &h, &w, &goal, &exp, &activity, &startDate, &targetDate, &isActive, &createdAt); err != nil {
		return out, err
	}
	out.Profile["email"] = email
	out.Profile["name"] = name
	if age != nil {
		out.Profile["age"] = *age
	}
	if sex != nil {
		out.Profile["sex"] = *sex
	}
	out.Profile["heightCm"] = numericString(h)
	out.Profile["currentWeightKg"] = numericString(w)
	if goal != nil {
		out.Profile["goal"] = *goal
	}
	if exp != nil {
		out.Profile["experienceLevel"] = *exp
	}
	if activity != nil {
		out.Profile["activityLevel"] = *activity
	}
	out.Profile["startDate"] = dateString(startDate)
	out.Profile["targetDate"] = dateString(targetDate)
	out.Profile["isActive"] = isActive
	if createdAt.Valid {
		out.Profile["createdAt"] = createdAt.Time
	}

	// Weight log
	wrows, err := s.pool.Query(ctx,
		`SELECT measured_at, weight_kg
		   FROM weight_log
		  WHERE client_id = $1
		  ORDER BY measured_at DESC LIMIT 1000`, clientID)
	if err == nil {
		defer wrows.Close()
		for wrows.Next() {
			var (
				ts pgtype.Timestamptz
				kg pgtype.Numeric
			)
			if err := wrows.Scan(&ts, &kg); err == nil {
				out.Weights = append(out.Weights, map[string]any{
					"measuredAt": tsString(ts),
					"weightKg":   numericString(kg),
				})
			}
		}
	}

	// Check-ins
	crows, err := s.pool.Query(ctx,
		`SELECT checkin_date, diet_compliance, workout_compliance,
		        weight_kg, sleep_hours, stress_level, notes
		   FROM daily_checkin
		  WHERE client_id = $1
		  ORDER BY checkin_date DESC LIMIT 1000`, clientID)
	if err == nil {
		defer crows.Close()
		for crows.Next() {
			var (
				day                          pgtype.Date
				diet, workout, sleep, stress pgtype.Int4
				kg                           pgtype.Numeric
				notes                        *string
			)
			if err := crows.Scan(&day, &diet, &workout, &kg, &sleep, &stress, &notes); err == nil {
				row := map[string]any{
					"date":              dateString(day),
					"dietCompliance":    intString(diet),
					"workoutCompliance": intString(workout),
					"weightKg":          numericString(kg),
					"sleepHours":        intString(sleep),
					"stressLevel":       intString(stress),
				}
				if notes != nil {
					row["notes"] = *notes
				}
				out.Checkins = append(out.Checkins, row)
			}
		}
	}

	return out, nil
}
