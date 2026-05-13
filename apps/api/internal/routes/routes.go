// Package routes wires the HTTP layer. Everything Fiber-specific that
// isn't a handler implementation lives here, so handlers can stay focused
// on per-endpoint logic.
package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/checkin"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/clients"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/content"
	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/messaging"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/middleware"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/monitoring"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/nutrition"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/progress"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/workouts"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/ws"
)

// Deps bundles the runtime dependencies the route layer needs.
type Deps struct {
	Queries    *db.Queries
	Tokens     *auth.TokenManager
	Auth       *auth.Handler
	Clients    *clients.Handler
	Content    *content.Handler
	Workouts   *workouts.Handler
	Nutrition  *nutrition.Handler
	Progress   *progress.Handler
	Checkin    *checkin.Handler
	Messaging  *messaging.Handler
	Monitoring *monitoring.Handler
	Hub        *ws.Hub
}

// Register mounts every route on the supplied app.
func Register(app *fiber.App, d Deps) {
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	api := app.Group("/api")

	// ── Auth ────────────────────────────────────────────────
	authGroup := api.Group("/auth")
	authGroup.Post("/login", d.Auth.Login)
	authGroup.Post("/refresh", d.Auth.Refresh)
	authGroup.Post("/logout", d.Auth.Logout)
	authGroup.Get("/me",
		middleware.RequireAuth(d.Tokens, d.Queries),
		d.Auth.Me,
	)

	// ── Clients ─────────────────────────────────────────────
	clientsGroup := api.Group("/clients",
		middleware.RequireAuth(d.Tokens, d.Queries),
	)
	// /me must be declared BEFORE /:id, otherwise Fiber matches "me" as id.
	clientsGroup.Get("/me",
		middleware.RequireRole(auth.RoleClient),
		d.Clients.Me,
	)
	clientsGroup.Get("",
		middleware.RequireRole(auth.RoleAdmin),
		d.Clients.List,
	)
	clientsGroup.Post("",
		middleware.RequireRole(auth.RoleAdmin),
		d.Clients.Create,
	)
	clientsGroup.Get("/:id", d.Clients.Get) // admin or self — checked inside handler
	clientsGroup.Patch("/:id",
		middleware.RequireRole(auth.RoleAdmin),
		d.Clients.Patch,
	)

	// Client-scoped workout + nutrition shortcuts. These live under
	// /api/clients/:id/... and are admin-only.
	if d.Workouts != nil {
		clientsGroup.Get("/:id/workout-plan",
			middleware.RequireRole(auth.RoleAdmin),
			d.Workouts.GetClientActivePlan,
		)
		clientsGroup.Post("/:id/workout-plan",
			middleware.RequireRole(auth.RoleAdmin),
			d.Workouts.CreateClientPlan,
		)
		clientsGroup.Get("/:id/workout-plans",
			middleware.RequireRole(auth.RoleAdmin),
			d.Workouts.ListPlans,
		)
	}
	if d.Nutrition != nil {
		clientsGroup.Get("/:id/nutrition-plan",
			middleware.RequireRole(auth.RoleAdmin),
			d.Nutrition.GetClientActivePlan,
		)
		clientsGroup.Post("/:id/nutrition-plan",
			middleware.RequireRole(auth.RoleAdmin),
			d.Nutrition.CreateClientPlan,
		)
		clientsGroup.Get("/:id/nutrition-plans",
			middleware.RequireRole(auth.RoleAdmin),
			d.Nutrition.ListPlans,
		)
	}

	// ── Site content (CMS) ─────────────────────────────────
	if d.Content != nil {
		api.Get("/site-content/:section", d.Content.GetPublic)

		cmsAdmin := api.Group("/site-content",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		cmsAdmin.Get("", d.Content.List)
		cmsAdmin.Put("/:section", d.Content.Upsert)
		cmsAdmin.Get("/:section/history", d.Content.History)
		cmsAdmin.Post("/:section/rollback", d.Content.Rollback)
	}

	// ── Exercise library (admin curated; readable by authed users) ──
	if d.Workouts != nil {
		lib := api.Group("/exercise-library",
			middleware.RequireAuth(d.Tokens, d.Queries),
		)
		lib.Get("", d.Workouts.ListLibrary)
		lib.Get("/:id", d.Workouts.GetLibrary)
		libAdmin := api.Group("/exercise-library",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		libAdmin.Post("", d.Workouts.CreateLibrary)
		libAdmin.Patch("/:id", d.Workouts.PatchLibrary)
		libAdmin.Delete("/:id", d.Workouts.DeleteLibrary)

		// ── Workout plans / days / exercises ────────────────────
		plans := api.Group("/workout-plans",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		plans.Get("/:id", d.Workouts.GetPlan)
		plans.Patch("/:id", d.Workouts.PatchPlan)
		plans.Delete("/:id", d.Workouts.DeletePlan)
		plans.Post("/:id/days", d.Workouts.CreateDay)
		plans.Post("/:id/save-as-template", d.Workouts.SnapshotAsTemplate)

		days := api.Group("/workout-days",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		days.Patch("/:id", d.Workouts.PatchDay)
		days.Delete("/:id", d.Workouts.DeleteDay)
		days.Post("/:id/exercises", d.Workouts.CreateExercise)

		exercises := api.Group("/workout-exercises",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		exercises.Patch("/:id", d.Workouts.PatchExercise)
		exercises.Delete("/:id", d.Workouts.DeleteExercise)

		// ── Templates ────────────────────────────────────────────
		tmpl := api.Group("/workout-templates",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		tmpl.Get("", d.Workouts.ListTemplates)
		tmpl.Post("", d.Workouts.CreateTemplate)
		tmpl.Delete("/:id", d.Workouts.DeleteTemplate)
		tmpl.Post("/:id/apply", d.Workouts.ApplyTemplate)

		// ── Workout logs ─────────────────────────────────────────
		logs := api.Group("/workout-logs",
			middleware.RequireAuth(d.Tokens, d.Queries),
		)
		logs.Get("", middleware.RequireRole(auth.RoleAdmin), d.Workouts.ListLogs)
		logs.Post("", middleware.RequireRole(auth.RoleAdmin), d.Workouts.CreateLog)
		logs.Get("/:clientId/latest",
			middleware.RequireRole(auth.RoleAdmin),
			d.Workouts.GetLatestLog,
		)
	}

	// ── Nutrition ─────────────────────────────────────────────
	if d.Nutrition != nil {
		np := api.Group("/nutrition-plans",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		np.Get("/:id", d.Nutrition.GetPlan)
		np.Patch("/:id", d.Nutrition.PatchPlan)
		np.Delete("/:id", d.Nutrition.DeletePlan)
		np.Post("/:id/meals", d.Nutrition.CreateMeal)

		meals := api.Group("/meals",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		meals.Patch("/:id", d.Nutrition.PatchMeal)
		meals.Delete("/:id", d.Nutrition.DeleteMeal)

		// Food DB — search is open to any authed user; mutations admin-only.
		food := api.Group("/food-database",
			middleware.RequireAuth(d.Tokens, d.Queries),
		)
		food.Get("", d.Nutrition.SearchFoods)
		food.Get("/:id", d.Nutrition.GetFood)
		foodAdmin := api.Group("/food-database",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		foodAdmin.Post("", d.Nutrition.CreateFood)
		foodAdmin.Post("/import", d.Nutrition.ImportFoodsCSV)
		foodAdmin.Patch("/:id", d.Nutrition.PatchFood)
		foodAdmin.Delete("/:id", d.Nutrition.DeleteFood)

		// Food log — admin in Phase 3; client-self routes will be added later.
		flog := api.Group("/food-log",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		flog.Get("", d.Nutrition.ListFoodLog)
		flog.Get("/sum", d.Nutrition.SumFoodLog)
		flog.Post("", d.Nutrition.CreateFoodLog)
		flog.Delete("/:id", d.Nutrition.DeleteFoodLog)

		// Macro calculator — pure compute, admin-only entry point.
		api.Post("/macros/calc",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
			d.Nutrition.CalcMacros,
		)
	}

	// ── Progress tracking ──────────────────────────────────────
	if d.Progress != nil {
		progressGroup := api.Group("/weight",
			middleware.RequireAuth(d.Tokens, d.Queries),
		)
		progressGroup.Post("", d.Progress.LogWeight)
		progressGroup.Get("", d.Progress.ListWeight)

		measurements := api.Group("/measurements",
			middleware.RequireAuth(d.Tokens, d.Queries),
		)
		measurements.Post("", d.Progress.LogMeasurement)
		measurements.Get("", d.Progress.ListMeasurements)

		photos := api.Group("/photos",
			middleware.RequireAuth(d.Tokens, d.Queries),
		)
		photos.Post("", d.Progress.UploadPhoto)
		photos.Get("", d.Progress.ListPhotos)
		photos.Delete("/:id", d.Progress.DeletePhoto)
	}

	// ── Check-in ───────────────────────────────────────────────
	if d.Checkin != nil {
		checkinGroup := api.Group("/checkin",
			middleware.RequireAuth(d.Tokens, d.Queries),
		)
		checkinGroup.Post("", d.Checkin.Submit)
		checkinGroup.Get("", d.Checkin.Get)
		checkinGroup.Get("/history", d.Checkin.List)
		checkinGroup.Get("/summary", d.Checkin.Summary)

		// Admin: at-risk
		api.Get("/admin/at-risk",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
			d.Checkin.AtRisk,
		)
	}

	// ── Messages ───────────────────────────────────────────────
	if d.Messaging != nil {
		msgGroup := api.Group("/messages",
			middleware.RequireAuth(d.Tokens, d.Queries),
		)
		msgGroup.Post("", d.Messaging.Send)
		msgGroup.Get("/:userId", d.Messaging.ListThread)

		notifGroup := api.Group("/notifications",
			middleware.RequireAuth(d.Tokens, d.Queries),
		)
		notifGroup.Get("", d.Messaging.ListNotifications)
		notifGroup.Get("/count", d.Messaging.CountUnread)
		notifGroup.Post("/read-all", d.Messaging.MarkAllNotificationsRead)
		notifGroup.Post("/:id/read", d.Messaging.MarkNotificationRead)
	}

	// ── Monitoring (admin dashboard) ───────────────────────────
	if d.Monitoring != nil {
		adminGroup := api.Group("/admin",
			middleware.RequireAuth(d.Tokens, d.Queries),
			middleware.RequireRole(auth.RoleAdmin),
		)
		adminGroup.Get("/monitoring", d.Monitoring.Dashboard)
		adminGroup.Get("/monitoring/compliance-trend", d.Monitoring.ComplianceTrend)
		adminGroup.Get("/monitoring/top-clients", d.Monitoring.TopClients)
		adminGroup.Get("/monitoring/checkins-per-day", d.Monitoring.CheckinsPerDay)
	}

	// ── SSE (real-time notifications) ──────────────────────────
	if d.Hub != nil {
		api.Get("/sse/notifications",
			middleware.RequireAuth(d.Tokens, d.Queries),
			d.Hub.SSENotifications,
		)
	}
}
