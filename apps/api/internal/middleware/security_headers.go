package middleware

import (
	"github.com/gofiber/fiber/v2"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/config"
)

// SecurityHeaders adds a baseline set of defensive HTTP response headers
// to every API response. These headers are cheap to set, hard to get
// wrong, and meaningfully reduce the blast radius of a number of common
// bugs (XSS, clickjacking, MIME sniffing, downgrade attacks).
//
// The header values are intentionally conservative — the API serves JSON
// only, so a restrictive CSP is fine; it has no inline UI to protect.
func SecurityHeaders(cfg *config.Config) fiber.Handler {
	// Mark every API response as JSON-only with the strictest CSP we can
	// reasonably emit. The API never serves HTML, so `default-src 'none'`
	// is correct — the browser will refuse to render anything we send by
	// accident as a page.
	const csp = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"

	return func(c *fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("Referrer-Policy", "no-referrer")
		c.Set("Cross-Origin-Resource-Policy", "same-origin")
		c.Set("Cross-Origin-Opener-Policy", "same-origin")
		c.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
		c.Set("Content-Security-Policy", csp)

		// HSTS is only emitted in production. We still want plain-HTTP
		// to work in dev to keep onboarding painless.
		if cfg.IsProd() {
			c.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		}

		return c.Next()
	}
}
