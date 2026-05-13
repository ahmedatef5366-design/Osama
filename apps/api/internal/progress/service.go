package progress

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

// ── Weight ─────────────────────────────────────────────────────

func (s *Service) LogWeight(ctx context.Context, clientID pgtype.UUID, req LogWeightRequest) error {
	if req.WeightKg <= 0 {
		return httpx.BadRequest("invalid_weight", "weightKg must be positive")
	}
	_, err := s.pool.Exec(ctx,
		`INSERT INTO weight_log (client_id, logged_at, weight_kg, notes) VALUES ($1, NOW(), $2, $3)`,
		clientID, req.WeightKg, req.Notes,
	)
	if err != nil {
		return httpx.Internal("weight_log_insert_failed", err)
	}
	return nil
}

func (s *Service) ListWeight(ctx context.Context, clientID pgtype.UUID, from, to time.Time) ([]WeightEntry, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT client_id, logged_at, weight_kg, notes
		 FROM weight_log
		 WHERE client_id = $1 AND logged_at >= $2 AND logged_at <= $3
		 ORDER BY logged_at DESC`,
		clientID, from, to,
	)
	if err != nil {
		return nil, httpx.Internal("weight_log_list_failed", err)
	}
	defer rows.Close()

	var out []WeightEntry
	for rows.Next() {
		var cid pgtype.UUID
		var loggedAt time.Time
		var weightKg pgtype.Numeric
		var notes *string
		if err := rows.Scan(&cid, &loggedAt, &weightKg, &notes); err != nil {
			return nil, httpx.Internal("weight_log_scan_failed", err)
		}
		w := 0.0
		if p := pgxutil.NumericToFloat(weightKg); p != nil {
			w = *p
		}
		out = append(out, WeightEntry{
			ClientID: pgxutil.UUIDToString(cid),
			LoggedAt: loggedAt,
			WeightKg: w,
			Notes:    notes,
		})
	}
	if out == nil {
		out = []WeightEntry{}
	}
	return out, nil
}

// ── Body measurements ──────────────────────────────────────────

func (s *Service) LogMeasurement(ctx context.Context, clientID pgtype.UUID, req LogMeasurementRequest) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO body_measurements (
			client_id, measured_at, weight_kg, waist_cm, chest_cm,
			shoulders_cm, hips_cm, left_arm_cm, right_arm_cm,
			left_thigh_cm, right_thigh_cm, body_fat_percent, notes
		) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		clientID, req.WeightKg, req.WaistCm, req.ChestCm,
		req.ShouldersCm, req.HipsCm, req.LeftArmCm, req.RightArmCm,
		req.LeftThighCm, req.RightThighCm, req.BodyFatPercent, req.Notes,
	)
	if err != nil {
		return httpx.Internal("measurement_insert_failed", err)
	}
	return nil
}

func (s *Service) ListMeasurements(ctx context.Context, clientID pgtype.UUID, limit, offset int) ([]Measurement, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT client_id, measured_at, weight_kg, waist_cm, chest_cm,
		        shoulders_cm, hips_cm, left_arm_cm, right_arm_cm,
		        left_thigh_cm, right_thigh_cm, body_fat_percent, notes
		 FROM body_measurements
		 WHERE client_id = $1
		 ORDER BY measured_at DESC
		 LIMIT $2 OFFSET $3`,
		clientID, limit, offset,
	)
	if err != nil {
		return nil, httpx.Internal("measurements_list_failed", err)
	}
	defer rows.Close()

	var out []Measurement
	for rows.Next() {
		var cid pgtype.UUID
		var measuredAt time.Time
		var weightKg, waistCm, chestCm, shouldersCm, hipsCm pgtype.Numeric
		var leftArmCm, rightArmCm, leftThighCm, rightThighCm, bodyFatPct pgtype.Numeric
		var notes *string
		if err := rows.Scan(
			&cid, &measuredAt, &weightKg, &waistCm, &chestCm,
			&shouldersCm, &hipsCm, &leftArmCm, &rightArmCm,
			&leftThighCm, &rightThighCm, &bodyFatPct, &notes,
		); err != nil {
			return nil, httpx.Internal("measurement_scan_failed", err)
		}
		out = append(out, Measurement{
			ClientID:       pgxutil.UUIDToString(cid),
			MeasuredAt:     measuredAt,
			WeightKg:       pgxutil.NumericToFloat(weightKg),
			WaistCm:        pgxutil.NumericToFloat(waistCm),
			ChestCm:        pgxutil.NumericToFloat(chestCm),
			ShouldersCm:    pgxutil.NumericToFloat(shouldersCm),
			HipsCm:         pgxutil.NumericToFloat(hipsCm),
			LeftArmCm:      pgxutil.NumericToFloat(leftArmCm),
			RightArmCm:     pgxutil.NumericToFloat(rightArmCm),
			LeftThighCm:    pgxutil.NumericToFloat(leftThighCm),
			RightThighCm:   pgxutil.NumericToFloat(rightThighCm),
			BodyFatPercent: pgxutil.NumericToFloat(bodyFatPct),
			Notes:          notes,
		})
	}
	if out == nil {
		out = []Measurement{}
	}
	return out, nil
}

// ── Photos ─────────────────────────────────────────────────────

func (s *Service) UploadPhoto(ctx context.Context, clientID pgtype.UUID, req UploadPhotoRequest) (Photo, error) {
	if req.PhotoURL == "" || req.PublicID == "" {
		return Photo{}, httpx.BadRequest("invalid_photo", "photoUrl and publicId are required")
	}
	var p Photo
	var id pgtype.UUID
	var cid pgtype.UUID
	var takenAt pgtype.Date
	var createdAt pgtype.Timestamptz
	err := s.pool.QueryRow(ctx,
		`INSERT INTO progress_photos (client_id, photo_url, public_id, taken_at, pose, note, show_on_landing)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, client_id, photo_url, public_id, taken_at, pose, note, show_on_landing, created_at`,
		clientID, req.PhotoURL, req.PublicID, req.TakenAt, req.Pose, req.Note, req.ShowOnLanding,
	).Scan(&id, &cid, &p.PhotoURL, &p.PublicID, &takenAt, &p.Pose, &p.Note, &p.ShowOnLanding, &createdAt)
	if err != nil {
		return Photo{}, httpx.Internal("photo_insert_failed", err)
	}
	p.ID = pgxutil.UUIDToString(id)
	p.ClientID = pgxutil.UUIDToString(cid)
	if takenAt.Valid {
		p.TakenAt = takenAt.Time.Format("2006-01-02")
	}
	if createdAt.Valid {
		p.CreatedAt = createdAt.Time
	}
	return p, nil
}

func (s *Service) ListPhotos(ctx context.Context, clientID pgtype.UUID, limit, offset int) ([]Photo, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, client_id, photo_url, public_id, taken_at, pose, note, show_on_landing, created_at
		 FROM progress_photos
		 WHERE client_id = $1
		 ORDER BY taken_at DESC
		 LIMIT $2 OFFSET $3`,
		clientID, limit, offset,
	)
	if err != nil {
		return nil, httpx.Internal("photos_list_failed", err)
	}
	defer rows.Close()

	var out []Photo
	for rows.Next() {
		var id, cid pgtype.UUID
		var takenAt pgtype.Date
		var createdAt pgtype.Timestamptz
		var p Photo
		if err := rows.Scan(&id, &cid, &p.PhotoURL, &p.PublicID, &takenAt, &p.Pose, &p.Note, &p.ShowOnLanding, &createdAt); err != nil {
			return nil, httpx.Internal("photo_scan_failed", err)
		}
		p.ID = pgxutil.UUIDToString(id)
		p.ClientID = pgxutil.UUIDToString(cid)
		if takenAt.Valid {
			p.TakenAt = takenAt.Time.Format("2006-01-02")
		}
		if createdAt.Valid {
			p.CreatedAt = createdAt.Time
		}
		out = append(out, p)
	}
	if out == nil {
		out = []Photo{}
	}
	return out, nil
}

func (s *Service) DeletePhoto(ctx context.Context, photoID, clientID pgtype.UUID) error {
	tag, err := s.pool.Exec(ctx,
		`DELETE FROM progress_photos WHERE id = $1 AND client_id = $2`,
		photoID, clientID,
	)
	if err != nil {
		return httpx.Internal("photo_delete_failed", err)
	}
	if tag.RowsAffected() == 0 {
		return httpx.NotFound("photo_not_found", "photo not found")
	}
	return nil
}

func (s *Service) GetPhoto(ctx context.Context, photoID pgtype.UUID) (Photo, error) {
	var id, cid pgtype.UUID
	var takenAt pgtype.Date
	var createdAt pgtype.Timestamptz
	var p Photo
	err := s.pool.QueryRow(ctx,
		`SELECT id, client_id, photo_url, public_id, taken_at, pose, note, show_on_landing, created_at
		 FROM progress_photos WHERE id = $1`,
		photoID,
	).Scan(&id, &cid, &p.PhotoURL, &p.PublicID, &takenAt, &p.Pose, &p.Note, &p.ShowOnLanding, &createdAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return Photo{}, httpx.NotFound("photo_not_found", "photo not found")
		}
		return Photo{}, httpx.Internal("photo_get_failed", err)
	}
	p.ID = pgxutil.UUIDToString(id)
	p.ClientID = pgxutil.UUIDToString(cid)
	if takenAt.Valid {
		p.TakenAt = takenAt.Time.Format("2006-01-02")
	}
	if createdAt.Valid {
		p.CreatedAt = createdAt.Time
	}
	return p, nil
}
