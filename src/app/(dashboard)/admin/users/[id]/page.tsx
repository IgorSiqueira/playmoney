"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Ban, CircleCheck, Lock, Unlock, DollarSign,
  TrendingDown, TrendingUp, X, AlertTriangle,
} from "lucide-react";

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  role: string;
  suspendedAt: string | null;
  depositsBlocked: boolean;
  depositLimit: number | null;
  createdAt: string;
  wallet: { balance: string; bonusBalance: string } | null;
  bets: {
    id: string;
    status: string;
    amount: string;
    potentialPayout: string;
    prediction: string;
    createdAt: string;
    gameProfile: { displayName: string | null };
  }[];
}

function ActionButton({
  onClick, disabled, danger, children,
}: {
  onClick: () => void; disabled: boolean; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-display text-[11px] tracking-widest uppercase px-3 py-2 border transition-all disabled:opacity-40"
      style={{
        borderColor: danger ? "var(--danger)" : "var(--neon)",
        color: danger ? "var(--danger)" : "var(--neon)",
      }}
    >
      {children}
    </button>
  );
}

export default function AdminUserPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [limitInput, setLimitInput] = useState("");
  const [balanceInput, setBalanceInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${id}/detail`);
    if (res.ok) setUser(await res.json());
    setLoading(false);
  }

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function flash(msg: string, ok: boolean) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function patchUser(action: string, extra?: Record<string, unknown>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    if (res.ok) { flash("Ação aplicada com sucesso", true); void load(); }
    else { const e = await res.json(); flash(e.error ?? "Erro", false); }
  }

  async function adjustBalance() {
    const amount = parseFloat(balanceInput);
    if (isNaN(amount) || amount === 0) { flash("Valor inválido", false); return; }
    if (!reasonInput.trim()) { flash("Motivo obrigatório", false); return; }
    const res = await fetch(`/api/admin/users/${id}/balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, reason: reasonInput }),
    });
    if (res.ok) {
      flash(`Saldo ajustado: ${amount > 0 ? "+" : ""}${amount}`, true);
      setBalanceInput(""); setReasonInput(""); void load();
    } else {
      const e = await res.json(); flash(e.error ?? "Erro", false);
    }
  }

  async function cancelBet(betId: string) {
    const res = await fetch(`/api/admin/bets/${betId}/cancel`, { method: "POST" });
    if (res.ok) { flash("Aposta cancelada e saldo reembolsado", true); void load(); }
    else { const e = await res.json(); flash(e.error ?? "Erro", false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-display text-sm tracking-widest text-[var(--text-muted)] uppercase animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <div className="font-display text-sm text-[var(--danger)]">Usuário não encontrado.</div>;
  }

  const isSuspended = !!user.suspendedAt;
  const activeBets = user.bets.filter((b) => b.status === "ACTIVE");

  return (
    <div className="space-y-8 pb-8">
      <Breadcrumb
        pageTitle={user.name ?? user.email}
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/admin" },
          { label: "Usuários", href: "/admin/users" },
          { label: user.name ?? user.email },
        ]}
      />

      {/* Feedback toast */}
      {feedback && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 border font-ui text-sm font-semibold"
          style={{
            borderColor: feedback.ok ? "var(--neon)" : "var(--danger)",
            color: feedback.ok ? "var(--neon)" : "var(--danger)",
            background: "var(--surface-2)",
          }}
        >
          {feedback.msg}
        </div>
      )}

      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--danger)] uppercase mb-1">▸ Admin · Gerenciar Usuário</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">
          {user.name ?? "—"}
        </h1>
        <p className="font-mono text-sm text-[var(--text-muted)] mt-1">{user.email}</p>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {isSuspended && (
          <span className="font-display text-[11px] tracking-widest uppercase px-2 py-1 border border-[var(--danger)] text-[var(--danger)] bg-[var(--danger-dim)]">
            Suspenso desde {formatDate(user.suspendedAt!)}
          </span>
        )}
        {user.depositsBlocked && (
          <span className="font-display text-[11px] tracking-widest uppercase px-2 py-1 border border-[var(--gold)] text-[var(--gold)]">
            Depósitos bloqueados
          </span>
        )}
        {user.depositLimit !== null && (
          <span className="font-display text-[11px] tracking-widest uppercase px-2 py-1 border border-[var(--blue)] text-[var(--blue)]">
            Limite: {formatCurrency(user.depositLimit)}
          </span>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Saldo", value: formatCurrency(Number(user.wallet?.balance ?? 0)), color: "var(--neon)" },
          { label: "Bônus", value: formatCurrency(Number(user.wallet?.bonusBalance ?? 0)), color: "var(--gold)" },
          { label: "Apostas Ativas", value: String(activeBets.length), color: activeBets.length > 0 ? "var(--gold)" : "var(--text-muted)" },
          { label: "Cadastro", value: formatDate(user.createdAt), color: "var(--text-muted)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-1">{label}</div>
            <div className="font-mono text-lg font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-0.5 h-4 bg-[var(--danger)]" />
          <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">Ações</span>
        </div>

        {/* Suspend / Unsuspend */}
        <div className="border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
          <div>
            <div className="font-display text-xs tracking-widest text-[var(--text-bright)] uppercase mb-0.5">Conta</div>
            <p className="font-ui text-xs text-[var(--text-muted)]">
              Suspender bloqueia o login do usuário. Ele não consegue acessar a plataforma.
            </p>
          </div>
          <div className="flex gap-2">
            {!isSuspended ? (
              <ActionButton danger disabled={isPending} onClick={() => startTransition(() => patchUser("suspend"))}>
                <Ban size={11} className="inline mr-1.5" />Suspender
              </ActionButton>
            ) : (
              <ActionButton disabled={isPending} onClick={() => startTransition(() => patchUser("unsuspend"))}>
                <CircleCheck size={11} className="inline mr-1.5" />Reativar
              </ActionButton>
            )}
          </div>
        </div>

        {/* Block / unblock deposits */}
        <div className="border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
          <div>
            <div className="font-display text-xs tracking-widest text-[var(--text-bright)] uppercase mb-0.5">Depósitos</div>
            <p className="font-ui text-xs text-[var(--text-muted)]">
              Bloquear depósitos impede esse usuário de depositar independente das configurações globais.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!user.depositsBlocked ? (
              <ActionButton danger disabled={isPending} onClick={() => startTransition(() => patchUser("blockDeposits"))}>
                <Lock size={11} className="inline mr-1.5" />Bloquear depósitos
              </ActionButton>
            ) : (
              <ActionButton disabled={isPending} onClick={() => startTransition(() => patchUser("unblockDeposits"))}>
                <Unlock size={11} className="inline mr-1.5" />Desbloquear depósitos
              </ActionButton>
            )}
          </div>
        </div>

        {/* Deposit limit */}
        <div className="border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
          <div>
            <div className="font-display text-xs tracking-widest text-[var(--text-bright)] uppercase mb-0.5">Limite de Depósito Diário</div>
            <p className="font-ui text-xs text-[var(--text-muted)]">
              Limite individual (sobrepõe o global). Deixe em branco para remover o limite personalizado.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-mono text-xs text-[var(--text-muted)]">R$</span>
            <input
              type="number"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              placeholder={user.depositLimit !== null ? String(user.depositLimit) : "sem limite individual"}
              className="font-mono text-sm bg-[var(--surface-1)] border border-[var(--border)] px-3 py-2 text-[var(--text)] w-40 focus:outline-none focus:border-[var(--neon)]"
            />
            <ActionButton
              disabled={isPending}
              onClick={() =>
                startTransition(() =>
                  patchUser("setDepositLimit", { limit: limitInput ? parseFloat(limitInput) : null })
                )
              }
            >
              Salvar
            </ActionButton>
            {user.depositLimit !== null && (
              <ActionButton
                disabled={isPending}
                onClick={() => startTransition(() => { setLimitInput(""); patchUser("setDepositLimit", { limit: null }); })}
              >
                Remover
              </ActionButton>
            )}
          </div>
        </div>

        {/* Balance adjustment */}
        <div className="border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
          <div>
            <div className="font-display text-xs tracking-widest text-[var(--text-bright)] uppercase mb-0.5">Ajuste de Saldo</div>
            <p className="font-ui text-xs text-[var(--text-muted)]">
              Use valores positivos para creditar e negativos para debitar. Motivo obrigatório para auditoria.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-[var(--text-muted)]">R$</span>
              <input
                type="number"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                placeholder="ex: 50 ou -20"
                className="font-mono text-sm bg-[var(--surface-1)] border border-[var(--border)] px-3 py-2 text-[var(--text)] w-36 focus:outline-none focus:border-[var(--neon)]"
              />
            </div>
            <input
              type="text"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Motivo (obrigatório)"
              className="font-ui text-sm bg-[var(--surface-1)] border border-[var(--border)] px-3 py-2 text-[var(--text)] flex-1 min-w-48 focus:outline-none focus:border-[var(--neon)]"
            />
            <ActionButton disabled={isPending} onClick={() => startTransition(adjustBalance)}>
              <DollarSign size={11} className="inline mr-1.5" />Aplicar
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Active bets */}
      {activeBets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-[var(--gold)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">
              Apostas Ativas ({activeBets.length})
            </span>
          </div>
          <div className="space-y-1">
            {activeBets.map((bet) => (
              <div key={bet.id} className="flex items-center gap-3 border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-ui text-sm text-[var(--text-bright)]">{bet.gameProfile.displayName ?? "—"}</div>
                  <div className="font-mono text-[11px] text-[var(--text-muted)]">
                    {bet.prediction} · {formatDate(bet.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-[var(--text-bright)]">{formatCurrency(Number(bet.amount))}</div>
                  <div className="font-mono text-[11px] text-[var(--neon)]">
                    payout: {formatCurrency(Number(bet.potentialPayout))}
                  </div>
                </div>
                <button
                  onClick={() => startTransition(() => cancelBet(bet.id))}
                  disabled={isPending}
                  className="p-2 border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-dim)] transition-all disabled:opacity-40"
                  title="Cancelar e reembolsar"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent bets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-[var(--border-mid)]" />
          <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Histórico de Apostas
          </span>
        </div>
        {user.bets.filter((b) => b.status !== "ACTIVE").slice(0, 10).length === 0 ? (
          <p className="font-ui text-xs text-[var(--text-muted)]">Nenhuma aposta liquidada.</p>
        ) : (
          <div className="space-y-1">
            {user.bets.filter((b) => b.status !== "ACTIVE").slice(0, 10).map((bet) => {
              const won = bet.status === "WON";
              return (
                <div key={bet.id} className="flex items-center gap-3 border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 opacity-70">
                  <div className="flex-1 min-w-0">
                    <div className="font-ui text-xs text-[var(--text)]">{bet.gameProfile.displayName ?? "—"} · {bet.prediction}</div>
                    <div className="font-mono text-[11px] text-[var(--text-muted)]">{formatDate(bet.createdAt)}</div>
                  </div>
                  <div className="font-mono text-xs">{formatCurrency(Number(bet.amount))}</div>
                  <div
                    className="font-display text-[11px] tracking-widest uppercase px-2 py-0.5 border"
                    style={{
                      color: won ? "var(--neon)" : bet.status === "CANCELLED" ? "var(--text-muted)" : "var(--danger)",
                      borderColor: won ? "var(--neon)" : bet.status === "CANCELLED" ? "var(--border)" : "var(--danger)",
                    }}
                  >
                    {bet.status === "WON" ? "Ganhou" : bet.status === "LOST" ? "Perdeu" : bet.status}
                  </div>
                  {won ? (
                    <TrendingDown size={11} className="text-[var(--danger)]" />
                  ) : (
                    <TrendingUp size={11} className="text-[var(--neon)]" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
