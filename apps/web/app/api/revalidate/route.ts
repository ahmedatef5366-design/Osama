import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CMS_TAG } from "@/lib/cms-shared";

/**
 * Webhook called by the Go API after a CMS write.
 * Body: { section: "<key>", tag: "site-content" }
 * Header: X-Revalidate-Secret must match NEXT_REVALIDATE_SECRET.
 *
 * Constant-time secret check; missing secret env is treated as "feature
 * disabled" → 503 so admin saves don't silently bypass auth.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.NEXT_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "revalidate_disabled" },
      { status: 503 },
    );
  }

  const got = req.headers.get("x-revalidate-secret") ?? "";
  if (!timingSafeEqual(got, secret)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: { section?: string; tag?: string } = {};
  try {
    body = (await req.json()) as { section?: string; tag?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  // Bust both the global CMS tag and the per-section tag so a single section
  // update doesn't invalidate the cache for unrelated sections.
  revalidateTag(body.tag ?? CMS_TAG);
  if (body.section) {
    revalidateTag(`cms:${body.section}`);
  }

  return NextResponse.json({ ok: true, section: body.section ?? null });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
