import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  eyebrowColor?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  eyebrowColor = "var(--neon)",
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        {eyebrow && (
          <div
            className="font-ui text-[11px] font-semibold tracking-[0.2em] uppercase mb-1"
            style={{ color: eyebrowColor }}
          >
            ▸ {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">
          {title}
        </h1>
        {subtitle && (
          <p className="font-ui text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 mt-1">{action}</div>}
    </div>
  );
}
