import "server-only";

import { cookies } from "next/headers";
import type { User } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Server-side: hit /api/auth/me with the incoming cookies, return the user
 * or null. Used by route layouts to gate access.
 *
 * Intentionally simple: a real refresh-on-401 flow happens client-side via
 * the api() wrapper; layouts that need a user should redirect to /login if
 * this returns null.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) return null;
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: { user?: User } };
  return body.data?.user ?? null;
}
