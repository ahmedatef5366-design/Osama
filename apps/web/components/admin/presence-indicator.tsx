import { cn } from "@/lib/utils";

type PresenceIndicatorProps = {
  online: boolean;
  className?: string;
};

export function PresenceIndicator({ online, className }: PresenceIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full border-2 border-surface",
        online ? "bg-success" : "bg-text-3",
        className,
      )}
      aria-label={online ? "Online" : "Offline"}
    />
  );
}
