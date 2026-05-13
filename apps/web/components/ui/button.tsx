import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "accent" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantStyles: Record<Variant, string> = {
  accent: "btn-accent font-semibold",
  ghost: "btn-ghost",
  outline:
    "bg-transparent text-text-1 border border-border hover:border-border-hover hover:bg-surface",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-md",
  md: "h-11 px-5 text-base rounded-md",
  lg: "h-14 px-7 text-lg rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "accent", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap",
        "transition-[transform,box-shadow,border-color,background] duration-200 ease-[var(--ease-out-expo)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
