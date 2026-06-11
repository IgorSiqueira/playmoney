import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest transition-colors",
  {
    variants: {
      variant: {
        default:
          "border border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)] shadow-[0_0_8px_rgba(0,255,157,0.2)]",
        secondary:
          "border border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-muted)]",
        destructive:
          "border border-[var(--danger)] bg-[var(--danger-dim)] text-[var(--danger)] shadow-[0_0_8px_rgba(255,58,110,0.2)]",
        warning:
          "border border-[var(--gold)] bg-[var(--gold-dim)] text-[var(--gold)] shadow-[0_0_8px_rgba(255,184,0,0.2)]",
        outline:
          "border border-[var(--border-mid)] text-[var(--text)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
