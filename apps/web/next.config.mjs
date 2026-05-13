import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * The API origin the browser talks to for /api/* fetches. We allow it in
 * connect-src so the CSP doesn't block legitimate cross-origin XHRs.
 * Falls back to the local dev API URL.
 */
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Content-Security-Policy. Tight enough to block trivial XSS payloads,
 * loose enough for Next.js's runtime expectations:
 *  - `script-src 'self' 'unsafe-inline'` — Next ships small inline
 *    bootstrap scripts (hydration markers, RSC chunks). Pinning hashes
 *    is more brittle than the marginal security gain.
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
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.cloudinary.com https://res.cloudinary.com https://images.unsplash.com",
  `connect-src 'self' ${API_ORIGIN} ws: wss:`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const isProd = process.env.NODE_ENV === "production";

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
