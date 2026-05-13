import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const COLORS = [
  "bg-accent/20 text-accent",
  "bg-info/20 text-info",
  "bg-success/20 text-success",
  "bg-warning/20 text-warning",
  "bg-danger/20 text-danger",
];

const sizes: Record<string, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colorIndex = hashCode(name) % COLORS.length;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold select-none",
        sizes[size],
        COLORS[colorIndex],
        className,
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
