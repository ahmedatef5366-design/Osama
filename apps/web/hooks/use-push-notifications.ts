"use client";

import { useState, useCallback } from "react";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY ?? "";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );
  const [subscription, setSubscription] =
    useState<PushSubscription | null>(null);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_KEY,
    });

    setSubscription(sub);

    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    await fetch(`${API}/api/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
      },
      body: JSON.stringify(sub.toJSON()),
    });
  }, []);

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
    }
  }, [subscription]);

  return { permission, subscription, subscribe, unsubscribe };
}
