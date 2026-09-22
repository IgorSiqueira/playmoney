import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TRUST_TIERS, countSettledBets, getTrustTierMaxAmount } from "@/lib/bet-guards";

/**
 * Retorna a faixa de confiança atual do usuário: quantas apostas já foram
 * liquidadas, o teto de valor por aposta vigente e quantas apostas faltam
 * para a próxima faixa (quando houver uma acima da atual).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const settledBetsCount = await countSettledBets(session.user.id);
  const maxAmount = getTrustTierMaxAmount(settledBetsCount);

  const nextTier = TRUST_TIERS.find((t) => t.minSettledBets > settledBetsCount);
  const graduated = maxAmount === null;

  return NextResponse.json({
    settledBetsCount,
    maxAmount, // null = sem teto de trust tier (usuário graduado)
    graduated,
    nextTier: nextTier
      ? { betsUntilNextTier: nextTier.minSettledBets - settledBetsCount, nextMaxAmount: nextTier.maxBetAmount }
      : null,
  });
}
