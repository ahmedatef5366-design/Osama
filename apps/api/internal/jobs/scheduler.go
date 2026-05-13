package jobs

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/ws"
)

type Scheduler struct {
	pool *pgxpool.Pool
	hub  *ws.Hub
	log  *zap.Logger
	stop chan struct{}
}

func NewScheduler(pool *pgxpool.Pool, hub *ws.Hub, log *zap.Logger) *Scheduler {
	return &Scheduler{
		pool: pool,
		hub:  hub,
		log:  log,
		stop: make(chan struct{}),
	}
}

func (s *Scheduler) Start() {
	go s.runLoop()
}

func (s *Scheduler) Stop() {
	close(s.stop)
}

func (s *Scheduler) runLoop() {
	atRiskTicker := time.NewTicker(1 * time.Hour)
	checkinReminder := time.NewTicker(1 * time.Hour)
	defer atRiskTicker.Stop()
	defer checkinReminder.Stop()

	for {
		select {
		case <-s.stop:
			return
		case <-atRiskTicker.C:
			s.detectAtRisk()
		case <-checkinReminder.C:
			now := time.Now().UTC()
			if now.Hour() == 21 {
				s.sendCheckinReminders()
			}
		}
	}
}

func (s *Scheduler) detectAtRisk() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	rows, err := s.pool.Query(ctx,
		`SELECT c.id, c.user_id, c.name,
		        COALESCE(AVG(dc.diet_compliance), 0)::int AS avg_compliance
		 FROM clients c
		 LEFT JOIN daily_checkin dc ON dc.client_id = c.id
		   AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
		 WHERE c.is_active = true
		 GROUP BY c.id
		 HAVING COALESCE(AVG(dc.diet_compliance), 0) < 60`,
	)
	if err != nil {
		s.log.Error("at_risk_detection_failed", zap.Error(err))
		return
	}
	defer rows.Close()

	// Find admin users to notify
	var adminUserID pgtype.UUID
	err = s.pool.QueryRow(ctx,
		`SELECT id FROM users WHERE role = 'admin' LIMIT 1`,
	).Scan(&adminUserID)
	if err != nil {
		s.log.Warn("no_admin_found_for_at_risk_notification", zap.Error(err))
		return
	}

	for rows.Next() {
		var clientID, userID pgtype.UUID
		var name string
		var avgCompliance int
		if err := rows.Scan(&clientID, &userID, &name, &avgCompliance); err != nil {
			continue
		}

		// Create notification for admin
		_, err = s.pool.Exec(ctx,
			`INSERT INTO notifications (user_id, type, title, body)
			 VALUES ($1, 'at_risk', $2, $3)
			 ON CONFLICT DO NOTHING`,
			adminUserID, name+" - At Risk",
			"7-day compliance is "+string(rune('0'+avgCompliance/10))+string(rune('0'+avgCompliance%10))+"%",
		)
		if err != nil {
			s.log.Warn("at_risk_notification_insert_failed", zap.Error(err))
		}

		// Send real-time notification to admin via hub
		if adminUserID.Valid {
			adminUUID := uuid.UUID(adminUserID.Bytes)
			data, _ := json.Marshal(map[string]interface{}{
				"clientName":    name,
				"avgCompliance": avgCompliance,
			})
			s.hub.SendToUser(adminUUID, ws.WSMessage{
				Type: ws.TypeNotification,
				Data: data,
			})
		}
	}
}

func (s *Scheduler) sendCheckinReminders() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	rows, err := s.pool.Query(ctx,
		`SELECT c.user_id FROM clients c
		 WHERE c.is_active = true
		   AND NOT EXISTS (
		     SELECT 1 FROM daily_checkin dc
		     WHERE dc.client_id = c.id AND dc.checkin_date = CURRENT_DATE
		   )`,
	)
	if err != nil {
		s.log.Error("checkin_reminder_query_failed", zap.Error(err))
		return
	}
	defer rows.Close()

	for rows.Next() {
		var userID pgtype.UUID
		if err := rows.Scan(&userID); err != nil {
			continue
		}
		if userID.Valid {
			uid := uuid.UUID(userID.Bytes)
			data, _ := json.Marshal(map[string]string{
				"title": "Daily Check-in Reminder",
				"body":  "Don't forget to submit your daily check-in!",
			})
			s.hub.SendToUser(uid, ws.WSMessage{
				Type: ws.TypeNotification,
				Data: data,
			})
		}
	}
}
