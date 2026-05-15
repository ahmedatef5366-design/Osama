import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Upstream Go API the Next.js server forwards /api/* and /healthz requests to.
 * This is a server-only var — the browser always talks to the Next.js origin
 * and never sees the API host directly, so cookies are first-party and the
 * Public Suffix List rules around `*.onrender.com` (which silently drop any
 * `Domain=.onrender.com` cookie) don't apply.
 *
 * For local dev this defaults to the standard Go server port. For Render set
 * `API_INTERNAL_URL=https://osama-api-sq1f.onrender.com` on the web service.
 */
const API_INTERNAL_URL = process.env.API_INTERNAL_URL || "http://localhost:8080";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy. Tight enough to block trivial XSS payloads,
 * loose enough for Next.js's runtime expectations:
 *  - `script-src 'self' 'unsafe-inline'` — Next ships small inline
 *    bootstrap scripts (hydration markers, RSC chunks). Pinning hashes
 *    is more brittle than the marginal security gain.
 *  - **Dev only:** we also allow `'unsafe-eval'` because Next.js HMR
 *    relies on `eval()`-style runtime compilation. Without it, every
 *    `"use client"` component fails to hydrate in `pnpm dev`. Stripped
 *    in production builds.
 *  - `style-src 'self' 'unsafe-inline'` — Tailwind + framer-motion both
 *    emit inline styles at runtime.
 *  - `img-src` allows Cloudinary + Unsplash + data: + blob: (for
 *    locally-rendered uploads).
 *  - `connect-src` allows the API origin and same-origin for SSE/WS.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.cloudinary.com https://res.cloudinary.com https://images.unsplash.com",
  // All /api/* and /healthz traffic now goes through the Next.js rewrite below,
  // so the browser only ever opens connections to its own origin. WebSockets
  // are still allowed for future SSE/streaming features.
  "connect-src 'self' ws: wss:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  images: {
    // Allow remote transformation images uploaded via the (future) Cloudinary
    // pipeline. Wildcarded by remotePatterns so we don't have to update on
    // every new cloud/account.
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    // Proxy API + health probes server-side to the Go API. Keeps the browser
    // origin a single host so authentication cookies are first-party and
    // CORS is sidestepped entirely.
    return [
      { source: "/api/:path*", destination: `${API_INTERNAL_URL}/api/:path*` },
      { source: "/healthz", destination: `${API_INTERNAL_URL}/healthz` },
    ];
  },
  async headers() {
    const headers = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Content-Security-Policy", value: csp },
    ];
    if (isProd) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
