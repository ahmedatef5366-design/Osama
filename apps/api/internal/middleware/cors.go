package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/config"
)

// CORS returns a configured CORS middleware. Origins are an explicit
// allowlist — never "*". When AllowCredentials is true the spec forbids
// "*" anyway, so the explicit list is mandatory.
func CORS(cfg *config.Config) fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     strings.Join(cfg.CORSOrigins, ","),
		AllowMethods:     "GET,POST,PATCH,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Content-Type,Authorization,X-Request-ID",
		ExposeHeaders:    "X-Request-ID",
		AllowCredentials: true,
		MaxAge:           600,
	})
}
