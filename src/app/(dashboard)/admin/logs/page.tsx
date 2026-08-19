"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

interface LogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  SUSPEND_USER:              { label: "Suspender usuário",        color: "var(--danger)" },
  UNSUSPEND_USER:            { label: "Reativar usuário",         color: "var(--neon)" },
  BLOCK_DEPOSITS:            { label: "Bloquear depósitos",       color: "var(--danger)" },
  UNBLOCK_DEPOSITS:          { label: "Desbloquear depósitos",    color: "var(--neon)" },
  SET_DEPOSIT_LIMIT:         { label: "Limite de depósito",       color: "var(--gold)" },
  ADJUST_BALANCE:            { label: "Ajuste de saldo",          color: "var(--gold)" },
  CANCEL_BET:                { label: "Cancelar aposta",          color: "var(--danger)" },
  PLATFORM_MAINTENANCE_ON:   { label: "Manutenção ativada",       color: "var(--danger)" },
  PLATFORM_MAINTENANCE_OFF:  { label: "Manutenção desativada",    color: "var(--neon)" },
  PLATFORM_DEPOSITS_BLOCKED: { label: "Depósitos bloqueados (global)", color: "var(--danger)" },
  PLATFORM_DEPOSITS_UNBLOCKED: { label: "Depósitos desbloqueados (global)", color: "var(--neon)" },
  PLATFORM_DEPOSIT_LIMIT:    { label: "Limite global alterado",   color: "var(--gold)" },
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load(p: number) {
    setLoading(true);
    const res = await fetch(`/api/admin/logs?page=${p}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setPages(data.pages);
      setTotal(data.total);
    }
    setLoading(false);
  }

  useEffect(() => { void load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8 pb-8">
      <Breadcrumb
        pageTitle="Log de Ações"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin", href: "/admin" }, { label: "Logs" }]}
      />

      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--danger)] uppercase mb-1">▸ Admin · Auditoria</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Log de Ações</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">{total} registros de auditoria</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="font-display text-sm tracking-widest text-[var(--text-muted)] uppercase animate-pulse">Carregando...</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface-2)] p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="font-display text-sm tracking-widest text-[var(--text-muted)] uppercase">Nenhuma ação registrada</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="grid grid-cols-[1fr_10rem_10rem_1fr] gap-2 px-4 py-2 border-b border-[var(--border)]">
            {["Ação", "Admin", "Usuário alvo", "Detalhes"].map((h) => (
              <span key={h} className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">{h}</span>
            ))}
          </div>

          <div className="space-y-0.5">
            {logs.map((log) => {
              const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "var(--text-muted)" };
              return (
                <div
                  key={log.id}
                  className="grid grid-cols-[1fr_10rem_10rem_1fr] gap-2 items-center px-4 py-3 border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] transition-all duration-150"
                >
                  <div>
                    <div className="font-display text-xs font-bold tracking-widest uppercase" style={{ color: meta.color }}>
                      {meta.label}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--text-muted)]">{formatDate(log.createdAt)}</div>
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text)] truncate">{log.adminEmail}</div>
                  <div className="font-mono text-[11px] text-[var(--text-muted)] truncate">
                    {(log.detail as Record<string,string>)?.targetEmail ?? log.targetUserId ?? "—"}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text-muted)] truncate">
                    {log.detail
                      ? Object.entries(log.detail)
                          .filter(([k]) => k !== "targetEmail")
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(" · ")
                      : "—"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="font-display text-[11px] tracking-widest uppercase px-3 py-2 border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--neon)] hover:text-[var(--neon)] disabled:opacity-40 transition-all"
              >
                ← Anterior
              </button>
              <span className="font-mono text-xs text-[var(--text-muted)]">{page} / {pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="font-display text-[11px] tracking-widest uppercase px-3 py-2 border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--neon)] hover:text-[var(--neon)] disabled:opacity-40 transition-all"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
