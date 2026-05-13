"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type ActivityEvent = {
  id: string;
  clientName: string;
  type: "checkin" | "workout" | "photo" | "message" | "weight";
  timestamp: string;
};

type ActivityFeedProps = {
  events: ActivityEvent[];
};

const typeIcons: Record<ActivityEvent["type"], string> = {
  checkin: "📋",
  workout: "🏋️",
  photo: "📸",
  message: "💬",
  weight: "⚖️",
};

const typeColors: Record<ActivityEvent["type"], string> = {
  checkin: "bg-success/20",
  workout: "bg-accent/20",
  photo: "bg-info/20",
  message: "bg-warning/20",
  weight: "bg-danger/20",
};

export function ActivityFeed({ events }: ActivityFeedProps) {
  const t = useTranslations("admin.activity");

  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-text-2">{t("empty")}</p>;
  }

  return (
    <div className="space-y-1">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-surface-high"
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm",
              typeColors[event.type],
            )}
          >
            {typeIcons[event.type]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-text-1">
              {event.clientName}
            </p>
            <p className="text-xs text-text-2">{t(event.type)}</p>
          </div>
          <span className="text-[10px] text-text-3 whitespace-nowrap">
            {formatRelativeTime(event.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
