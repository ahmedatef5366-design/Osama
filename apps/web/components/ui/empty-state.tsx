import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: "workout" | "nutrition" | "photos" | "checkin" | "messages" | "clients" | "data";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

const icons: Record<EmptyStateProps["icon"], React.ReactNode> = {
  workout: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="24" width="48" height="4" rx="2" fill="var(--text-3)" opacity="0.3" />
      <rect x="16" y="16" width="4" height="20" rx="2" fill="var(--accent)" opacity="0.5" />
      <rect x="44" y="16" width="4" height="20" rx="2" fill="var(--accent)" opacity="0.5" />
      <rect x="10" y="18" width="8" height="16" rx="3" fill="var(--text-3)" opacity="0.2" />
      <rect x="46" y="18" width="8" height="16" rx="3" fill="var(--text-3)" opacity="0.2" />
    </svg>
  ),
  nutrition: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="20" stroke="var(--text-3)" strokeWidth="2" opacity="0.3" />
      <path d="M32 12a20 20 0 0 1 0 40" fill="var(--accent)" opacity="0.2" />
      <circle cx="32" cy="32" r="8" fill="var(--text-3)" opacity="0.15" />
    </svg>
  ),
  photos: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="10" y="14" width="44" height="36" rx="4" stroke="var(--text-3)" strokeWidth="2" opacity="0.3" />
      <circle cx="24" cy="28" r="5" fill="var(--accent)" opacity="0.3" />
      <path d="M10 42l12-10 8 6 14-12 10 8v6a4 4 0 01-4 4H14a4 4 0 01-4-4v-2z" fill="var(--text-3)" opacity="0.2" />
    </svg>
  ),
  checkin: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="14" y="8" width="36" height="48" rx="4" stroke="var(--text-3)" strokeWidth="2" opacity="0.3" />
      <path d="M24 28l4 4 8-8" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <rect x="22" y="40" width="20" height="2" rx="1" fill="var(--text-3)" opacity="0.2" />
      <rect x="22" y="46" width="14" height="2" rx="1" fill="var(--text-3)" opacity="0.15" />
    </svg>
  ),
  messages: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M12 16h40a4 4 0 014 4v20a4 4 0 01-4 4H20l-8 8V20a4 4 0 014-4z" stroke="var(--text-3)" strokeWidth="2" opacity="0.3" />
      <rect x="22" y="28" width="20" height="2" rx="1" fill="var(--accent)" opacity="0.3" />
      <rect x="22" y="34" width="12" height="2" rx="1" fill="var(--text-3)" opacity="0.2" />
    </svg>
  ),
  clients: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="22" r="10" stroke="var(--text-3)" strokeWidth="2" opacity="0.3" />
      <path d="M14 52c0-10 8-18 18-18s18 8 18 18" stroke="var(--accent)" strokeWidth="2" opacity="0.3" />
    </svg>
  ),
  data: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="12" y="34" width="8" height="18" rx="2" fill="var(--text-3)" opacity="0.2" />
      <rect x="24" y="24" width="8" height="28" rx="2" fill="var(--accent)" opacity="0.3" />
      <rect x="36" y="28" width="8" height="24" rx="2" fill="var(--text-3)" opacity="0.2" />
      <rect x="48" y="18" width="8" height="34" rx="2" fill="var(--text-3)" opacity="0.15" />
    </svg>
  ),
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      <div className="mb-4">{icons[icon]}</div>
      <h3 className="text-lg font-semibold text-text-1">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-text-2">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
