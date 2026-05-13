// Osama API server entry point.
//
// Wires together config, database, redis, JWT keys, services, middleware,
// routes; starts a Fiber server and shuts it down cleanly on SIGINT/SIGTERM.
package main

import (
	"context"
	"errors"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/cache"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/clients"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/config"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/database"
	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/logger"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/middleware"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/routes"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		// Logger isn't ready yet; this is the one place we use stderr directly.
		println("config error:", err.Error())
		os.Exit(1)
	}

	log, err := logger.New(cfg.Env)
	if err != nil {
		println("logger init failed:", err.Error())
		os.Exit(1)
	}
	defer func() { _ = log.Sync() }()

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal("database_connect_failed", zap.Error(err))
	}
	defer pool.Close()
	log.Info("database_connected")

	rdb, err := cache.Connect(ctx, cfg.RedisURL)
	if err != nil {
		log.Fatal("redis_connect_failed", zap.Error(err))
	}
	defer func() { _ = rdb.Close() }()
	log.Info("redis_connected")

	priv, pub, err := auth.LoadKeys(cfg.JWTPrivateKeyPath, cfg.JWTPublicKeyPath)
	if err != nil {
		log.Fatal("jwt_keys_load_failed", zap.Error(err))
	}

	queries := db.New(pool)
	tokens := auth.NewTokenManager(priv, pub, cfg.JWTIssuer, cfg.AccessTokenTTL, cfg.RefreshTokenTTL, rdb)

	authSvc := auth.NewService(queries, tokens)
	authH := auth.NewHandler(authSvc, cfg)

	clientsSvc := clients.NewService(pool, queries)
	clientsH := clients.NewHandler(clientsSvc)

	if err := bootstrapAdmin(ctx, cfg, queries, log); err != nil {
		log.Warn("bootstrap_admin_skipped", zap.Error(err))
	}

	app := fiber.New(fiber.Config{
		AppName:               "osama-api",
		ReadTimeout:           10 * time.Second,
		WriteTimeout:          10 * time.Second,
		IdleTimeout:           60 * time.Second,
		BodyLimit:             10 * 1024 * 1024, // 10MB
		ErrorHandler:          middleware.ErrorHandler(log),
		DisableStartupMessage: cfg.IsProd(),
	})

	app.Use(middleware.RequestID())
	app.Use(middleware.CORS(cfg))
	app.Use(middleware.RequestLogger(log))
	app.Use(middleware.RateLimit(rdb, cfg.RateLimitPerMinute))

	routes.Register(app, routes.Deps{
		Queries: queries,
		Tokens:  tokens,
		Auth:    authH,
		Clients: clientsH,
	})

	// Serve in a goroutine so we can listen for shutdown signals.
	serverErr := make(chan error, 1)
	go func() {
		addr := ":" + cfg.Port
		log.Info("server_listening", zap.String("addr", addr))
		serverErr <- app.Listen(addr)
	}()

	select {
	case <-ctx.Done():
		log.Info("shutdown_requested")
	case err := <-serverErr:
		if err != nil {
			log.Fatal("server_error", zap.Error(err))
		}
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		log.Error("graceful_shutdown_failed", zap.Error(err))
	} else {
		log.Info("shutdown_complete")
	}
}

// bootstrapAdmin creates an admin user from BOOTSTRAP_ADMIN_EMAIL/PASSWORD
// on first boot. Skipped when either env var is empty or any admin already
// exists in the DB. Never fails the boot.
func bootstrapAdmin(ctx context.Context, cfg *config.Config, q *db.Queries, log *zap.Logger) error {
	if cfg.BootstrapAdminEmail == "" || cfg.BootstrapAdminPassword == "" {
		return errors.New("bootstrap env vars not set")
	}
	count, err := q.CountUsersByRole(ctx, string(auth.RoleAdmin))
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	if _, err := q.GetUserByEmail(ctx, strings.ToLower(strings.TrimSpace(cfg.BootstrapAdminEmail))); err == nil {
		return nil // user already exists, just not as admin — skip
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	hash, err := auth.HashPassword(cfg.BootstrapAdminPassword)
	if err != nil {
		return err
	}
	u, err := q.CreateUser(ctx, db.CreateUserParams{
		Email:        strings.ToLower(strings.TrimSpace(cfg.BootstrapAdminEmail)),
		PasswordHash: hash,
		Role:         string(auth.RoleAdmin),
	})
	if err != nil {
		return err
	}
	log.Info("bootstrap_admin_created", zap.String("email", u.Email))
	return nil
}
