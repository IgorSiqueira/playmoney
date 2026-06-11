import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2",
          "font-ui text-sm text-[var(--text-bright)] tracking-wide",
          "placeholder:text-[var(--text-muted)]",
          "focus-visible:outline-none focus-visible:border-[var(--neon)] focus-visible:shadow-[0_0_12px_rgba(0,128,255,0.25)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "transition-all duration-150",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
