import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  glass?: boolean;
  interactive?: boolean;
};

export function Card({ className, glass, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border",
        glass ? "glass-elevated" : "bg-surface",
        interactive && "card-interactive cursor-pointer",
        "transition-colors duration-200 ease-[var(--ease-in-out)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-3", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-text-2 text-sm uppercase tracking-[0.12em] font-medium",
        className,
      )}
      {...props}
    />
  );
}
