import type { Envelope } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class APIError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** When true, response with a non-2xx will reject; otherwise returned as-is. */
  throwOnError?: boolean;
};

/**
 * Lightly-typed fetch wrapper for the Osama API. Always sends cookies so
 * the access/refresh cookies set at login flow naturally. Parses the
 * { data, error, code } envelope and surfaces APIError on failures.
 */
export async function api<T = unknown>(
  path: string,
  opts: FetchOptions = {},
): Promise<Envelope<T>> {
  const { body, headers, throwOnError = true, ...rest } = opts;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers as Record<string, string> | undefined),
    },
    body: body == null ? undefined : JSON.stringify(body),
  });

  let payload: Envelope<T> = {};
  // 204 No Content has no body
  if (res.status !== 204) {
    try {
      payload = (await res.json()) as Envelope<T>;
    } catch {
      payload = { error: "invalid_json_response", code: "invalid_response" };
    }
  }

  if (!res.ok && throwOnError) {
    throw new APIError(
      res.status,
      payload.code ?? `http_${res.status}`,
      payload.error ?? res.statusText,
    );
  }
  return payload;
}

/** Convenience: unwrap `data` from an envelope or throw. */
export async function apiData<T>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  const env = await api<T>(path, opts);
  if (env.data === undefined) {
    throw new APIError(500, env.code ?? "missing_data", env.error ?? "no data");
  }
  return env.data;
}
