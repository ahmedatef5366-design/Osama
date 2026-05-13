import { type NextRequest, NextResponse } from "next/server";

/**
 * Route protection at the edge. Anyone hitting /admin/* or /client/* without
 * an access_token cookie is bounced to /login. We deliberately don't
 * *validate* the JWT here (no Node APIs in middleware, and we'd need to
 * fetch the public key) — we only check for presence. Real validation
 * happens against the API on every request.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/client");
  if (!isProtected) {
    return NextResponse.next();
  }
  const hasAccess = req.cookies.has("access_token");
  if (hasAccess) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Match everything except static assets and Next internals
  matcher: ["/((?!_next/static|_next/image|favicon|.*\\..*).*)"],
};
