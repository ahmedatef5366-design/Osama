// Package config loads runtime configuration from environment variables.
// Everything has a zero-config dev default except the bits that MUST be secret
// (DATABASE_URL, REDIS_URL, JWT key paths) — those fail fast if missing in
// production.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Env  string
	Port string

	DatabaseURL string
	RedisURL    string

	JWTPrivateKeyPath string
	JWTPublicKeyPath  string
	// JWTPrivateKey / JWTPublicKey carry the PEM-encoded keypair when it's
	// injected via env vars instead of mounted to the filesystem. If both
	// are set, they take precedence over the *Path fields.
	JWTPrivateKey []byte
	JWTPublicKey  []byte
	JWTIssuer     string

	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration

	CookieDomain   string
	CookieSecure   bool
	CookieSameSite string

	CORSOrigins        []string
	RateLimitPerMinute int

	BootstrapAdminEmail    string
	BootstrapAdminPassword string

	// CMS→Web revalidate webhook. Empty URL = feature disabled.
	RevalidateURL    string
	RevalidateSecret string

	// Public origin of the Next.js app, used to assemble user-facing
	// links the API generates (invite URLs, etc.). Defaults to the
	// first CORS origin so dev works out of the box.
	WebBaseURL string
}

func Load() (*Config, error) {
	c := &Config{
		Env:                getEnv("ENV", "development"),
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		RedisURL:           os.Getenv("REDIS_URL"),
		JWTPrivateKeyPath:  getEnv("JWT_PRIVATE_KEY_PATH", "./keys/jwt_private.pem"),
		JWTPublicKeyPath:   getEnv("JWT_PUBLIC_KEY_PATH", "./keys/jwt_public.pem"),
		JWTPrivateKey:      []byte(os.Getenv("JWT_PRIVATE_KEY")),
		JWTPublicKey:       []byte(os.Getenv("JWT_PUBLIC_KEY")),
		JWTIssuer:          getEnv("JWT_ISSUER", "osama-api"),
		AccessTokenTTL:     getEnvDuration("ACCESS_TOKEN_TTL", 15*time.Minute),
		RefreshTokenTTL:    getEnvDuration("REFRESH_TOKEN_TTL", 30*24*time.Hour),
		// Empty = host-only cookies (no Domain attribute). Required when the API
		// is hosted under a Public Suffix List entry like `*.onrender.com`, where
		// any `Domain=.onrender.com` Set-Cookie is silently dropped by browsers.
		// Use `os.Getenv` directly so an explicit empty value wins over the
		// fallback (getEnv treats empty == unset).
		CookieDomain:       os.Getenv("COOKIE_DOMAIN"),
		CookieSecure:       getEnvBool("COOKIE_SECURE", false),
		CookieSameSite:     getEnv("COOKIE_SAMESITE", "lax"),
		CORSOrigins:        splitCSV(getEnv("CORS_ORIGINS", "http://localhost:3000")),
		RateLimitPerMinute: getEnvInt("RATE_LIMIT_PER_MINUTE", 100),

		BootstrapAdminEmail:    os.Getenv("BOOTSTRAP_ADMIN_EMAIL"),
		BootstrapAdminPassword: os.Getenv("BOOTSTRAP_ADMIN_PASSWORD"),

		RevalidateURL:    os.Getenv("NEXT_REVALIDATE_URL"),
		RevalidateSecret: os.Getenv("NEXT_REVALIDATE_SECRET"),

		WebBaseURL: getEnv("WEB_BASE_URL", ""),
	}
	if c.WebBaseURL == "" && len(c.CORSOrigins) > 0 {
		c.WebBaseURL = c.CORSOrigins[0]
	}

	if c.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if c.RedisURL == "" {
		return nil, fmt.Errorf("REDIS_URL is required")
	}
	if c.Env == "production" && !c.CookieSecure {
		return nil, fmt.Errorf("COOKIE_SECURE must be true in production")
	}
	return c, nil
}

// HasInlineJWTKeys reports whether the RS256 keypair was supplied directly
// via env vars (JWT_PRIVATE_KEY / JWT_PUBLIC_KEY) instead of file paths.
func (c *Config) HasInlineJWTKeys() bool {
	return len(c.JWTPrivateKey) > 0 && len(c.JWTPublicKey) > 0
}

// IsProd reports whether we're running in production mode.
func (c *Config) IsProd() bool { return c.Env == "production" }

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return b
}

func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return fallback
	}
	return d
}

func splitCSV(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
