import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Trophy, TrendingUp, TrendingDown, Swords, Medal, Crown } from "lucide-react";

interface PlayerRow {
  userId: string;
  name: string | null;
  wonAmount: number;
  lostAmount: number;
  pnl: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
}

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const currentUserId = session.user.id;

  // Aggregate from bets table directly — avoids exposing wallet balances
  const wonBets  = await prisma.bet.groupBy({
    by: ["userId"],
    where: { status: "WON" },
    _sum:   { potentialPayout: true },
    _count: { _all: true },
  });

  const lostBets = await prisma.bet.groupBy({
    by: ["userId"],
    where: { status: "LOST" },
    _sum:   { amount: true },
    _count: { _all: true },
  });

  // Combine into a map
  const map = new Map<string, { wonAmount: number; lostAmount: number; wonBets: number; lostBets: number }>();

  for (const w of wonBets) {
    map.set(w.userId, {
      wonAmount:  Number(w._sum.potentialPayout ?? 0),
      lostAmount: 0,
      wonBets:    w._count._all,
      lostBets:   0,
    });
  }
  for (const l of lostBets) {
    const existing = map.get(l.userId);
    if (existing) {
      existing.lostAmount = Number(l._sum.amount ?? 0);
      existing.lostBets   = l._count._all;
    } else {
      map.set(l.userId, {
        wonAmount:  0,
        lostAmount: Number(l._sum.amount ?? 0),
        wonBets:    0,
        lostBets:   l._count._all,
      });
    }
  }

  // Fetch names
  const userIds = Array.from(map.keys());
  const users   = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(users.map((u) => [u.id, u.name]));

  // Build rows, sort by P&L
  const rows: PlayerRow[] = Array.from(map.entries())
    .map(([userId, data]) => {
      const totalBets = data.wonBets + data.lostBets;
      const pnl       = data.wonAmount - data.lostAmount;
      const winRate   = totalBets > 0 ? (data.wonBets / totalBets) * 100 : 0;
      return {
        userId,
        name:      nameMap.get(userId) ?? "Jogador Anônimo",
        pnl,
        winRate,
        totalBets,
        ...data,
      };
    })
    .filter((r) => r.totalBets >= 1)           // min 1 aposta para aparecer
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 25);

  const currentUserRank = rows.findIndex((r) => r.userId === currentUserId) + 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--gold)] uppercase mb-1">▸ Competição</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Leaderboard</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">Top 25 jogadores por lucro total — atualizado em tempo real</p>
      </div>

      {/* Podium — top 3 */}
      {rows.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx) => {
            const p = rows[idx];
            if (!p) return null;
            const rank = idx + 1;
            const podiumColors: Record<number, { color: string; glow: string; height: string; icon: typeof Crown }> = {
              1: { color: "var(--gold)",   glow: "rgba(255,184,0,0.4)",    height: "h-28", icon: Crown },
              2: { color: "var(--neon)",   glow: "rgba(0,255,157,0.4)",    height: "h-20", icon: Trophy },
              3: { color: "var(--danger)", glow: "rgba(255,58,110,0.4)",   height: "h-16", icon: Medal },
            };
            const cfg = podiumColors[rank];
            const Icon = cfg.icon;
            const isMe = p.userId === currentUserId;
            return (
              <div
                key={p.userId}
                className="bracket border bg-[var(--surface-2)] p-4 text-center flex flex-col items-center justify-end"
                style={{
                  borderColor: isMe ? "var(--neon)" : cfg.color,
                  boxShadow: isMe ? `0 0 16px rgba(0,255,157,0.15)` : undefined,
                  minHeight: cfg.height,
                }}
              >
                <Icon size={16} style={{ color: cfg.color }} className="mb-2" />
                <div className="font-display text-[11px] tracking-widest uppercase mb-1" style={{ color: cfg.color }}>
                  #{rank}
                </div>
                <div className="font-ui text-sm font-bold text-[var(--text-bright)] mb-1 truncate max-w-full">
                  {p.name}{isMe && " (você)"}
                </div>
                <div className="font-mono text-sm font-bold" style={{ color: cfg.color, textShadow: `0 0 10px ${cfg.glow}` }}>
                  {p.pnl >= 0 ? "+" : ""}{formatCurrency(p.pnl)}
                </div>
                <div className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5 tracking-widest">
                  {p.winRate.toFixed(0)}% WR · {p.totalBets} apostas
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-0.5 h-4 bg-[var(--gold)]" />
          <Swords size={13} className="text-[var(--text-muted)]" />
          <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">Ranking Completo</span>
          {currentUserRank > 0 && (
            <div className="ml-auto px-2 py-0.5 border border-[var(--neon)] bg-[var(--neon-dim)]">
              <span className="font-mono text-[11px] text-[var(--neon)]">Sua posição: #{currentUserRank}</span>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] py-16 text-center">
            <div className="font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">
              Nenhum jogador com apostas liquidadas ainda
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-[2rem_1fr_6rem_6rem_5rem_5rem] gap-3 px-4 py-2">
              {["#", "Jogador", "P&L", "Apostado", "WR", "Apostas"].map((h) => (
                <span key={h} className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">{h}</span>
              ))}
            </div>

            {rows.map((p, i) => {
              const rank     = i + 1;
              const isMe     = p.userId === currentUserId;
              const isTop3   = rank <= 3;
              const rankColor = rank === 1 ? "var(--gold)" : rank === 2 ? "var(--neon)" : rank === 3 ? "var(--danger)" : "var(--text-muted)";
              const totalStaked = p.wonAmount / (p.pnl >= 0 ? 1 : 1) || 0; // approx

              return (
                <div
                  key={p.userId}
                  className="grid grid-cols-[2rem_1fr_6rem_6rem_5rem_5rem] gap-3 items-center px-4 py-3 border transition-colors"
                  style={{
                    borderColor: isMe ? "var(--neon)" : isTop3 ? `${rankColor}40` : "var(--border)",
                    background: isMe ? "var(--neon-dim)" : "var(--surface-2)",
                  }}
                >
                  {/* Rank */}
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: isTop3 ? rankColor : "var(--text-muted)", textShadow: isTop3 ? `0 0 8px ${rankColor}` : undefined }}
                  >
                    {rank}
                  </span>

                  {/* Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 border flex items-center justify-center shrink-0 text-xs font-black"
                      style={{ borderColor: isMe ? "var(--neon)" : "var(--border)", color: isMe ? "var(--neon)" : "var(--text-muted)" }}
                    >
                      {p.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="font-ui text-sm font-semibold text-[var(--text-bright)] truncate">
                      {p.name}{isMe && <span className="text-[var(--neon)] ml-1 text-[10px]">(você)</span>}
                    </span>
                  </div>

                  {/* P&L */}
                  <div className="flex items-center gap-1">
                    {p.pnl >= 0
                      ? <TrendingUp size={10} className="text-[var(--neon)] shrink-0" />
                      : <TrendingDown size={10} className="text-[var(--danger)] shrink-0" />
                    }
                    <span className="font-mono text-sm font-bold" style={{ color: p.pnl >= 0 ? "var(--neon)" : "var(--danger)" }}>
                      {p.pnl >= 0 ? "+" : ""}{formatCurrency(p.pnl)}
                    </span>
                  </div>

                  {/* Total staked (won + lost amounts) */}
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {formatCurrency(p.wonAmount + p.lostAmount)}
                  </span>

                  {/* Win rate */}
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold"
                      style={{ color: p.winRate >= 50 ? "var(--neon)" : "var(--danger)" }}>
                      {p.winRate.toFixed(0)}%
                    </span>
                  </div>

                  {/* Total bets */}
                  <span className="font-mono text-xs text-[var(--text-muted)]">{p.totalBets}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest text-center">
        ▸ Ranking baseado em apostas liquidadas · Mínimo 1 aposta para aparecer
      </div>
    </div>
  );
}
