import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-display text-xs font-bold tracking-widest uppercase transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--neon)] disabled:pointer-events-none disabled:opacity-30 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--neon)] text-white hud-clip shadow-[0_0_16px_rgba(0,128,255,0.45)] hover:shadow-[0_0_28px_rgba(0,128,255,0.7)] hover:brightness-110 active:scale-[0.97]",
        destructive:
          "bg-[var(--danger)] text-white hud-clip shadow-[0_0_16px_rgba(255,58,110,0.35)] hover:shadow-[0_0_28px_rgba(255,58,110,0.6)] active:scale-[0.97]",
        outline:
          "border border-[var(--neon)] text-[var(--neon)] bg-transparent hover:bg-[var(--neon-dim)] hover:shadow-[0_0_16px_rgba(0,128,255,0.2)] active:scale-[0.97]",
        secondary:
          "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--border-mid)] hover:text-[var(--neon)] active:scale-[0.97]",
        ghost:
          "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
        danger:
          "border border-[var(--danger)] text-[var(--danger)] bg-transparent hover:bg-[var(--danger-dim)] active:scale-[0.97]",
        gold: "bg-[var(--gold)] text-[#030508] hud-clip shadow-[0_0_16px_rgba(255,184,0,0.4)] hover:shadow-[0_0_28px_rgba(255,184,0,0.65)] active:scale-[0.97]",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-3 text-[11px]",
        lg: "h-12 px-8 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
