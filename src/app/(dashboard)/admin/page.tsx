import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, TrendingUp, TrendingDown, Users,
  Activity, DollarSign, AlertTriangle, Swords, ChevronRight,
} from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id }, select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") redirect("/dashboard");

  const [
    totalUsers, totalBets, activeBets,
    revenue, payout, activeExposure,
    recentSettlements,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.bet.count(),
    prisma.bet.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.aggregate({ where: { type: "BET_LOST",  status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "BET_WON",   status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.bet.aggregate({          where: { status: "ACTIVE" }, _sum: { potentialPayout: true } }),
    prisma.bet.findMany({
      where: { status: { in: ["WON", "LOST"] } },
      orderBy: { settledAt: "desc" },
      take: 5,
      include: { gameProfile: { select: { displayName: true } }, user: { select: { name: true } } },
    }),
  ]);

  const rev     = Number(revenue._sum.amount ?? 0);
  const pay     = Number(payout._sum.amount ?? 0);
  const profit  = rev - pay;
  const exposure = Number(activeExposure._sum.potentialPayout ?? 0);

  const huds = [
    { icon: DollarSign,   label: "Receita Total",     value: formatCurrency(rev),     color: "var(--neon)",   glow: "rgba(0,255,157,0.5)" },
    { icon: TrendingDown, label: "Payout Total",       value: formatCurrency(pay),     color: "var(--danger)", glow: "rgba(255,58,110,0.5)" },
    { icon: TrendingUp,   label: "Lucro da Casa",      value: formatCurrency(profit),  color: profit >= 0 ? "var(--neon)" : "var(--danger)", glow: profit >= 0 ? "rgba(0,255,157,0.5)" : "rgba(255,58,110,0.5)" },
    { icon: Activity,     label: "Exposição Ativa",    value: formatCurrency(exposure), color: "var(--gold)",   glow: "rgba(255,184,0,0.5)" },
    { icon: Users,        label: "Usuários",            value: String(totalUsers),      color: "var(--blue)",   glow: "rgba(0,207,255,0.5)" },
    { icon: Swords,       label: "Total de Apostas",   value: String(totalBets),        color: "var(--text-bright)", glow: "rgba(255,255,255,0.3)" },
    { icon: AlertTriangle,label: "Apostas Ativas",     value: String(activeBets),       color: "var(--gold)",   glow: "rgba(255,184,0,0.5)" },
    { icon: ShieldAlert,  label: "Margem da Casa",     value: rev > 0 ? `${((profit/rev)*100).toFixed(1)}%` : "—", color: "var(--neon)", glow: "rgba(0,255,157,0.5)" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="font-display text-[10px] tracking-[0.3em] text-[var(--danger)] uppercase mb-1">▸ Painel Restrito</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Admin</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">Visão operacional da casa</p>
      </div>

      {/* HUD stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {huds.map(({ icon: Icon, label, value, color, glow }) => (
          <div key={label} className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] p-4 hover:border-[var(--border-mid)] transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">{label}</span>
              <Icon size={12} style={{ color }} />
            </div>
            <div className="font-mono text-xl font-bold" style={{ color, textShadow: `0 0 12px ${glow}` }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Liquidações recentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-[var(--danger)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">
              Liquidações Recentes
            </span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/settlements" className="flex items-center gap-1">
              Ver todas <ChevronRight size={10} />
            </Link>
          </Button>
        </div>
        <div className="space-y-1.5">
          {recentSettlements.map((bet) => {
            const won = bet.status === "WON";
            return (
              <div key={bet.id} className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 hover:border-[var(--border-mid)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 border flex items-center justify-center shrink-0"
                    style={{ borderColor: won ? "rgba(0,255,157,0.4)" : "rgba(255,58,110,0.4)" }}>
                    {won ? <TrendingDown size={12} className="text-[var(--danger)]" /> : <TrendingUp size={12} className="text-[var(--neon)]" />}
                  </div>
                  <div>
                    <div className="font-ui text-sm font-semibold text-[var(--text-bright)]">
                      {bet.user.name} · {bet.gameProfile.displayName}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {bet.settledAt ? formatDate(bet.settledAt) : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="font-mono text-sm text-[var(--text-bright)]">{formatCurrency(Number(bet.amount))}</div>
                    {won && (
                      <div className="font-mono text-[10px] text-[var(--danger)]">
                        −{formatCurrency(Number(bet.potentialPayout))} casa
                      </div>
                    )}
                    {!won && (
                      <div className="font-mono text-[10px] text-[var(--neon)]">
                        +{formatCurrency(Number(bet.amount))} casa
                      </div>
                    )}
                  </div>
                  <Badge variant={won ? "destructive" : "default"}>{won ? "User Ganhou" : "Casa Ganhou"}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
