import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "input-base w-full h-11 px-4 text-base rounded-md",
        "transition-[border-color,box-shadow,background] duration-200 ease-[var(--ease-in-out-soft)]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
