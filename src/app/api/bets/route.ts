import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateOdds, calculatePayout } from "@/lib/odds";
import { calculatePlayerStats } from "@/lib/opendota";
import { calcEventOdds } from "@/lib/bet-events";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  guardMinMatchHistory, guardMaxPayout, guardProfileFreshness,
  guardDailyWinningsCap, guardSuspiciousThrowPattern, guardBodySize,
  guardSelfExclusion, guardDailyLossLimit, guardWeeklyLossLimit,
} from "@/lib/bet-guards";

const MAX_ACTIVE_BETS_PER_PROFILE = 5;

const createBetSchema = z.object({
  gameProfileId: z.string().min(1),
  prediction:    z.enum(["WIN", "OVER", "UNDER"]),
  amount:        z.number().min(5).max(5000),
  eventType:     z.string().default("WIN_LOSS"),
  targetValue:   z.number().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    include: { gameProfile: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(bets);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;

  const bodySizeGuard = guardBodySize(req.headers.get("content-length"));
  if (!bodySizeGuard.ok) return NextResponse.json({ error: bodySizeGuard.error }, { status: 413 });

  const rl = await rateLimit(`bets:${userId}`, 20, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  const body = await req.json();
  const parsed = createBetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { gameProfileId, prediction, amount, eventType, targetValue } = parsed.data;

  // Validar que over/under tem targetValue
  if ((prediction === "OVER" || prediction === "UNDER") && targetValue === undefined) {
    return NextResponse.json({ error: "Apostas Over/Under requerem um valor alvo." }, { status: 400 });
  }
  if (eventType !== "WIN_LOSS" && prediction === "WIN") {
    return NextResponse.json({ error: "Eventos in-game requerem predição OVER ou UNDER." }, { status: 400 });
  }

  const [user, gameProfile] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { selfExcludedUntil: true, agreedToTermsAt: true, suspendedAt: true } }),
    prisma.gameProfile.findFirst({ where: { id: gameProfileId, userId } }),
  ]);

  // [Risco] Conta suspensa por suspeita de manipulação
  if (user?.suspendedAt) {
    return NextResponse.json(
      { error: "Sua conta está suspensa por atividade suspeita. Entre em contato com o suporte.", code: "ACCOUNT_SUSPENDED" },
      { status: 403 }
    );
  }

  // [Jogo Responsável] Auto-exclusão
  const exclusionGuard = guardSelfExclusion(user?.selfExcludedUntil ?? null);
  if (!exclusionGuard.ok) return NextResponse.json({ error: exclusionGuard.error, code: exclusionGuard.code }, { status: 422 });

  // [Jogo Responsável] Termos aceitos
  if (!user?.agreedToTermsAt) {
    return NextResponse.json({ error: "Você precisa aceitar os Termos de Uso antes de apostar.", code: "TERMS_NOT_ACCEPTED" }, { status: 422 });
  }

  if (!gameProfile) return NextResponse.json({ error: "Perfil de jogo não encontrado" }, { status: 404 });

  const freshnessGuard = guardProfileFreshness(gameProfile.lastSyncAt);
  if (!freshnessGuard.ok) return NextResponse.json({ error: freshnessGuard.error, code: freshnessGuard.code }, { status: 422 });

  const activeBetsCount = await prisma.bet.count({ where: { gameProfileId, userId, status: "ACTIVE" } });
  if (activeBetsCount >= MAX_ACTIVE_BETS_PER_PROFILE) {
    return NextResponse.json({ error: `Limite de ${MAX_ACTIVE_BETS_PER_PROFILE} apostas ativas atingido.` }, { status: 422 });
  }

  // [Jogo Responsável] Limites de perda
  const [dailyLossGuard, weeklyLossGuard] = await Promise.all([
    guardDailyLossLimit(userId, amount),
    guardWeeklyLossLimit(userId, amount),
  ]);
  if (!dailyLossGuard.ok)  return NextResponse.json({ error: dailyLossGuard.error,  code: dailyLossGuard.code  }, { status: 422 });
  if (!weeklyLossGuard.ok) return NextResponse.json({ error: weeklyLossGuard.error, code: weeklyLossGuard.code }, { status: 422 });

  const stats = await calculatePlayerStats(Number(gameProfile.externalId));

  const historyGuard = guardMinMatchHistory(stats);
  if (!historyGuard.ok) return NextResponse.json({ error: historyGuard.error, code: historyGuard.code }, { status: 422 });

  // Calcular odds: WIN_LOSS usa o engine existente; eventos usam calcEventOdds
  let selectedOdds: number;
  if (eventType === "WIN_LOSS") {
    const odds = calculateOdds(stats);
    selectedOdds = prediction === "WIN" ? odds.winOdds : odds.loseOdds;
  } else {
    const eventOdds = calcEventOdds(eventType as never, stats, targetValue!);
    selectedOdds = prediction === "OVER" ? eventOdds.overOdds : eventOdds.underOdds;
  }

  const potentialPayout = calculatePayout(amount, selectedOdds);

  const payoutGuard = guardMaxPayout(potentialPayout);
  if (!payoutGuard.ok) return NextResponse.json({ error: payoutGuard.error, code: payoutGuard.code }, { status: 422 });

  const dailyWinGuard = await guardDailyWinningsCap(userId, potentialPayout);
  if (!dailyWinGuard.ok) return NextResponse.json({ error: dailyWinGuard.error, code: dailyWinGuard.code }, { status: 422 });

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.wallet.updateMany({
      where: { userId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (updated.count === 0) throw new Error("INSUFFICIENT_BALANCE");

    const wallet = await tx.wallet.findUnique({ where: { userId } });
    await tx.transaction.create({
      data: {
        walletId: wallet!.id, type: "BET_PLACED", amount, status: "COMPLETED",
        description: `Aposta Dota 2 — ${eventType === "WIN_LOSS" ? (prediction === "WIN" ? "Vitória" : "Derrota") : `${eventType} ${prediction}`}`,
      },
    });

    const bet = await tx.bet.create({
      data: {
        userId, gameProfileId, prediction, amount, odds: selectedOdds,
        potentialPayout, status: "ACTIVE", eventType,
        targetValue: targetValue ?? null,
        matchData: JSON.parse(JSON.stringify({ stats })),
      },
    });

    return { bet, wallet };
  });

  return NextResponse.json(result, { status: 201 });
}
