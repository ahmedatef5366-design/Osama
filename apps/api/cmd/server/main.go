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

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/access"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auditlog"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/branding"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/cache"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/checkin"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/clients"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/config"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/content"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/database"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/dataexport"
	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/invites"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/jobs"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/logger"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/messaging"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/middleware"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/monitoring"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/nutrition"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/progress"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/routes"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/subscriptions"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/templates"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/workouts"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/ws"
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

	// Per-account login throttle. The lockout window doubles per failure
	// past the threshold (1m, 2m, 4m, …) up to 30m. Backed by Redis so it
	// survives across replicas.
	loginThrottle := auth.NewLoginThrottle(rdb, 5, time.Minute, 30*time.Minute)
	authSvc := auth.NewService(queries, tokens).WithThrottle(loginThrottle)
	authH := auth.NewHandler(authSvc, cfg)

	clientsSvc := clients.NewService(pool, queries)
	clientsH := clients.NewHandler(clientsSvc)

	revalidator := content.NewRevalidator(cfg.RevalidateURL, cfg.RevalidateSecret, log)
	contentSvc := content.NewService(pool, queries, rdb, revalidator)
	contentH := content.NewHandler(contentSvc)

	workoutsSvc := workouts.NewService(pool, queries)
	workoutsH := workouts.NewHandler(workoutsSvc)

	nutritionSvc := nutrition.NewService(pool, queries)
	nutritionH := nutrition.NewHandler(nutritionSvc)

	resolver := access.NewResolver(queries)

	progressSvc := progress.NewService(pool)
	progressH := progress.NewHandler(progressSvc, resolver)

	checkinSvc := checkin.NewService(pool)
	checkinH := checkin.NewHandler(checkinSvc, resolver)

	messagingSvc := messaging.NewService(pool, queries)
	messagingH := messaging.NewHandler(messagingSvc)

	monitoringH := monitoring.NewHandler(pool)

	subscriptionsSvc := subscriptions.NewService(pool)
	subscriptionsH := subscriptions.NewHandler(subscriptionsSvc, resolver)

	templatesSvc := templates.NewService(pool)
	templatesH := templates.NewHandler(templatesSvc)

	brandingSvc := branding.NewService(pool)
	brandingH := branding.NewHandler(brandingSvc)

	invitesSvc := invites.NewService(pool, queries)
	invitesH := invites.NewHandler(invitesSvc, cfg.WebBaseURL)

	auditSvc := auditlog.NewService(pool)
	auditH := auditlog.NewHandler(auditSvc)

	dataExportSvc := dataexport.NewService(pool)
	dataExportH := dataexport.NewHandler(dataExportSvc, resolver)

	hub := ws.NewHub()
	go hub.Run()

	scheduler := jobs.NewScheduler(pool, hub, log)
	scheduler.Start()

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
	app.Use(middleware.SecurityHeaders(cfg))
	app.Use(middleware.CORS(cfg))
	app.Use(middleware.RequestLogger(log))
	app.Use(middleware.AuditAdminWrites(log, auditSvc))
	app.Use(middleware.RateLimit(rdb, cfg.RateLimitPerMinute))

	routes.Register(app, routes.Deps{
		Queries:       queries,
		Tokens:        tokens,
		Auth:          authH,
		Clients:       clientsH,
		Content:       contentH,
		Workouts:      workoutsH,
		Nutrition:     nutritionH,
		Progress:      progressH,
		Checkin:       checkinH,
		Messaging:     messagingH,
		Monitoring:    monitoringH,
		Subscriptions: subscriptionsH,
		Templates:     templatesH,
		Branding:      brandingH,
		Invites:       invitesH,
		AuditLog:      auditH,
		DataExport:    dataExportH,
		Hub:           hub,
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
