import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { describeEventBet } from "@/lib/bet-events";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Swords, CircleDollarSign, Activity,
  ChevronRight, Gamepad2, Target, Trophy, Skull, Clock, Gift,
  CheckCircle2, Circle,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [wallet, allBets, recentBets, gameProfiles] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.bet.findMany({
      where: { userId },
      select: { amount: true, potentialPayout: true, status: true },
    }),
    prisma.bet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { gameProfile: { select: { game: true, displayName: true } } },
    }),
    prisma.gameProfile.findMany({ where: { userId } }),
  ]);

  // ── Aggregate stats ─────────────────────────────────────────────────────────
  const won     = allBets.filter((b) => b.status === "WON");
  const lost    = allBets.filter((b) => b.status === "LOST");
  const active  = allBets.filter((b) => b.status === "ACTIVE");
  const settled = won.length + lost.length;

  const totalWon    = won.reduce((s, b)  => s + Number(b.potentialPayout), 0);
  const totalLost   = lost.reduce((s, b) => s + Number(b.amount), 0);
  const totalStaked = [...won, ...lost].reduce((s, b) => s + Number(b.amount), 0);
  const pnl         = totalWon - totalLost;
  const winRate     = settled > 0 ? Math.round((won.length / settled) * 100) : 0;
  const roi         = totalStaked > 0 ? ((pnl / totalStaked) * 100) : 0;

  const pnlPositive = pnl >= 0;

  const hud = [
    {
      icon: CircleDollarSign,
      label: "Saldo",
      value: formatCurrency(Number(wallet?.balance ?? 0)),
      sub: wallet && Number(wallet.bonusBalance) > 0
        ? `+${formatCurrency(Number(wallet.bonusBalance))} bônus`
        : undefined,
      color: "var(--neon)",
      glow: "rgba(0,128,255,0.5)",
    },
    {
      icon: pnlPositive ? TrendingUp : TrendingDown,
      label: "P&L Total",
      value: (pnlPositive ? "+" : "") + formatCurrency(pnl),
      sub: settled > 0 ? `ROI ${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%` : "Sem apostas liquidadas",
      color: pnlPositive ? "var(--neon)" : "var(--danger)",
      glow: pnlPositive ? "rgba(0,128,255,0.5)" : "rgba(255,58,110,0.5)",
    },
    {
      icon: Swords,
      label: "Win Rate",
      value: settled > 0 ? `${winRate}%` : "—",
      sub: `${won.length}W / ${lost.length}L`,
      color: winRate >= 50 ? "var(--neon)" : "var(--danger)",
      glow: winRate >= 50 ? "rgba(0,128,255,0.5)" : "rgba(255,58,110,0.5)",
    },
    {
      icon: Activity,
      label: "Em Aberto",
      value: String(active.length),
      sub: active.length > 0 ? "Apostas ativas" : "Nenhuma ativa",
      color: "var(--gold)",
      glow: "rgba(255,184,0,0.5)",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--neon)] uppercase mb-1">
            ▸ Painel de Controle
          </div>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">
            Olá, {session.user.name?.split(" ")[0]}
          </h1>
          <p className="font-ui text-sm text-[var(--text-muted)] mt-1">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        {active.length > 0 && (
          <Link href="/bets">
            <div className="flex items-center gap-2 border border-[var(--gold)] bg-[var(--gold-dim)] px-4 py-2 hover:bg-[rgba(255,184,0,0.15)] transition-colors cursor-pointer">
              <Activity size={12} className="text-[var(--gold)]" />
              <span className="font-display text-[10px] tracking-widest text-[var(--gold)] uppercase">
                {active.length} Ativa{active.length > 1 ? "s" : ""}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {hud.map(({ icon: Icon, label, value, sub, color, glow }) => (
          <div
            key={label}
            className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] p-4 hover:border-[var(--border-mid)] transition-all group overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">{label}</span>
              <Icon size={12} style={{ color }} />
            </div>
            <div className="font-mono text-xl font-bold" style={{ color, textShadow: `0 0 12px ${glow}` }}>
              {value}
            </div>
            {sub && (
              <div className="font-mono text-[11px] text-[var(--text-muted)] mt-1 tracking-widest">{sub}</div>
            )}
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
            />
          </div>
        ))}
      </div>

      {/* Onboarding — shown until user places first bet */}
      {allBets.length === 0 && (
        <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--neon)] to-transparent" />
          <div className="p-6">
            <div className="font-display text-[11px] tracking-[0.2em] text-[var(--neon)] uppercase mb-1">▸ Primeiros Passos</div>
            <h2 className="font-display text-lg font-black uppercase tracking-tight text-[var(--text-bright)] mb-5">
              Comece a Apostar em 3 Passos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  step: 1,
                  done: gameProfiles.length > 0,
                  title: "Conecte o Dota 2",
                  desc: "Vincule seu perfil Steam para calcularmos suas odds com base no seu histórico.",
                  href: "/games/dota2",
                  cta: "Conectar",
                },
                {
                  step: 2,
                  done: Number(wallet?.balance ?? 0) > 0,
                  title: "Deposite Saldo",
                  desc: "Adicione créditos via PIX para começar a apostar. Mínimo R$ 10,00.",
                  href: "/wallet",
                  cta: "Depositar",
                },
                {
                  step: 3,
                  done: false,
                  title: "Faça sua Primeira Aposta",
                  desc: "Escolha um evento, defina o valor e acompanhe seu desempenho em tempo real.",
                  href: "/games/dota2",
                  cta: "Apostar",
                },
              ].map(({ step, done, title, desc, href, cta }) => (
                <div
                  key={step}
                  className={`relative border p-4 transition-all ${
                    done
                      ? "border-[var(--neon)] bg-[var(--neon-dim)] opacity-60"
                      : "border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-mid)]"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`shrink-0 mt-0.5 ${done ? "text-[var(--neon)]" : "text-[var(--text-muted)]"}`}>
                      {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </div>
                    <div>
                      <div className="font-mono text-[11px] text-[var(--text-muted)] mb-0.5">
                        PASSO {step}
                      </div>
                      <div className="font-display text-sm font-bold uppercase tracking-wide text-[var(--text-bright)]">
                        {title}
                      </div>
                    </div>
                  </div>
                  <p className="font-ui text-[12px] text-[var(--text-muted)] leading-relaxed mb-4">{desc}</p>
                  {!done && (
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link href={href}>{cta}</Link>
                    </Button>
                  )}
                  {done && (
                    <div className="font-ui text-[12px] font-semibold text-[var(--neon)]">Concluído ✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bonus banner */}
      {wallet && !wallet.depositBonusClaimed && Number(wallet.balance) === 0 && (
        <div className="bracket relative border border-[var(--gold)] bg-[var(--gold-dim)] overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
          <div className="flex items-center gap-4 p-4">
            <Gift size={20} className="text-[var(--gold)] shrink-0" />
            <div className="flex-1">
              <div className="font-display text-xs font-bold uppercase tracking-widest text-[var(--gold)] mb-0.5">
                Bônus de Primeiro Depósito
              </div>
              <p className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest">
                Deposite e ganhe 50% de bônus — até R$ 50,00 extra na sua carteira
              </p>
            </div>
            <Button asChild size="sm" variant="gold">
              <Link href="/wallet">Depositar</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Connect game CTA */}
      {gameProfiles.length === 0 && (
        <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--neon)] to-transparent" />
          <div className="flex items-center gap-6 p-8">
            <div className="w-16 h-16 border border-[var(--neon)] bg-[var(--neon-dim)] flex items-center justify-center shrink-0">
              <Gamepad2 size={28} className="text-[var(--neon)]" />
            </div>
            <div className="flex-1">
              <div className="font-display text-[10px] tracking-[0.2em] text-[var(--neon)] uppercase mb-1">Ação Necessária</div>
              <div className="font-display text-lg font-bold uppercase text-[var(--text-bright)] mb-1">Conecte seu jogo</div>
              <p className="font-ui text-sm text-[var(--text-muted)]">
                Adicione seu perfil do Dota 2 para calcularmos suas odds e começar a apostar.
              </p>
            </div>
            <Button asChild>
              <Link href="/games/dota2">Conectar Dota 2</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Recent bets */}
      {recentBets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-[var(--neon)]" />
              <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">
                Apostas Recentes
              </span>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/bets" className="flex items-center gap-1">
                Ver todas <ChevronRight size={10} />
              </Link>
            </Button>
          </div>
          <div className="space-y-2">
            {recentBets.map((bet) => {
              const statusCfg: Record<string, { label: string; variant: "default"|"destructive"|"warning"|"secondary"; icon: typeof Trophy }> = {
                ACTIVE:    { label: "Ativa",     variant: "warning",     icon: Clock },
                WON:       { label: "Vitória",   variant: "default",     icon: Trophy },
                LOST:      { label: "Derrota",   variant: "destructive", icon: Skull },
                CANCELLED: { label: "Cancelada", variant: "secondary",   icon: Target },
              };
              const s = statusCfg[bet.status] ?? { label: bet.status, variant: "secondary" as const, icon: Target };
              const Icon = s.icon;
              const description = describeEventBet(
                (bet as { eventType?: string }).eventType ?? "WIN_LOSS",
                bet.prediction as string,
                Number((bet as { targetValue?: { toString(): string } | null }).targetValue ?? 0) || undefined
              );
              return (
                <div key={bet.id} className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 hover:border-[var(--border-mid)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 border border-[var(--border)] flex items-center justify-center shrink-0">
                      <Icon size={12} className="text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <div className="font-ui text-sm font-semibold text-[var(--text-bright)]">{description}</div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]">
                        {bet.gameProfile.displayName} · {formatDate(bet.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold text-[var(--text-bright)]">
                        {formatCurrency(Number(bet.amount))}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]">
                        → {formatCurrency(Number(bet.potentialPayout))}
                      </div>
                    </div>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/profile",     label: "Meu Perfil",    desc: "Estatísticas detalhadas" },
          { href: "/leaderboard", label: "Leaderboard",   desc: "Ranking da comunidade" },
          { href: "/games/dota2", label: "Apostar",       desc: "Dota 2 · Odds ao vivo" },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href}>
            <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4 hover:border-[var(--border-mid)] hover:bg-[var(--surface-3)] transition-all group">
              <div className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)] mb-1 group-hover:text-[var(--neon)] transition-colors">
                {label}
              </div>
              <div className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
