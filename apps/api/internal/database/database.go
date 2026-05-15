// Package database wraps pgxpool with sane production defaults.
package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(ctx context.Context, url string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		return nil, fmt.Errorf("parse database url: %w", err)
	}

	cfg.MaxConns = 20
	cfg.MinConns = 2
	cfg.MaxConnLifetime = time.Hour
	cfg.MaxConnIdleTime = 30 * time.Minute
	cfg.HealthCheckPeriod = time.Minute

	// PgBouncer transaction-mode pooling (Supabase's port-6543 pooler, RDS
	// Proxy, etc.) rotates server connections between client transactions, so
	// named prepared statements created on one server connection are missing
	// when the next transaction lands on a different one. pgx's default
	// QueryExecModeCacheStatement assumes a stable connection and trips over
	// this with `prepared statement "stmtcache_..." already exists`
	// (SQLSTATE 42P05). Switching to QueryExecModeExec uses the extended
	// protocol with unnamed prepared statements, which is the mode pgx
	// documents as PgBouncer-safe. Zeroing the caches makes sure we never
	// keep around any per-connection state that could leak across pooled
	// connections.
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeExec
	cfg.ConnConfig.StatementCacheCapacity = 0
	cfg.ConnConfig.DescriptionCacheCapacity = 0

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pgx pool: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}
	return pool, nil
}
