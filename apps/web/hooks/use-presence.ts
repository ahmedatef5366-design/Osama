"use client";

import { useState, useEffect, useRef } from "react";

type PresenceMap = Record<string, boolean>;

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export function usePresence(clientIds: string[]) {
  const [presence, setPresence] = useState<PresenceMap>({});
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (clientIds.length === 0) return;

    const token = localStorage.getItem("token") ?? "";
    const url = `${API}/api/presence/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("presence", (e) => {
      try {
        const data = JSON.parse(e.data) as PresenceMap;
        setPresence(data);
      } catch {
        /* ignore malformed */
      }
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [clientIds]);

  return presence;
}
