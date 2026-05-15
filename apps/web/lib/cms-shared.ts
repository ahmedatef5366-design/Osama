/**
 * Bare fetcher for CMS sections, with no Next.js caching or cookie magic.
 * Shared between the cached `getSection` (server) and the admin
 * `getSectionAdmin` (which forwards cookies).
 */
import type { Section, SectionKey } from "@/types/cms";

export const CMS_TAG = "site-content";

// Server-side fetcher — bypasses the Next.js rewrite, so it must hit the API
// host directly via the server-only `API_INTERNAL_URL` env.
const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:8080";

type FetchOpts = {
  /** If set, included as a Cookie header (used by admin auth). */
  cookie?: string;
};

/**
 * Returns the parsed envelope or `null` when the API is unreachable / the
 * section doesn't exist. Logs to stderr in dev; quiet in prod so the build
 * doesn't fail when the API isn't running.
 */
export async function fetchSectionInner<K extends SectionKey>(
  key: K,
  opts: FetchOpts = {},
): Promise<Section<K> | null> {
  try {
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    if (opts.cookie) {
      headers.Cookie = opts.cookie;
    }
    const res = await fetch(`${API_BASE}/api/site-content/${key}`, {
      headers,
      // We let Next's outer cache wrapper handle revalidation.
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    const body = (await res.json()) as {
      data?: { key: SectionKey; content: unknown; updatedAt?: string; updatedBy?: string };
    };
    if (!body.data) return null;
    return {
      key: body.data.key as K,
      content: body.data.content,
      updatedAt: body.data.updatedAt ?? new Date().toISOString(),
      updatedBy: body.data.updatedBy,
    } as Section<K>;
  } catch {
    return null;
  }
}
