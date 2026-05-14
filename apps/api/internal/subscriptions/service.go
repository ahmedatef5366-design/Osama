package subscriptions

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// Service handles plan + subscription CRUD. Subscriptions are upserted
// (one row per client_id); plan changes write a row to
// subscription_history so the admin can see the timeline.
type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// ListPlans returns every plan sorted by sort_order. Inactive plans
// are included so an admin can see archived tiers; the web layer
// filters by isActive for the client-facing page.
func (s *Service) ListPlans(ctx context.Context) ([]Plan, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT id, slug, name, description, monthly_price_egp,
		        features, max_clients, sort_order, is_active,
		        created_at, updated_at
		   FROM plans
		  ORDER BY sort_order ASC, created_at ASC`,
	)
	if err != nil {
		return nil, httpx.Internal("plans_list_failed", err)
	}
	defer rows.Close()

	out := make([]Plan, 0, 4)
	for rows.Next() {
		p, err := scanPlan(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}

// GetPlanBySlug — used by the upsert path when admin sends planSlug.
func (s *Service) GetPlanBySlug(ctx context.Context, slug string) (Plan, error) {
	row := s.pool.QueryRow(ctx,
		`SELECT id, slug, name, description, monthly_price_egp,
		        features, max_clients, sort_order, is_active,
		        created_at, updated_at
		   FROM plans WHERE slug = $1`, slug,
	)
	p, err := scanPlan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Plan{}, httpx.NotFound("plan_not_found", "plan not found")
		}
		return Plan{}, err
	}
	return p, nil
}

// ListAll returns every active subscription with the client's name +
// email. Used by /admin/subscriptions.
func (s *Service) ListAll(ctx context.Context) ([]SubscriptionWithClient, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT s.id, s.client_id, s.plan_id, p.slug, p.name,
		        s.status, s.started_at, s.expires_at, s.trial_until,
		        s.cancel_reason, s.notes, s.created_at, s.updated_at,
		        c.name, u.email
		   FROM subscriptions s
		   JOIN plans p   ON p.id = s.plan_id
		   JOIN clients c ON c.id = s.client_id
		   JOIN users u   ON u.id = c.user_id
		  ORDER BY s.updated_at DESC`,
	)
	if err != nil {
		return nil, httpx.Internal("subscriptions_list_failed", err)
	}
	defer rows.Close()

	out := make([]SubscriptionWithClient, 0)
	for rows.Next() {
		sub, err := scanSubscriptionWithClient(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, sub)
	}
	return out, nil
}

// GetForClient returns the single subscription row for a given client.
// Returns NotFound if the client has never been assigned a plan.
func (s *Service) GetForClient(ctx context.Context, clientID pgtype.UUID) (Subscription, error) {
	row := s.pool.QueryRow(ctx,
		`SELECT s.id, s.client_id, s.plan_id, p.slug, p.name,
		        s.status, s.started_at, s.expires_at, s.trial_until,
		        s.cancel_reason, s.notes, s.created_at, s.updated_at
		   FROM subscriptions s
		   JOIN plans p ON p.id = s.plan_id
		  WHERE s.client_id = $1`, clientID,
	)
	sub, err := scanSubscription(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Subscription{}, httpx.NotFound("subscription_not_found", "no subscription yet")
		}
		return Subscription{}, err
	}
	return sub, nil
}

// Upsert creates or replaces the subscription for a client. Writes a
// row to subscription_history capturing the transition. changedBy is
// the admin user id; pass pgtype.UUID{} for system-issued upserts.
func (s *Service) Upsert(
	ctx context.Context,
	req UpsertRequest,
	changedBy pgtype.UUID,
) (Subscription, error) {
	if req.ClientID == "" {
		return Subscription{}, httpx.BadRequest("client_id_required", "clientId is required")
	}
	clientUUID, err := pgxutil.UUIDFromString(req.ClientID)
	if err != nil {
		return Subscription{}, httpx.BadRequest("client_id_invalid", "clientId is not a valid UUID")
	}

	plan, err := s.resolvePlan(ctx, req.PlanID, req.PlanSlug)
	if err != nil {
		return Subscription{}, err
	}
	planUUID, _ := pgxutil.UUIDFromString(plan.ID)

	status := "active"
	if req.Status != nil {
		status = *req.Status
	}
	if !isValidStatus(status) {
		return Subscription{}, httpx.BadRequest("status_invalid", "status must be trial|active|expired|canceled")
	}

	expiresAt, err := parseTimePtr(req.ExpiresAt, "expiresAt")
	if err != nil {
		return Subscription{}, err
	}
	trialUntil, err := parseTimePtr(req.TrialUntil, "trialUntil")
	if err != nil {
		return Subscription{}, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Subscription{}, httpx.Internal("tx_begin_failed", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	row := tx.QueryRow(ctx,
		`INSERT INTO subscriptions
		   (client_id, plan_id, status, expires_at, trial_until, notes)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (client_id) DO UPDATE SET
		   plan_id     = EXCLUDED.plan_id,
		   status      = EXCLUDED.status,
		   expires_at  = EXCLUDED.expires_at,
		   trial_until = EXCLUDED.trial_until,
		   notes       = COALESCE(EXCLUDED.notes, subscriptions.notes),
		   updated_at  = NOW()
		 RETURNING id, client_id, plan_id, status, started_at,
		           expires_at, trial_until, cancel_reason, notes,
		           created_at, updated_at`,
		clientUUID, planUUID, status, expiresAt, trialUntil, req.Notes,
	)
	sub, err := scanSubscriptionRow(row, plan.Slug, plan.Name)
	if err != nil {
		return Subscription{}, err
	}

	// Audit trail.
	if _, err := tx.Exec(ctx,
		`INSERT INTO subscription_history
		   (client_id, plan_id, status, started_at, expires_at, changed_by, note)
		 VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
		clientUUID, planUUID, status, expiresAt, changedBy, req.Notes,
	); err != nil {
		return Subscription{}, httpx.Internal("history_write_failed", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Subscription{}, httpx.Internal("tx_commit_failed", err)
	}
	return sub, nil
}

// Cancel marks the subscription as canceled and records the reason.
// The row stays so the history is preserved; admin can re-upsert later.
func (s *Service) Cancel(
	ctx context.Context,
	clientID pgtype.UUID,
	reason *string,
	changedBy pgtype.UUID,
) (Subscription, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Subscription{}, httpx.Internal("tx_begin_failed", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var planID pgtype.UUID
	row := tx.QueryRow(ctx,
		`UPDATE subscriptions
		    SET status = 'canceled',
		        cancel_reason = $2,
		        updated_at = NOW()
		  WHERE client_id = $1
		  RETURNING plan_id`,
		clientID, reason,
	)
	if err := row.Scan(&planID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Subscription{}, httpx.NotFound("subscription_not_found", "no subscription yet")
		}
		return Subscription{}, httpx.Internal("cancel_failed", err)
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO subscription_history
		   (client_id, plan_id, status, started_at, expires_at, changed_by, note)
		 VALUES ($1, $2, 'canceled', NOW(), NULL, $3, $4)`,
		clientID, planID, changedBy, reason,
	); err != nil {
		return Subscription{}, httpx.Internal("history_write_failed", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Subscription{}, httpx.Internal("tx_commit_failed", err)
	}
	return s.GetForClient(ctx, clientID)
}

// StartTrial seeds a 14-day trial for a fresh client on the Starter
// plan. Called once at client creation; idempotent if already exists.
func (s *Service) StartTrial(ctx context.Context, clientID pgtype.UUID, changedBy pgtype.UUID) error {
	var exists bool
	if err := s.pool.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM subscriptions WHERE client_id = $1)`,
		clientID,
	).Scan(&exists); err != nil {
		return httpx.Internal("trial_check_failed", err)
	}
	if exists {
		return nil
	}
	starter, err := s.GetPlanBySlug(ctx, "starter")
	if err != nil {
		return err
	}
	starterID, _ := pgxutil.UUIDFromString(starter.ID)

	trialUntil := time.Now().UTC().Add(14 * 24 * time.Hour)
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return httpx.Internal("tx_begin_failed", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	if _, err := tx.Exec(ctx,
		`INSERT INTO subscriptions
		   (client_id, plan_id, status, trial_until)
		 VALUES ($1, $2, 'trial', $3)
		 ON CONFLICT (client_id) DO NOTHING`,
		clientID, starterID, trialUntil,
	); err != nil {
		return httpx.Internal("trial_insert_failed", err)
	}
	if _, err := tx.Exec(ctx,
		`INSERT INTO subscription_history
		   (client_id, plan_id, status, started_at, expires_at, changed_by, note)
		 VALUES ($1, $2, 'trial', NOW(), $3, $4, 'auto trial')`,
		clientID, starterID, trialUntil, changedBy,
	); err != nil {
		return httpx.Internal("trial_history_failed", err)
	}
	return tx.Commit(ctx)
}

// History returns the timeline of plan/status changes for a client.
func (s *Service) History(ctx context.Context, clientID pgtype.UUID) ([]HistoryEntry, error) {
	rows, err := s.pool.Query(ctx,
		`SELECT h.id, h.client_id, h.plan_id, p.slug, h.status,
		        h.started_at, h.expires_at, h.changed_by, h.changed_at, h.note
		   FROM subscription_history h
		   JOIN plans p ON p.id = h.plan_id
		  WHERE h.client_id = $1
		  ORDER BY h.changed_at DESC
		  LIMIT 100`,
		clientID,
	)
	if err != nil {
		return nil, httpx.Internal("history_list_failed", err)
	}
	defer rows.Close()
	out := make([]HistoryEntry, 0)
	for rows.Next() {
		var (
			h         HistoryEntry
			id, cid   pgtype.UUID
			pid       pgtype.UUID
			expiresAt pgtype.Timestamptz
			changedBy pgtype.UUID
			changedAt pgtype.Timestamptz
			startedAt pgtype.Timestamptz
			note      pgtype.Text
		)
		if err := rows.Scan(&id, &cid, &pid, &h.PlanSlug, &h.Status, &startedAt, &expiresAt, &changedBy, &changedAt, &note); err != nil {
			return nil, httpx.Internal("history_scan_failed", err)
		}
		h.ID = pgxutil.UUIDToString(id)
		h.ClientID = pgxutil.UUIDToString(cid)
		h.PlanID = pgxutil.UUIDToString(pid)
		if startedAt.Valid {
			h.StartedAt = startedAt.Time
		}
		if expiresAt.Valid {
			t := expiresAt.Time
			h.ExpiresAt = &t
		}
		if changedBy.Valid {
			s := pgxutil.UUIDToString(changedBy)
			h.ChangedBy = &s
		}
		if changedAt.Valid {
			h.ChangedAt = changedAt.Time
		}
		if note.Valid {
			n := note.String
			h.Note = &n
		}
		out = append(out, h)
	}
	return out, nil
}

// ════════════════════════════════════════
// helpers
// ════════════════════════════════════════

func (s *Service) resolvePlan(ctx context.Context, idOpt, slugOpt *string) (Plan, error) {
	if slugOpt != nil && *slugOpt != "" {
		return s.GetPlanBySlug(ctx, *slugOpt)
	}
	if idOpt != nil && *idOpt != "" {
		uid, err := pgxutil.UUIDFromString(*idOpt)
		if err != nil {
			return Plan{}, httpx.BadRequest("plan_id_invalid", "planId is not a valid UUID")
		}
		row := s.pool.QueryRow(ctx,
			`SELECT id, slug, name, description, monthly_price_egp,
			        features, max_clients, sort_order, is_active,
			        created_at, updated_at
			   FROM plans WHERE id = $1`, uid,
		)
		p, err := scanPlan(row)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return Plan{}, httpx.NotFound("plan_not_found", "plan not found")
			}
			return Plan{}, err
		}
		return p, nil
	}
	return Plan{}, httpx.BadRequest("plan_required", "planSlug or planId is required")
}

func isValidStatus(s string) bool {
	switch s {
	case "trial", "active", "expired", "canceled":
		return true
	}
	return false
}

func parseTimePtr(s *string, field string) (*time.Time, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, *s)
	if err != nil {
		return nil, httpx.BadRequest("invalid_time", field+" must be RFC3339")
	}
	return &t, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanPlan(r rowScanner) (Plan, error) {
	var (
		p          Plan
		id         pgtype.UUID
		nameRaw    []byte
		descRaw    []byte
		featuresRw []byte
		createdAt  pgtype.Timestamptz
		updatedAt  pgtype.Timestamptz
		descNull   pgtype.Text
	)
	_ = descNull
	if err := r.Scan(
		&id, &p.Slug, &nameRaw, &descRaw, &p.MonthlyPriceEGP,
		&featuresRw, &p.MaxClients, &p.SortOrder, &p.IsActive,
		&createdAt, &updatedAt,
	); err != nil {
		return Plan{}, err
	}
	p.ID = pgxutil.UUIDToString(id)
	if err := json.Unmarshal(nameRaw, &p.Name); err != nil {
		return Plan{}, httpx.Internal("plan_name_unmarshal", err)
	}
	if len(descRaw) > 0 {
		var d LocalizedString
		if err := json.Unmarshal(descRaw, &d); err == nil {
			p.Description = &d
		}
	}
	if len(featuresRw) > 0 {
		if err := json.Unmarshal(featuresRw, &p.Features); err != nil {
			return Plan{}, httpx.Internal("plan_features_unmarshal", err)
		}
	}
	if createdAt.Valid {
		p.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		p.UpdatedAt = updatedAt.Time
	}
	return p, nil
}

func scanSubscription(r rowScanner) (Subscription, error) {
	var (
		s                                Subscription
		id, cid, pid                     pgtype.UUID
		nameRaw                          []byte
		startedAt, expiresAt, trialUntil pgtype.Timestamptz
		createdAt, updatedAt             pgtype.Timestamptz
		cancelReason, notes              pgtype.Text
	)
	if err := r.Scan(
		&id, &cid, &pid, &s.PlanSlug, &nameRaw,
		&s.Status, &startedAt, &expiresAt, &trialUntil,
		&cancelReason, &notes, &createdAt, &updatedAt,
	); err != nil {
		return Subscription{}, err
	}
	s.ID = pgxutil.UUIDToString(id)
	s.ClientID = pgxutil.UUIDToString(cid)
	s.PlanID = pgxutil.UUIDToString(pid)
	if len(nameRaw) > 0 {
		_ = json.Unmarshal(nameRaw, &s.PlanName)
	}
	if startedAt.Valid {
		s.StartedAt = startedAt.Time
	}
	if expiresAt.Valid {
		t := expiresAt.Time
		s.ExpiresAt = &t
	}
	if trialUntil.Valid {
		t := trialUntil.Time
		s.TrialUntil = &t
	}
	if cancelReason.Valid {
		v := cancelReason.String
		s.CancelReason = &v
	}
	if notes.Valid {
		v := notes.String
		s.Notes = &v
	}
	if createdAt.Valid {
		s.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		s.UpdatedAt = updatedAt.Time
	}
	return s, nil
}

func scanSubscriptionWithClient(r rowScanner) (SubscriptionWithClient, error) {
	var (
		out                              SubscriptionWithClient
		id, cid, pid                     pgtype.UUID
		nameRaw                          []byte
		startedAt, expiresAt, trialUntil pgtype.Timestamptz
		createdAt, updatedAt             pgtype.Timestamptz
		cancelReason, notes              pgtype.Text
	)
	if err := r.Scan(
		&id, &cid, &pid, &out.PlanSlug, &nameRaw,
		&out.Status, &startedAt, &expiresAt, &trialUntil,
		&cancelReason, &notes, &createdAt, &updatedAt,
		&out.ClientName, &out.ClientEmail,
	); err != nil {
		return SubscriptionWithClient{}, err
	}
	out.ID = pgxutil.UUIDToString(id)
	out.ClientID = pgxutil.UUIDToString(cid)
	out.PlanID = pgxutil.UUIDToString(pid)
	if len(nameRaw) > 0 {
		_ = json.Unmarshal(nameRaw, &out.PlanName)
	}
	if startedAt.Valid {
		out.StartedAt = startedAt.Time
	}
	if expiresAt.Valid {
		t := expiresAt.Time
		out.ExpiresAt = &t
	}
	if trialUntil.Valid {
		t := trialUntil.Time
		out.TrialUntil = &t
	}
	if cancelReason.Valid {
		v := cancelReason.String
		out.CancelReason = &v
	}
	if notes.Valid {
		v := notes.String
		out.Notes = &v
	}
	if createdAt.Valid {
		out.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		out.UpdatedAt = updatedAt.Time
	}
	return out, nil
}

func scanSubscriptionRow(r rowScanner, planSlug string, planName LocalizedString) (Subscription, error) {
	var (
		s                                Subscription
		id, cid, pid                     pgtype.UUID
		startedAt, expiresAt, trialUntil pgtype.Timestamptz
		createdAt, updatedAt             pgtype.Timestamptz
		cancelReason, notes              pgtype.Text
	)
	if err := r.Scan(
		&id, &cid, &pid, &s.Status, &startedAt, &expiresAt, &trialUntil,
		&cancelReason, &notes, &createdAt, &updatedAt,
	); err != nil {
		return Subscription{}, httpx.Internal("subscription_upsert_scan", err)
	}
	s.ID = pgxutil.UUIDToString(id)
	s.ClientID = pgxutil.UUIDToString(cid)
	s.PlanID = pgxutil.UUIDToString(pid)
	s.PlanSlug = planSlug
	s.PlanName = planName
	if startedAt.Valid {
		s.StartedAt = startedAt.Time
	}
	if expiresAt.Valid {
		t := expiresAt.Time
		s.ExpiresAt = &t
	}
	if trialUntil.Valid {
		t := trialUntil.Time
		s.TrialUntil = &t
	}
	if cancelReason.Valid {
		v := cancelReason.String
		s.CancelReason = &v
	}
	if notes.Valid {
		v := notes.String
		s.Notes = &v
	}
	if createdAt.Valid {
		s.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		s.UpdatedAt = updatedAt.Time
	}
	return s, nil
}
