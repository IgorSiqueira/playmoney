import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { describeEventBet } from "@/lib/bet-events";
import {
  User, TrendingUp, TrendingDown, Target, Trophy, Skull,
  Swords, BarChart3, Zap, Hash, Clock, Gamepad2,
} from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [user, wallet, allBets, gameProfiles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true, agreedToTermsAt: true, role: true },
    }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.bet.findMany({
      where: { userId },
      include: { gameProfile: { select: { displayName: true, game: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gameProfile.findMany({
      where: { userId },
      select: { game: true, displayName: true, externalId: true, lastSyncAt: true },
    }),
  ]);

  // ── Aggregate stats ─────────────────────────────────────────────────────────
  const won      = allBets.filter((b) => b.status === "WON");
  const lost     = allBets.filter((b) => b.status === "LOST");
  const settled  = won.length + lost.length;
  const active   = allBets.filter((b) => b.status === "ACTIVE");

  const totalWon    = won.reduce((s, b)  => s + Number(b.potentialPayout), 0);
  const totalLost   = lost.reduce((s, b) => s + Number(b.amount), 0);
  const totalStaked = [...won, ...lost].reduce((s, b) => s + Number(b.amount), 0);
  const pnl         = totalWon - totalLost;
  const roi         = totalStaked > 0 ? (pnl / totalStaked) * 100 : 0;
  const winRate     = settled > 0 ? (won.length / settled) * 100 : 0;
  const avgBet      = totalStaked > 0 ? totalStaked / settled : 0;
  const biggestWin  = won.length > 0
    ? Math.max(...won.map((b) => Number(b.potentialPayout)))
    : 0;

  // ── Streak ──────────────────────────────────────────────────────────────────
  const sortedSettled = [...won, ...lost].sort(
    (a, b) => new Date(b.settledAt!).getTime() - new Date(a.settledAt!).getTime()
  );
  let streak = 0;
  let streakType: "W" | "L" | null = null;
  for (const b of sortedSettled) {
    const t = b.status === "WON" ? "W" : "L";
    if (!streakType) { streakType = t; streak = 1; }
    else if (t === streakType) { streak++; }
    else break;
  }

  // ── By event type ────────────────────────────────────────────────────────────
  const byEventType = ["WIN_LOSS", "KILLS", "ASSISTS", "GPM"].map((et) => {
    const etBets = allBets.filter((b) => (b.eventType ?? "WIN_LOSS") === et && ["WON", "LOST"].includes(b.status));
    const etWon  = etBets.filter((b) => b.status === "WON").length;
    return { type: et, total: etBets.length, won: etWon };
  }).filter((e) => e.total > 0);

  const pnlPositive = pnl >= 0;
  const recent = allBets.slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 border-2 border-[var(--neon)] bg-[var(--neon-dim)] flex items-center justify-center shrink-0"
          style={{ boxShadow: "0 0 20px rgba(0,128,255,0.15)" }}>
          <span className="font-display text-2xl font-black text-[var(--neon)]">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
        <div>
          <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--neon)] uppercase mb-1">▸ Jogador</div>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">
            {user?.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest">{user?.email}</span>
            {user?.role === "ADMIN" && <Badge variant="destructive">Admin</Badge>}
            {user?.agreedToTermsAt && <Badge variant="default">Verificado 18+</Badge>}
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest mt-1">
            Membro desde {user?.createdAt ? formatDate(user.createdAt) : "—"}
          </div>
        </div>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: pnlPositive ? TrendingUp : TrendingDown,
            label: "P&L Total",
            value: (pnlPositive ? "+" : "") + formatCurrency(pnl),
            sub: `ROI ${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`,
            color: pnlPositive ? "var(--neon)" : "var(--danger)",
            glow: pnlPositive ? "rgba(0,128,255,0.5)" : "rgba(255,58,110,0.5)",
          },
          {
            icon: Swords,
            label: "Win Rate",
            value: settled > 0 ? `${winRate.toFixed(1)}%` : "—",
            sub: `${won.length}V / ${lost.length}D`,
            color: winRate >= 50 ? "var(--neon)" : "var(--danger)",
            glow: winRate >= 50 ? "rgba(0,128,255,0.5)" : "rgba(255,58,110,0.5)",
          },
          {
            icon: BarChart3,
            label: "Total Apostado",
            value: formatCurrency(totalStaked),
            sub: `${settled} apostas liquidadas`,
            color: "var(--blue)",
            glow: "rgba(0,207,255,0.5)",
          },
          {
            icon: Trophy,
            label: "Maior Ganho",
            value: biggestWin > 0 ? formatCurrency(biggestWin) : "—",
            sub: avgBet > 0 ? `Média ${formatCurrency(avgBet)}/aposta` : "Sem vitórias ainda",
            color: "var(--gold)",
            glow: "rgba(255,184,0,0.5)",
          },
        ].map(({ icon: Icon, label, value, sub, color, glow }) => (
          <div key={label} className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4 hover:border-[var(--border-mid)] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">{label}</span>
              <Icon size={12} style={{ color }} />
            </div>
            <div className="font-mono text-xl font-bold" style={{ color, textShadow: `0 0 12px ${glow}` }}>{value}</div>
            <div className="font-mono text-[11px] text-[var(--text-muted)] mt-1 tracking-widest">{sub}</div>
          </div>
        ))}
      </div>

      {/* Streak + saldo + ativas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
          <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-3">Sequência Atual</div>
          {streakType ? (
            <>
              <div className="font-mono text-3xl font-bold"
                style={{ color: streakType === "W" ? "var(--neon)" : "var(--danger)", textShadow: streakType === "W" ? "0 0 15px rgba(0,128,255,0.5)" : "0 0 15px rgba(255,58,110,0.5)" }}>
                {streak}×
              </div>
              <div className="font-display text-[11px] tracking-widest mt-1 uppercase"
                style={{ color: streakType === "W" ? "var(--neon)" : "var(--danger)" }}>
                {streakType === "W" ? "Vitórias" : "Derrotas"}
              </div>
            </>
          ) : (
            <div className="font-mono text-xl text-[var(--text-muted)]">—</div>
          )}
        </div>
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
          <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-3">Saldo Disponível</div>
          <div className="font-mono text-2xl font-bold text-[var(--neon)]" style={{ textShadow: "0 0 12px rgba(0,128,255,0.4)" }}>
            {formatCurrency(Number(wallet?.balance ?? 0))}
          </div>
          {wallet && Number(wallet.bonusBalance) > 0 && (
            <div className="font-mono text-[11px] text-[var(--gold)] mt-1 tracking-widest">
              +{formatCurrency(Number(wallet.bonusBalance))} bônus
            </div>
          )}
        </div>
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
          <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-3">Apostas Ativas</div>
          <div className="font-mono text-3xl font-bold text-[var(--gold)]" style={{ textShadow: "0 0 12px rgba(255,184,0,0.4)" }}>
            {active.length}
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)] mt-1 tracking-widest">
            {active.length > 0 ? "Em andamento" : "Nenhuma"}
          </div>
        </div>
      </div>

      {/* Performance by event type */}
      {byEventType.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-0.5 h-4 bg-[var(--blue)]" />
            <BarChart3 size={13} className="text-[var(--text-muted)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">Performance por Tipo</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {byEventType.map(({ type, total, won: w }) => {
              const wr = total > 0 ? (w / total) * 100 : 0;
              const labels: Record<string, string> = {
                WIN_LOSS: "Vitória/Derrota",
                KILLS:    "Abates",
                ASSISTS:  "Assistências",
                GPM:      "GPM",
              };
              return (
                <div key={type} className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-2">{labels[type] ?? type}</div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="font-mono text-lg font-bold" style={{ color: wr >= 50 ? "var(--neon)" : "var(--danger)" }}>
                      {wr.toFixed(0)}%
                    </span>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">{w}V/{total - w}D</span>
                  </div>
                  {/* progress bar */}
                  <div className="h-1 bg-[var(--surface-1)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${wr}%`,
                        background: wr >= 50 ? "var(--neon)" : "var(--danger)",
                        boxShadow: wr >= 50 ? "0 0 6px rgba(0,128,255,0.5)" : "0 0 6px rgba(255,58,110,0.5)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Game profiles */}
      {gameProfiles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-0.5 h-4 bg-[var(--neon)]" />
            <Gamepad2 size={13} className="text-[var(--text-muted)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">Perfis Conectados</span>
          </div>
          <div className="space-y-2">
            {gameProfiles.map((gp) => (
              <div key={gp.game} className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Zap size={12} className="text-[var(--neon)]" />
                  <div>
                    <div className="font-ui text-sm font-semibold text-[var(--text-bright)]">{gp.displayName ?? "—"}</div>
                    <div className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest">{gp.game} · ID {gp.externalId}</div>
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest">
                  {gp.lastSyncAt ? `Sync ${formatDate(gp.lastSyncAt)}` : "Nunca sincronizado"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent bets */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-0.5 h-4 bg-[var(--danger)]" />
            <Hash size={13} className="text-[var(--text-muted)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">Histórico Recente</span>
          </div>
          <div className="space-y-2">
            {recent.map((bet) => {
              const statusCfg: Record<string, { label: string; variant: "default"|"destructive"|"warning"|"secondary"; icon: typeof Trophy }> = {
                ACTIVE: { label: "Ativa",     variant: "warning",     icon: Clock },
                WON:    { label: "Vitória",   variant: "default",     icon: Trophy },
                LOST:   { label: "Derrota",   variant: "destructive", icon: Skull },
                CANCELLED: { label: "Cancelada", variant: "secondary", icon: Target },
              };
              const s   = statusCfg[bet.status] ?? { label: bet.status, variant: "secondary" as const, icon: Target };
              const Ico = s.icon;
              const desc = describeEventBet(bet.eventType ?? "WIN_LOSS", bet.prediction, Number(bet.targetValue ?? 0) || undefined);
              return (
                <div key={bet.id} className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 hover:border-[var(--border-mid)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 border border-[var(--border)] flex items-center justify-center shrink-0">
                      <Ico size={11} className="text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <div className="font-ui text-sm font-semibold text-[var(--text-bright)]">{desc}</div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]">
                        {bet.gameProfile.displayName} · {formatDate(bet.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono text-sm text-[var(--text-bright)]">{formatCurrency(Number(bet.amount))}</div>
                      {bet.status === "WON" && (
                        <div className="font-mono text-[10px] text-[var(--neon)]">+{formatCurrency(Number(bet.potentialPayout))}</div>
                      )}
                      {bet.status === "LOST" && (
                        <div className="font-mono text-[10px] text-[var(--danger)]">-{formatCurrency(Number(bet.amount))}</div>
                      )}
                    </div>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allBets.length === 0 && (
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] py-16 text-center">
          <User size={28} className="text-[var(--text-muted)] mx-auto mb-3" />
          <div className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)] mb-1">
            Perfil Vazio
          </div>
          <div className="font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">
            Crie sua primeira aposta para ver estatísticas
          </div>
        </div>
      )}
    </div>
  );
}
