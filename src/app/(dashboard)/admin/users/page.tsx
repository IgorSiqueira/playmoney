import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, ShieldAlert, Ban, CheckCircle2 } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true,
      createdAt: true, selfExcludedUntil: true, agreedToTermsAt: true,
      wallet: { select: { balance: true, bonusBalance: true } },
      bets: {
        select: { status: true, amount: true, potentialPayout: true },
      },
      gameProfiles: { select: { game: true, displayName: true } },
    },
  });

  const rows = users.map((u) => {
    const won      = u.bets.filter((b) => b.status === "WON");
    const lost     = u.bets.filter((b) => b.status === "LOST");
    const active   = u.bets.filter((b) => b.status === "ACTIVE");
    const settled  = won.length + lost.length;
    const totalWon  = won.reduce((s, b)  => s + Number(b.potentialPayout), 0);
    const totalLost = lost.reduce((s, b) => s + Number(b.amount), 0);
    const pnl      = totalWon - totalLost;
    const winRate  = settled > 0 ? Math.round((won.length / settled) * 100) : null;
    const isExcluded = u.selfExcludedUntil && new Date(u.selfExcludedUntil) > new Date();
    return { ...u, won: won.length, lost: lost.length, active: active.length, settled, pnl, winRate, isExcluded };
  });

  // Summary stats
  const totalBalance = rows.reduce((s, u) => s + Number(u.wallet?.balance ?? 0), 0);
  const totalBets    = rows.reduce((s, u) => s + u.bets.length, 0);
  const excluded     = rows.filter((u) => u.isExcluded).length;

  return (
    <div className="space-y-8 pb-8">
      <Breadcrumb
        pageTitle="Usuários"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin", href: "/admin" }, { label: "Usuários" }]}
      />
      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--danger)] uppercase mb-1">▸ Admin · Restrito</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Usuários</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">{rows.length} contas registradas na plataforma</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Users,       label: "Total Usuários", value: String(rows.length),         color: "var(--blue)" },
          { icon: TrendingUp,  label: "Saldo Circulando", value: formatCurrency(totalBalance), color: "var(--neon)" },
          { icon: ShieldAlert, label: "Total de Apostas",  value: String(totalBets),           color: "var(--gold)" },
          { icon: Ban,         label: "Auto-Excluídos",    value: String(excluded),             color: "var(--danger)" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">{label}</span>
              <Icon size={11} style={{ color }} />
            </div>
            <div className="font-mono text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-0.5 h-4 bg-[var(--danger)]" />
          <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">Todos os Usuários</span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_5rem_5rem_4rem_4rem_5rem_6rem] gap-2 px-4 py-2 border-b border-[var(--border)]">
          {["Usuário", "Saldo", "P&L", "WR%", "Apostas", "Status", "Cadastro"].map((h) => (
            <span key={h} className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">{h}</span>
          ))}
        </div>

        <div className="space-y-0.5 mt-1">
          {rows.map((u) => {
            const hasGame = u.gameProfiles.length > 0;
            return (
              <div
                key={u.id}
                className="grid grid-cols-[1fr_5rem_5rem_4rem_4rem_5rem_6rem] gap-2 items-center px-4 py-3 border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-mid)] transition-colors"
                style={{ borderColor: u.isExcluded ? "rgba(255,58,110,0.3)" : undefined }}
              >
                {/* User info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border border-[var(--border)] bg-[var(--surface-1)] flex items-center justify-center shrink-0">
                      <span className="font-display text-[11px] font-black text-[var(--neon)]">
                        {u.name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-ui text-sm font-semibold text-[var(--text-bright)] truncate">{u.name ?? "—"}</div>
                      <div className="font-mono text-[11px] text-[var(--text-muted)] truncate">{u.email}</div>
                    </div>
                  </div>
                  {hasGame && (
                    <div className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5 ml-8">
                      {u.gameProfiles.map((g) => g.displayName ?? g.game).join(", ")}
                    </div>
                  )}
                </div>

                {/* Balance */}
                <div>
                  <div className="font-mono text-xs text-[var(--neon)]">
                    {formatCurrency(Number(u.wallet?.balance ?? 0))}
                  </div>
                  {Number(u.wallet?.bonusBalance ?? 0) > 0 && (
                    <div className="font-mono text-[11px] text-[var(--gold)]">
                      +{formatCurrency(Number(u.wallet!.bonusBalance))} bônus
                    </div>
                  )}
                </div>

                {/* P&L */}
                <div className="flex items-center gap-1">
                  {u.pnl >= 0
                    ? <TrendingUp size={9} className="text-[var(--neon)] shrink-0" />
                    : <TrendingDown size={9} className="text-[var(--danger)] shrink-0" />
                  }
                  <span className="font-mono text-xs font-bold"
                    style={{ color: u.pnl >= 0 ? "var(--neon)" : "var(--danger)" }}>
                    {u.pnl >= 0 ? "+" : ""}{formatCurrency(u.pnl)}
                  </span>
                </div>

                {/* Win Rate */}
                <span className="font-mono text-xs"
                  style={{ color: u.winRate === null ? "var(--text-muted)" : u.winRate >= 50 ? "var(--neon)" : "var(--danger)" }}>
                  {u.winRate !== null ? `${u.winRate}%` : "—"}
                </span>

                {/* Bets */}
                <div className="font-mono text-xs text-[var(--text-muted)]">
                  <div>{u.bets.length} total</div>
                  {u.active > 0 && <div className="text-[var(--gold)]">{u.active} ativas</div>}
                </div>

                {/* Status badges */}
                <div className="flex flex-col gap-0.5">
                  {u.role === "ADMIN" && <Badge variant="destructive">Admin</Badge>}
                  {u.isExcluded && <Badge variant="destructive">Excluído</Badge>}
                  {u.agreedToTermsAt && !u.isExcluded && <Badge variant="default">Verificado</Badge>}
                  {!u.agreedToTermsAt && !u.isExcluded && <Badge variant="secondary">Pendente</Badge>}
                </div>

                {/* Created at */}
                <span className="font-mono text-[11px] text-[var(--text-muted)]">{formatDate(u.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
