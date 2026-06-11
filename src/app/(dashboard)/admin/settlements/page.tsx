import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OverrideButton } from "@/components/admin/override-button";
import { describeEventBet } from "@/lib/bet-events";
import Link from "next/link";
import {
  Trophy, Skull, Activity, Hash, ChevronLeft, ChevronRight,
  ShieldAlert, AlertTriangle,
} from "lucide-react";

const PAGE_SIZE = 30;

export default async function AdminSettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") redirect("/dashboard");

  const sp   = await searchParams;
  const tab  = sp.tab === "active" ? "active" : "settled";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  // ── Active bets (pending override) ────────────────────────────────────────
  const [activeBets, activeTotal] = await Promise.all([
    tab === "active" ? prisma.bet.findMany({
      where:   { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },       // oldest first — most urgent
      skip,
      take:    PAGE_SIZE,
      include: {
        user:        { select: { name: true, email: true } },
        gameProfile: { select: { displayName: true, game: true } },
      },
    }) : Promise.resolve([]),
    tab === "active" ? prisma.bet.count({ where: { status: "ACTIVE" } }) : Promise.resolve(0),
  ]);

  // ── Settled bets ───────────────────────────────────────────────────────────
  const [settledBets, settledTotal] = await Promise.all([
    tab === "settled" ? prisma.bet.findMany({
      where:   { status: { in: ["WON", "LOST"] } },
      orderBy: { settledAt: "desc" },
      skip,
      take:    PAGE_SIZE,
      include: {
        user:        { select: { name: true } },
        gameProfile: { select: { displayName: true, game: true } },
      },
    }) : Promise.resolve([]),
    tab === "settled" ? prisma.bet.count({ where: { status: { in: ["WON", "LOST"] } } }) : Promise.resolve(0),
  ]);

  const [activeTotalCount, settledTotalCount] = await Promise.all([
    prisma.bet.count({ where: { status: "ACTIVE" } }),
    prisma.bet.count({ where: { status: { in: ["WON", "LOST"] } } }),
  ]);

  const totalPages = Math.ceil((tab === "active" ? activeTotal : settledTotal) / PAGE_SIZE);

  function pageUrl(p: number) {
    return `/admin/settlements?tab=${tab}&page=${p}`;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="font-display text-[10px] tracking-[0.3em] text-[var(--danger)] uppercase mb-1">▸ Admin · Restrito</div>
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--text-bright)]">Liquidações</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">
          Histórico completo de apostas e override manual de resultados
        </p>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1">
        {[
          { key: "settled", label: "Liquidadas",   count: settledTotalCount, icon: Trophy },
          { key: "active",  label: "Ativas",        count: activeTotalCount,  icon: Activity },
        ].map(({ key, label, count, icon: Icon }) => (
          <Link key={key} href={`/admin/settlements?tab=${key}&page=1`}>
            <div className={`flex items-center gap-2 px-4 py-2.5 border transition-all ${
              tab === key
                ? "border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]"
                : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--border-mid)]"
            }`}>
              <Icon size={12} />
              <span className="font-display text-[10px] tracking-widest uppercase font-bold">{label}</span>
              <span className={`font-mono text-[11px] px-1.5 py-0.5 border ${
                tab === key ? "border-[var(--neon)] text-[var(--neon)]" : "border-[var(--border)] text-[var(--text-muted)]"
              }`}>{count}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── ACTIVE bets tab ─────────────────────────────────────────────────── */}
      {tab === "active" && (
        <div className="space-y-3">
          {activeBets.length === 0 ? (
            <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] py-16 text-center">
              <Activity size={24} className="text-[var(--text-muted)] mx-auto mb-3" />
              <div className="font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">
                Nenhuma aposta ativa no momento
              </div>
            </div>
          ) : (
            activeBets.map((bet) => {
              const desc = describeEventBet(
                bet.eventType ?? "WIN_LOSS",
                bet.prediction,
                Number(bet.targetValue ?? 0) || undefined
              );
              const isOverride = String(bet.matchData ?? "").includes("adminOverride");

              return (
                <div key={bet.id} className="bracket border border-[var(--gold)] bg-[var(--surface-2)]">
                  <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
                  <div className="p-4 space-y-3">
                    {/* Row 1: user + profile + description */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-ui text-sm font-bold text-[var(--text-bright)]">
                            {bet.user.name}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">
                            {bet.user.email}
                          </span>
                        </div>
                        <div className="font-display text-xs text-[var(--gold)] mt-0.5">{desc}</div>
                        <div className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5">
                          {bet.gameProfile.displayName} · {bet.gameProfile.game} · criada {formatDate(bet.createdAt)}
                        </div>
                      </div>
                      <Badge variant="warning">Ativa</Badge>
                    </div>

                    {/* Row 2: stats */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Apostado",  value: formatCurrency(Number(bet.amount)),          color: "var(--text-bright)" },
                        { label: "Odds",      value: `${Number(bet.odds).toFixed(2)}×`,           color: "var(--gold)" },
                        { label: "Payout",    value: formatCurrency(Number(bet.potentialPayout)), color: "var(--neon)" },
                        { label: "Match ID",  value: bet.matchId ?? "—",                          color: "var(--text-muted)" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
                          <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-1">{label}</div>
                          <div className="font-mono text-xs font-bold truncate" style={{ color }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Override */}
                    {isOverride ? (
                      <div className="flex items-center gap-2 px-3 py-2 border border-[var(--text-muted)] bg-[var(--surface-1)]">
                        <ShieldAlert size={10} className="text-[var(--text-muted)]" />
                        <span className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest">Override já aplicado</span>
                      </div>
                    ) : (
                      <OverrideButton
                        betId={bet.id}
                        userName={bet.user.name ?? "?"}
                        betAmount={formatCurrency(Number(bet.amount))}
                        potentialPayout={formatCurrency(Number(bet.potentialPayout))}
                        onDone={() => window.location.reload()}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── SETTLED bets tab ────────────────────────────────────────────────── */}
      {tab === "settled" && (
        <div>
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_5rem_5rem_5rem_5rem_7rem] gap-2 px-4 py-2 border-b border-[var(--border)]">
            {["Jogador / Aposta", "Apostado", "Payout", "Odds", "Match", "Liquidada"].map((h) => (
              <span key={h} className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">{h}</span>
            ))}
          </div>

          <div className="space-y-0.5 mt-1">
            {settledBets.length === 0 ? (
              <div className="py-16 text-center">
                <div className="font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">Sem apostas liquidadas</div>
              </div>
            ) : (
              settledBets.map((bet) => {
                const won = bet.status === "WON";
                const desc = describeEventBet(
                  bet.eventType ?? "WIN_LOSS",
                  bet.prediction,
                  Number(bet.targetValue ?? 0) || undefined
                );
                const isAdminOverride = typeof bet.matchData === "object" &&
                  bet.matchData !== null && "adminOverride" in (bet.matchData as object);

                return (
                  <div
                    key={bet.id}
                    className="grid grid-cols-[1fr_5rem_5rem_5rem_5rem_7rem] gap-2 items-center px-4 py-3 border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-mid)] transition-colors"
                    style={{ borderLeftColor: won ? "var(--neon)" : "var(--danger)", borderLeftWidth: 2 }}
                  >
                    {/* Jogador / Aposta */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border flex items-center justify-center shrink-0"
                          style={{ borderColor: won ? "rgba(0,255,157,0.4)" : "rgba(255,58,110,0.4)" }}>
                          {won
                            ? <Trophy size={9} className="text-[var(--neon)]" />
                            : <Skull  size={9} className="text-[var(--danger)]" />
                          }
                        </div>
                        <span className="font-ui text-sm font-semibold text-[var(--text-bright)] truncate">
                          {bet.user.name}
                        </span>
                        {isAdminOverride && (
                          <span className="shrink-0">
                            <AlertTriangle size={9} className="text-[var(--gold)]" aria-label="Override admin" />
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--text-muted)] ml-7 mt-0.5 truncate">{desc}</div>
                    </div>

                    {/* Apostado */}
                    <span className="font-mono text-xs text-[var(--text-bright)]">
                      {formatCurrency(Number(bet.amount))}
                    </span>

                    {/* Payout */}
                    <span className="font-mono text-xs font-bold"
                      style={{ color: won ? "var(--neon)" : "var(--danger)" }}>
                      {won ? `+${formatCurrency(Number(bet.potentialPayout))}` : `−${formatCurrency(Number(bet.amount))}`}
                    </span>

                    {/* Odds */}
                    <span className="font-mono text-xs text-[var(--gold)]">
                      {Number(bet.odds).toFixed(2)}×
                    </span>

                    {/* Match ID */}
                    <div className="flex items-center gap-1 min-w-0">
                      <Hash size={9} className="text-[var(--text-muted)] shrink-0" />
                      <span className="font-mono text-[11px] text-[var(--text-muted)] truncate">
                        {bet.matchId ?? "—"}
                      </span>
                    </div>

                    {/* Settled at */}
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {bet.settledAt ? formatDate(bet.settledAt) : "—"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest">
            Página {page} de {totalPages} ·{" "}
            {tab === "active" ? activeTotal : settledTotal} apostas
          </span>
          <div className="flex gap-1">
            {page > 1 && (
              <Button asChild size="sm" variant="outline">
                <Link href={pageUrl(page - 1)}>
                  <ChevronLeft size={12} className="mr-1" /> Anterior
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild size="sm" variant="outline">
                <Link href={pageUrl(page + 1)}>
                  Próxima <ChevronRight size={12} className="ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
