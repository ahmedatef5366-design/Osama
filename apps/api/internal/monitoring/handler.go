package monitoring

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

type DashboardStats struct {
	ActiveClients int `json:"activeClients"`
	AvgCompliance int `json:"avgCompliance"`
	AtRiskClients int `json:"atRiskClients"`
	TodayCheckins int `json:"todayCheckins"`
}

type ComplianceTrendPoint struct {
	Day           string `json:"day"`
	AvgCompliance int    `json:"avgCompliance"`
	CheckinCount  int    `json:"checkinCount"`
}

type TopClient struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	AvgCompliance int    `json:"avgCompliance"`
}

type CheckinsPerDay struct {
	Day   string `json:"day"`
	Count int    `json:"count"`
}

type Handler struct {
	pool *pgxpool.Pool
}

func NewHandler(pool *pgxpool.Pool) *Handler { return &Handler{pool: pool} }

func (h *Handler) Dashboard(c *fiber.Ctx) error {
	stats, err := h.getStats(c.UserContext())
	if err != nil {
		return err
	}
	return httpx.OK(c, stats)
}

func (h *Handler) ComplianceTrend(c *fiber.Ctx) error {
	rows, err := h.pool.Query(c.UserContext(),
		`SELECT dc.checkin_date::date AS day,
		        COALESCE(AVG(dc.diet_compliance), 0)::int AS avg_compliance,
		        COUNT(dc.id)::int AS checkin_count
		 FROM daily_checkin dc
		 JOIN clients c ON c.id = dc.client_id AND c.is_active = true
		 WHERE dc.checkin_date >= CURRENT_DATE - INTERVAL '30 days'
		 GROUP BY dc.checkin_date
		 ORDER BY dc.checkin_date ASC`,
	)
	if err != nil {
		return httpx.Internal("compliance_trend_failed", err)
	}
	defer rows.Close()

	var out []ComplianceTrendPoint
	for rows.Next() {
		var day time.Time
		var p ComplianceTrendPoint
		if err := rows.Scan(&day, &p.AvgCompliance, &p.CheckinCount); err != nil {
			return httpx.Internal("trend_scan_failed", err)
		}
		p.Day = day.Format("2006-01-02")
		out = append(out, p)
	}
	if out == nil {
		out = []ComplianceTrendPoint{}
	}
	return httpx.OK(c, out)
}

func (h *Handler) TopClients(c *fiber.Ctx) error {
	rows, err := h.pool.Query(c.UserContext(),
		`SELECT c.id, c.name,
		        COALESCE(AVG(dc.diet_compliance), 0)::int AS avg_compliance
		 FROM clients c
		 LEFT JOIN daily_checkin dc ON dc.client_id = c.id
		   AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
		 WHERE c.is_active = true
		 GROUP BY c.id, c.name
		 ORDER BY avg_compliance DESC
		 LIMIT 5`,
	)
	if err != nil {
		return httpx.Internal("top_clients_failed", err)
	}
	defer rows.Close()

	var out []TopClient
	for rows.Next() {
		var id pgtype.UUID
		var t TopClient
		if err := rows.Scan(&id, &t.Name, &t.AvgCompliance); err != nil {
			return httpx.Internal("top_scan_failed", err)
		}
		if id.Valid {
			b := id.Bytes
			t.ID = formatUUID(b)
		}
		out = append(out, t)
	}
	if out == nil {
		out = []TopClient{}
	}
	return httpx.OK(c, out)
}

func (h *Handler) CheckinsPerDay(c *fiber.Ctx) error {
	rows, err := h.pool.Query(c.UserContext(),
		`SELECT checkin_date::date AS day, COUNT(*)::int AS count
		 FROM daily_checkin
		 WHERE checkin_date >= CURRENT_DATE - INTERVAL '30 days'
		 GROUP BY checkin_date
		 ORDER BY checkin_date ASC`,
	)
	if err != nil {
		return httpx.Internal("checkins_per_day_failed", err)
	}
	defer rows.Close()

	var out []CheckinsPerDay
	for rows.Next() {
		var day time.Time
		var cp CheckinsPerDay
		if err := rows.Scan(&day, &cp.Count); err != nil {
			return httpx.Internal("cpd_scan_failed", err)
		}
		cp.Day = day.Format("2006-01-02")
		out = append(out, cp)
	}
	if out == nil {
		out = []CheckinsPerDay{}
	}
	return httpx.OK(c, out)
}

func (h *Handler) getStats(ctx context.Context) (DashboardStats, error) {
	var stats DashboardStats
	err := h.pool.QueryRow(ctx, `SELECT COUNT(*)::int FROM clients WHERE is_active = true`).Scan(&stats.ActiveClients)
	if err != nil {
		return stats, httpx.Internal("count_active_failed", err)
	}
	err = h.pool.QueryRow(ctx,
		`SELECT COALESCE(AVG(dc.diet_compliance), 0)::int
		 FROM daily_checkin dc
		 JOIN clients c ON c.id = dc.client_id
		 WHERE c.is_active = true
		   AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'`,
	).Scan(&stats.AvgCompliance)
	if err != nil {
		return stats, httpx.Internal("avg_compliance_failed", err)
	}
	err = h.pool.QueryRow(ctx,
		`SELECT COUNT(*)::int FROM (
		   SELECT c.id
		   FROM clients c
		   LEFT JOIN daily_checkin dc ON dc.client_id = c.id
		     AND dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
		   WHERE c.is_active = true
		   GROUP BY c.id
		   HAVING COALESCE(AVG(dc.diet_compliance), 0) < 60
		 ) sub`,
	).Scan(&stats.AtRiskClients)
	if err != nil {
		return stats, httpx.Internal("count_at_risk_failed", err)
	}
	err = h.pool.QueryRow(ctx,
		`SELECT COUNT(*)::int FROM daily_checkin WHERE checkin_date = CURRENT_DATE`,
	).Scan(&stats.TodayCheckins)
	if err != nil {
		return stats, httpx.Internal("count_today_checkins_failed", err)
	}
	return stats, nil
}

func formatUUID(b [16]byte) string {
	const hextable = "0123456789abcdef"
	buf := make([]byte, 36)
	idx := 0
	for i, v := range b {
		if i == 4 || i == 6 || i == 8 || i == 10 {
			buf[idx] = '-'
			idx++
		}
		buf[idx] = hextable[v>>4]
		buf[idx+1] = hextable[v&0x0f]
		idx += 2
	}
	return string(buf)
}
