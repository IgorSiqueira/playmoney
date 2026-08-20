import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const HOUSE_EDGE = 0.08;
// Bucket width: 5% (20 possible buckets in [0,1])
const BUCKET_SIZE = 0.05;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  // WIN_LOSS bets só — as outras não têm uma "winProbability" recuperável trivialmente
  const bets = await prisma.bet.findMany({
    where: {
      eventType: "WIN_LOSS",
      status: { in: ["WON", "LOST"] },
      createdAt: { gte: cutoff },
    },
    select: { odds: true, status: true },
  });

  if (bets.length < 10) {
    return NextResponse.json({
      insufficient: true,
      totalBets: bets.length,
      message: "Dados insuficientes — mínimo de 10 apostas liquidadas nos últimos 90 dias.",
    });
  }

  // Recupera probabilidade prevista do modelo: odds = (1-HOUSE_EDGE)/winProb
  // → winProb = (1-HOUSE_EDGE)/odds
  type BucketData = { total: number; won: number };
  const buckets = new Map<number, BucketData>();

  let brierSum = 0;

  for (const bet of bets) {
    const odds = Number(bet.odds);
    if (odds <= 0) continue;

    const predictedProb = (1 - HOUSE_EDGE) / odds;
    // Snap to nearest bucket
    const bucket = Math.round(predictedProb / BUCKET_SIZE) * BUCKET_SIZE;
    const bucketKey = parseFloat(bucket.toFixed(2));

    const existing = buckets.get(bucketKey) ?? { total: 0, won: 0 };
    existing.total++;
    if (bet.status === "WON") existing.won++;
    buckets.set(bucketKey, existing);

    const actual = bet.status === "WON" ? 1 : 0;
    brierSum += (predictedProb - actual) ** 2;
  }

  const brierScore = brierSum / bets.length;

  const calibration = Array.from(buckets.entries())
    .map(([predicted, { total, won }]) => ({
      predicted,
      actual: parseFloat((won / total).toFixed(3)),
      count: total,
    }))
    .sort((a, b) => a.predicted - b.predicted);

  // Naive expected GGR: sum of (1 - 1/odds) per bet — the house's theoretical margin per bet
  const expectedGGR = bets.reduce((sum, bet) => {
    const odds = Number(bet.odds);
    return odds > 0 ? sum + (1 - 1 / odds) : sum;
  }, 0);

  const wonCount  = bets.filter(b => b.status === "WON").length;
  const lostCount = bets.filter(b => b.status === "LOST").length;

  return NextResponse.json({
    totalBets: bets.length,
    wonCount,
    lostCount,
    overallWinRate: parseFloat((wonCount / bets.length).toFixed(3)),
    brierScore: parseFloat(brierScore.toFixed(4)),
    brierInterpretation: brierScore < 0.20 ? "bom" : brierScore < 0.25 ? "aceitável" : "ruim",
    expectedGGR: parseFloat(expectedGGR.toFixed(2)),
    calibration,
    period: { from: cutoff.toISOString(), to: new Date().toISOString() },
  });
}
