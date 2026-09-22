import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TRUST_TIERS, countSettledBets, getTrustTierMaxAmount, isTrustTierLocked } from "@/lib/bet-guards";

/**
 * Retorna a faixa de confiança atual do usuário: quantas apostas já foram
 * liquidadas, o teto de valor por aposta vigente, se as apostas estão
 * travadas (usuário ultrapassou a última faixa configurada) e quantas
 * apostas faltam para a próxima faixa (quando houver uma acima da atual).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const settledBetsCount = await countSettledBets(session.user.id);
  const locked = isTrustTierLocked(settledBetsCount);
  const maxAmount = locked ? null : getTrustTierMaxAmount(settledBetsCount);

  const nextTier = TRUST_TIERS.find((t) => t.minSettledBets > settledBetsCount);

  return NextResponse.json({
    settledBetsCount,
    maxAmount, // null = sem teto vigente (locked=true) ou já graduado (locked=false, sem faixa acima)
    locked,
    nextTier: nextTier
      ? { betsUntilNextTier: nextTier.minSettledBets - settledBetsCount, nextMaxAmount: nextTier.maxBetAmount }
      : null,
  });
}
