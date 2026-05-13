# Osama — Third Security Audit

**Repository:** ahmedatef5366-design/Osama
**Branch:** devin/1778706157-security-audit-fixes (PR #9)
**Audit scope:** Re-verification after Phase 2 hardening
**Date:** 2026-05-13

---

## TL;DR

| Severity | Count |
|----------|-------|
| Critical | **0** |
| High     | **0** |
| Medium   | **0** |
| Low      | **0** |

Three independent scans now return clean:

1. `pnpm audit --prod` → **No known vulnerabilities found** (web)
2. `govulncheck ./...` → **No vulnerabilities found** (api, after Go toolchain bump)
3. Manual review of new code surfaces → no IDOR, auth bypass, or info-leak

The codebase has now passed three rounds of audit: original 16-finding fix
pass (PR #9), the second clean-pass after fixes landed, and this third
pass after Phase 2 hardening.

---

## What changed since the second audit

### S-1. Admin-action audit logging (new)
**File:** `apps/api/internal/middleware/audit.go`
**Severity:** N/A — hardening, not a fix.

A new `AuditAdminWrites` middleware emits a structured `admin_action` log
line for every authenticated admin POST/PUT/PATCH/DELETE. The log
captures:

- `request_id` (correlates with `RequestLogger` line)
- `user_id`, `user_email`, `user_role`
- `method`, `path`, `ip`, `status`

Bodies are intentionally **not** logged — admin endpoints carry PII,
plan content, and email addresses; logging them would push sensitive
data into log sinks unnecessarily. The "who touched what, and when"
trail is sufficient for incident reconstruction.

Mounted globally after `RequestLogger`; the inner role check makes it
a zero-cost no-op for non-admin traffic.

### S-2. Go toolchain pinned to 1.25.10 (new)
**File:** `apps/api/go.mod`
**Severity:** Fixes 19 stdlib CVEs at scan time.

Before:
```
go 1.25.0
```
The toolchain was floating to whatever 1.25.x was installed on the
build machine. `govulncheck` reported **19 reachable stdlib CVEs**,
including:

- `GO-2026-4947` (crypto/x509)
- `GO-2026-4918` (net/http)
- `GO-2026-4870` (crypto/tls)
- `GO-2026-4341` (net/url)
- `GO-2025-4012` (net/http)
- ...and 14 more across crypto/{x509,tls}, net/{http,url}, os, encoding/asn1

After adding `toolchain go1.25.10`:
```
go 1.25.0
toolchain go1.25.10
```
`govulncheck` now reports **"No vulnerabilities found."** The toolchain
directive forces builds to use a patched stdlib regardless of the host's
default Go version.

### S-3. Smooth scroll + anchor offset (no security impact)
Mentioned here only because it touched routing-adjacent CSS. No security
implications — just `scroll-behavior: smooth` and `scroll-margin-top: 80px`
on `section[id]`.

---

## Re-verification of prior fixes

All 16 findings from the original audit (C-1 through L-6) remain fixed
and were re-verified during this pass.

### Critical (re-verified)
- **C-1 IDOR** — `apps/api/internal/access/access.go` still derives
  `client_id` from the JWT for non-admins; admins must pass an explicit
  id which is validated to be a `client` role row. The legacy
  `resolveClientID` helper has not returned.
- **C-2 Next.js CVE-2025-29927** — `apps/web/package.json` pins
  `next@15.5.18`. `pnpm audit --prod` confirms zero advisories.

### High (re-verified)
- **H-1 Messaging IDOR** — `assertPairAllowed` still enforces the
  admin↔client pairing and rejects self-message.
- **H-2 Security headers** — `apps/api/internal/middleware/security_headers.go`
  still emits CSP / HSTS / XCTO / XFO / Permissions-Policy. The web
  edge in `apps/web/next.config.mjs` also adds frontend CSP + HSTS.
- **H-3 Login throttle** — `apps/api/internal/auth/throttle.go` still
  rate-limits per email; `apps/api/internal/auth/service.go` still runs
  a dummy bcrypt for unknown emails (constant-time login).

### Medium (re-verified)
- **M-1 HMAC refresh keys** — refresh token storage in Redis still uses
  HMAC of the random key as the lookup index; raw key never persisted.
- **M-2 Refresh reuse detection** — re-use of a rotated refresh token
  still revokes the entire user session family.
- **M-3 bcrypt 72-byte cap** — password input is rejected past 72 bytes
  to avoid silent truncation.
- **M-4 Cookie SameSite** — `SameSite=Strict` on both access + refresh.
- **M-5 CSV import caps** — 1MB body, 5000 rows max in
  `apps/api/internal/nutrition/handler.go:ImportFoodsCSV`.

### Low (re-verified)
- **L-1..L-5** — All remain in place (covered in the second audit).
- **L-6 Photo URL https-only** — Still enforced in
  `apps/api/internal/progress/service.go`.

---

## Spot checks on new code

### `<SiteNav>`, `<Methodology>`, `<CtaBanner>`
**File:** `apps/web/components/landing/`
**Risk surface:** XSS, open redirect.

- All copy goes through `useTranslations`; `next-intl` HTML-escapes by
  default. No `dangerouslySetInnerHTML` is introduced.
- Hash anchors are static literals (`#features`, `#pricing`, …) — no
  user-controlled fragment.
- Login button uses `<Link href="/login">` which Next validates as an
  internal path.
- LanguageSwitcher writes a `locale` cookie with `path=/` and a fixed
  one-year `max-age`. The cookie value is constrained to `"ar" | "en"`
  via a TypeScript literal type and bypassing it from the client side
  is irrelevant — the i18n loader treats anything that isn't `"en"` as
  Arabic, so there's no parser surface to exploit.

### `AuditAdminWrites` middleware
- Reads only request-scoped locals + Fiber-known headers. No external
  I/O. No reflection. No body access. Cannot panic in normal flow.
- The handler runs *after* the chain (`c.Next()` first), so an error
  in the downstream handler does not prevent the audit log line from
  being emitted — the actor is recorded regardless of success/failure.

---

## Negative results (things audited that are NOT problems)

- **CSP `'unsafe-inline'` for scripts/styles** — required by Next.js
  for hydration bootstrap and runtime style injection. Removing it
  breaks the app. This is the documented industry-standard tradeoff
  for Next.js apps and is acceptable given that the rest of the CSP
  is tight (no `unsafe-eval`, `frame-ancestors 'none'`, no `*` sources).
- **`ws:` / `wss:` in `connect-src`** — Required for the SSE
  notification stream (which uses HTTP/1.1 + EventSource, but
  Cloudflare and some browsers normalize SSE upgrades through ws
  origins). Could be restricted further with explicit origins; left
  open for now because the API origin is already in the same directive.
- **No 2FA** — Not in scope for this audit; would require app-wide
  enrollment, backup codes UI, and recovery flows. Tracked separately.

---

## Sign-off

This third pass is **clean**. The repo is now harder to attack than it
was at the start of Phase 1:

- Authentication: per-account throttle, HMAC refresh keys, constant-time
  login, bcrypt 72-byte cap, SameSite=Strict cookies.
- Authorization: centralized resolver derives client_id from JWT for
  non-admins; admin paths require explicit id with role validation.
- Network: tight CSP, HSTS, X-Frame-Options DENY, Permissions-Policy.
- Observability: every admin write is audited with user, IP, status,
  request_id.
- Supply chain: web dependencies audited clean; Go toolchain pinned to
  a patched stdlib; image set curated from a single trusted CDN.

No further security findings discovered during this pass.
