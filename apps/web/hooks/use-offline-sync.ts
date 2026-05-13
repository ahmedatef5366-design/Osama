"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type QueueItem = {
  id: string;
  url: string;
  method: string;
  body: string;
  timestamp: number;
};

const STORAGE_KEY = "osama-offline-queue";

function loadQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueueItem[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(q: QueueItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
}

export function useOfflineSync() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [queue, setQueue] = useState<QueueItem[]>(loadQueue);
  const syncing = useRef(false);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const enqueue = useCallback(
    (url: string, method: string, body: unknown) => {
      const item: QueueItem = {
        id: crypto.randomUUID(),
        url,
        method,
        body: JSON.stringify(body),
        timestamp: Date.now(),
      };
      const next = [...queue, item];
      setQueue(next);
      saveQueue(next);
    },
    [queue],
  );

  const flush = useCallback(async () => {
    if (syncing.current || queue.length === 0) return;
    syncing.current = true;
    const remaining: QueueItem[] = [];

    for (const item of queue) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
          },
          body: item.body,
        });
      } catch {
        remaining.push(item);
      }
    }

    setQueue(remaining);
    saveQueue(remaining);
    syncing.current = false;
  }, [queue]);

  useEffect(() => {
    if (online && queue.length > 0) {
      flush();
    }
  }, [online, queue.length, flush]);

  return { online, queueSize: queue.length, enqueue, flush };
}
