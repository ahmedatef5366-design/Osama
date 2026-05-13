// Package routes wires the HTTP layer. Everything Fiber-specific that
// isn't a handler implementation lives here, so handlers can stay focused
// on per-endpoint logic.
package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/clients"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/content"
	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/middleware"
)

// Deps bundles the runtime dependencies the route layer needs.
type Deps struct {
	Queries *db.Queries
	Tokens  *auth.TokenManager
	Auth    *auth.Handler
	Clients *clients.Handler
	Content *content.Handler
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

	// ── Site content (CMS) ─────────────────────────────────
	// Public GET drives the landing page server-side render; everything
	// else is admin-only.
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
}
