import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "error" | "success" | "warning" | "info";

const cfg = {
  error:   { icon: XCircle,       color: "var(--danger)", border: "border-[var(--danger)]", bg: "bg-[var(--danger-dim)]" },
  success: { icon: CheckCircle2,  color: "var(--neon)",   border: "border-[var(--neon)]",   bg: "bg-[var(--neon-dim)]"   },
  warning: { icon: AlertTriangle, color: "var(--gold)",   border: "border-[var(--gold)]",   bg: "bg-[var(--gold-dim)]"   },
  info:    { icon: Info,          color: "var(--blue)",   border: "border-[var(--border-mid)]", bg: "bg-[var(--surface-2)]" },
} as const;

interface AlertBoxProps {
  variant: Variant;
  children: ReactNode;
  className?: string;
}

export function AlertBox({ variant, children, className }: AlertBoxProps) {
  const { icon: Icon, color, border, bg } = cfg[variant];
  return (
    <div className={cn("flex items-start gap-3 border px-3 py-2.5 rounded-none", border, bg, className)}>
      <Icon size={14} className="shrink-0 mt-0.5" style={{ color }} />
      <span className="font-ui text-sm leading-snug" style={{ color }}>{children}</span>
    </div>
  );
}
