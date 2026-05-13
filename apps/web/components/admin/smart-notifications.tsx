"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";

type NotifPriority = "high" | "medium" | "low";

type SmartNotification = {
  id: string;
  type: "missed_checkin" | "low_compliance" | "goal_reached" | "message" | "weight_change" | "streak";
  clientName: string;
  message: string;
  priority: NotifPriority;
  timestamp: string;
  read: boolean;
};

type SmartNotificationsProps = {
  notifications: SmartNotification[];
  onDismiss?: (id: string) => void;
};

const slideIn: Variants = {
  hidden: { opacity: 0, x: 20, height: 0 },
  visible: { opacity: 1, x: 0, height: "auto", transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, height: 0, transition: { duration: 0.2 } },
};

const TYPE_ICONS: Record<SmartNotification["type"], string> = {
  missed_checkin: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  low_compliance: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z",
  goal_reached: "M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z",
  message: "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z",
  weight_change: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
  streak: "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z",
};

const PRIORITY_STYLES: Record<NotifPriority, string> = {
  high: "border-s-danger bg-danger/5",
  medium: "border-s-warning bg-warning/5",
  low: "border-s-info bg-info/5",
};

export function SmartNotifications({ notifications, onDismiss }: SmartNotificationsProps) {
  const sorted = [...notifications].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-display text-text-1 text-lg uppercase tracking-tight">Smart Alerts</h3>
        <span className="text-accent text-xs font-mono">
          {notifications.filter((n) => !n.read).length} new
        </span>
      </div>

      <AnimatePresence>
        {sorted.map((notif) => (
          <motion.div
            key={notif.id}
            variants={slideIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`flex items-start gap-3 px-4 py-3 border-s-2 border-b border-border last:border-b-0 ${PRIORITY_STYLES[notif.priority]} ${
              notif.read ? "opacity-60" : ""
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0 text-text-2"
            >
              <path d={TYPE_ICONS[notif.type]} />
            </svg>

            <div className="flex-1 min-w-0">
              <p className="text-text-1 text-sm">
                <span className="font-medium">{notif.clientName}</span>{" "}
                <span className="text-text-2">{notif.message}</span>
              </p>
              <p className="text-text-3 text-xs font-mono mt-0.5">{notif.timestamp}</p>
            </div>

            {onDismiss ? (
              <button
                type="button"
                onClick={() => onDismiss(notif.id)}
                className="text-text-3 hover:text-text-1 transition-colors shrink-0 p-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
