"use client";

import { useEffect, useState, useTransition } from "react";
import { ShieldAlert, ShieldCheck, Eye, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RiskFlagRow {
  id: string;
  signal: string;
  score: number;
  detail: Record<string, unknown>;
  reviewedAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; suspendedAt: string | null };
}

const SIGNAL_LABELS: Record<string, string> = {
  BET_ACCURACY:     "Taxa de Acerto",
  WIN_RATE_SPIKE:   "Spike Win Rate",
  PARTY_RECURRENCE: "Recorrência de Party",
  WEAK_ENEMIES:     "Inimigos Recorrentes",
};

const SIGNAL_COLORS: Record<string, string> = {
  BET_ACCURACY:     "var(--danger)",
  WIN_RATE_SPIKE:   "var(--gold)",
  PARTY_RECURRENCE: "var(--purple)",
  WEAK_ENEMIES:     "var(--blue)",
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "var(--danger)" : score >= 50 ? "var(--gold)" : "var(--neon)";
  return (
    <span
      className="font-mono text-xs font-bold px-2 py-0.5 border"
      style={{ color, borderColor: color, background: `${color}18` }}
    >
      {score}
    </span>
  );
}

export default function AdminRiskPage() {
  const [flags, setFlags] = useState<RiskFlagRow[]>([]);
  const [showReviewed, setShowReviewed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const res = await fetch(`/api/admin/risk?reviewed=${showReviewed}`);
    if (res.ok) setFlags(await res.json());
  }

  useEffect(() => { void load(); }, [showReviewed]); // eslint-disable-line react-hooks/exhaustive-deps

  async function review(flagId: string) {
    startTransition(async () => {
      await fetch(`/api/admin/risk/${flagId}`, { method: "POST" });
      await load();
    });
  }

  async function suspend(flagId: string) {
    startTransition(async () => {
      await fetch(`/api/admin/risk/${flagId}`, { method: "PUT" });
      await load();
    });
  }

  const pending = flags.filter((f) => !f.reviewedAt);
  const reviewed = flags.filter((f) => f.reviewedAt);
  const shown = showReviewed ? reviewed : pending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="font-display text-[10px] tracking-[0.3em] text-[var(--danger)] uppercase mb-1">
          ▸ Detecção de Fraude
        </div>
        <h1 className="font-display text-3xl font-black tracking-tight text-[var(--text-bright)] uppercase">
          Risk <span className="text-[var(--danger)]">Flags</span>
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pendentes",  value: pending.length,  color: "var(--danger)" },
          { label: "Revisadas",  value: reviewed.length, color: "var(--neon)" },
          { label: "Suspensos",  value: flags.filter((f, i, a) => !f.reviewedAt && f.user.suspendedAt && a.findIndex(x => x.user.id === f.user.id) === i).length, color: "var(--gold)" },
          { label: "Score ≥ 70", value: pending.filter((f) => f.score >= 70).length, color: "var(--danger)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-1">{label}</div>
            <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Toggle */}
      <div className="flex gap-2">
        {["Pendentes", "Revisadas"].map((label, i) => (
          <button
            key={label}
            onClick={() => setShowReviewed(i === 1)}
            className="font-display text-[11px] tracking-widest uppercase px-3 py-1.5 border transition-all"
            style={{
              borderColor: (!showReviewed && i === 0) || (showReviewed && i === 1) ? "var(--neon)" : "var(--border)",
              color:       (!showReviewed && i === 0) || (showReviewed && i === 1) ? "var(--neon)" : "var(--text-muted)",
              background:  (!showReviewed && i === 0) || (showReviewed && i === 1) ? "var(--neon-dim)" : "transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {shown.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface-2)] p-8 text-center">
          <ShieldCheck size={32} className="mx-auto mb-3" style={{ color: "var(--neon)" }} />
          <p className="font-display text-sm tracking-widest text-[var(--text-muted)] uppercase">
            Nenhuma flag {showReviewed ? "revisada" : "pendente"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((flag) => (
            <div
              key={flag.id}
              className="bracket border border-[var(--border)] bg-[var(--surface-2)]"
              style={{ borderColor: flag.score >= 70 && !flag.reviewedAt ? "rgba(255,58,110,0.3)" : undefined }}
            >
              {/* Row */}
              <div className="flex items-center gap-4 p-4">
                {/* Signal */}
                <div className="shrink-0 w-36">
                  <div
                    className="font-display text-[11px] tracking-widest uppercase font-bold"
                    style={{ color: SIGNAL_COLORS[flag.signal] ?? "var(--text)" }}
                  >
                    {SIGNAL_LABELS[flag.signal] ?? flag.signal}
                  </div>
                </div>

                {/* Score */}
                <ScoreBadge score={flag.score} />

                {/* User */}
                <div className="flex-1 min-w-0">
                  <div className="font-ui text-sm font-semibold text-[var(--text-bright)] truncate">
                    {flag.user.name ?? "—"}
                    {flag.user.suspendedAt && (
                      <span className="ml-2 font-mono text-[11px] text-[var(--danger)] border border-[var(--danger)] px-1">SUSPENSO</span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)] truncate">{flag.user.email}</div>
                </div>

                {/* Date */}
                <div className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                  {formatDate(flag.createdAt)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpanded(expanded === flag.id ? null : flag.id)}
                    className="p-1.5 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--blue)] hover:border-[var(--blue)] transition-all"
                  >
                    <Eye size={13} />
                  </button>

                  {!flag.reviewedAt && (
                    <>
                      {!flag.user.suspendedAt && (
                        <button
                          onClick={() => suspend(flag.id)}
                          disabled={isPending}
                          className="font-display text-[11px] tracking-widest uppercase px-2 py-1.5 border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-dim)] transition-all disabled:opacity-50"
                        >
                          Suspender
                        </button>
                      )}
                      <button
                        onClick={() => review(flag.id)}
                        disabled={isPending}
                        className="font-display text-[11px] tracking-widest uppercase px-2 py-1.5 border border-[var(--neon)] text-[var(--neon)] hover:bg-[var(--neon-dim)] transition-all disabled:opacity-50"
                      >
                        Revisar ✓
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Detail expandido */}
              {expanded === flag.id && (
                <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--surface-1)]">
                  <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-2 flex items-center gap-2">
                    <AlertTriangle size={10} />
                    Detalhes do sinal
                  </div>
                  <pre className="font-mono text-[10px] text-[var(--text)] whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(flag.detail, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
