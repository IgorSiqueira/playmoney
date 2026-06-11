import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        "border border-[var(--border)] bg-[var(--surface-2)]",
        className
      )}
    >
      {icon && (
        <div className="text-[var(--text-muted)] mb-4 opacity-40">{icon}</div>
      )}
      <div className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-bright)] mb-2">
        {title}
      </div>
      {description && (
        <p className="font-ui text-[13px] text-[var(--text-muted)] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
