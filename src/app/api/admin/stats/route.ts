import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Verificar role admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const [
    totalUsers,
    totalBets,
    activeBets,
    wonBets,
    lostBets,
    houseRevenue,
    housePayout,
    recentBets,
    flaggedUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.bet.count(),
    prisma.bet.count({ where: { status: "ACTIVE" } }),
    prisma.bet.count({ where: { status: "WON" } }),
    prisma.bet.count({ where: { status: "LOST" } }),

    // Receita = soma das apostas perdidas pelos usuários
    prisma.transaction.aggregate({
      where: { type: "BET_LOST", status: "COMPLETED" },
      _sum: { amount: true },
    }),

    // Payout = soma das apostas ganhas pelos usuários
    prisma.transaction.aggregate({
      where: { type: "BET_WON", status: "COMPLETED" },
      _sum: { amount: true },
    }),

    // Últimas 10 apostas liquidadas
    prisma.bet.findMany({
      where: { status: { in: ["WON", "LOST"] } },
      orderBy: { settledAt: "desc" },
      take: 10,
      include: { gameProfile: { select: { displayName: true } } },
    }),

    // Usuários com padrão suspeito (taxa LOSE bet wins > 70%)
    prisma.bet.groupBy({
      by: ["userId"],
      where: { prediction: "LOSE", status: { in: ["WON", "LOST"] } },
      _count: { status: true },
    }),
  ]);

  const revenue = Number(houseRevenue._sum.amount ?? 0);
  const payout  = Number(housePayout._sum.amount ?? 0);
  const profit  = revenue - payout;

  // Exposição atual: soma dos potentialPayout das apostas ativas
  const activeExposure = await prisma.bet.aggregate({
    where: { status: "ACTIVE" },
    _sum: { potentialPayout: true, amount: true },
  });

  return NextResponse.json({
    users: { total: totalUsers },
    bets: { total: totalBets, active: activeBets, won: wonBets, lost: lostBets },
    finance: {
      revenue,
      payout,
      profit,
      profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0",
      activeExposure: Number(activeExposure._sum.potentialPayout ?? 0),
      activeBetsAmount: Number(activeExposure._sum.amount ?? 0),
    },
    recentSettlements: recentBets.map((b) => ({
      id: b.id,
      player: b.gameProfile.displayName,
      amount: Number(b.amount),
      payout: Number(b.potentialPayout),
      status: b.status,
      settledAt: b.settledAt,
    })),
    flaggedCount: flaggedUsers.length,
  });
}
