import { prisma } from "./prisma";
import { fetchMatchDetails } from "./opendota";
import type { RiskSignal, Prisma } from "@prisma/client";

const SUSPEND_SCORE = 70;

interface SignalResult {
  score: number;
  detail: Prisma.InputJsonValue;
}

// ── Upsert de flag ────────────────────────────────────────────────────────────

async function upsertFlag(
  userId: string,
  signal: RiskSignal,
  result: SignalResult
) {
  const existing = await prisma.riskFlag.findFirst({
    where: { userId, signal, reviewedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    // Só atualiza se o score piorou
    if (result.score <= existing.score) return;
    await prisma.riskFlag.update({
      where: { id: existing.id },
      data: { score: result.score, detail: result.detail },
    });
  } else {
    await prisma.riskFlag.create({
      data: { userId, signal, score: result.score, detail: result.detail },
    });
  }
}

// ── Atualiza suspensão do usuário ────────────────────────────────────────────
// Auto-suspende apenas por sinais diretos de manipulação de apostas.
// PARTY_RECURRENCE e WEAK_ENEMIES são circunstanciais — só criam flags para o admin.
const AUTO_SUSPEND_SIGNALS: RiskSignal[] = ["BET_ACCURACY", "WIN_RATE_SPIKE"];

async function refreshSuspension(userId: string) {
  const agg = await prisma.riskFlag.aggregate({
    where: { userId, signal: { in: AUTO_SUSPEND_SIGNALS }, reviewedAt: null },
    _max: { score: true },
  });

  const maxScore = agg._max.score ?? 0;

  if (maxScore >= SUSPEND_SCORE) {
    await prisma.user.updateMany({
      where: { id: userId, suspendedAt: null },
      data: { suspendedAt: new Date() },
    });
  } else {
    await prisma.user.updateMany({
      where: { id: userId, NOT: { suspendedAt: null } },
      data: { suspendedAt: null },
    });
  }
}

// ── Sinal: BET_ACCURACY ──────────────────────────────────────────────────────
// Win rate de apostas > 75% com >= 5 liquidadas

async function evalBetAccuracy(userId: string): Promise<SignalResult | null> {
  const bets = await prisma.bet.findMany({
    where: { userId, status: { in: ["WON", "LOST"] } },
    select: { status: true },
  });

  if (bets.length < 5) return null;

  const won = bets.filter((b) => b.status === "WON").length;
  const winRate = won / bets.length;

  if (winRate <= 0.75) return null;

  return {
    score: Math.min(100, Math.round(((winRate - 0.75) / 0.25) * 100)),
    detail: { winRate, won, lost: bets.length - won, total: bets.length },
  };
}

// ── Sinal: WIN_RATE_SPIKE ────────────────────────────────────────────────────
// Win rate em apostas > histórico do perfil + 20pp, com >= 3 apostas WIN_LOSS

async function evalWinRateSpike(userId: string): Promise<SignalResult | null> {
  const [bets, profile] = await Promise.all([
    prisma.bet.findMany({
      where: { userId, eventType: "WIN_LOSS", status: { in: ["WON", "LOST"] } },
      select: { status: true },
    }),
    prisma.gameProfile.findFirst({
      where: { userId, game: "DOTA2" },
      select: { stats: true },
    }),
  ]);

  if (bets.length < 3 || !profile?.stats) return null;

  const stats = profile.stats as { recentWinRate?: number };
  const historical = stats.recentWinRate ?? 0.5;
  const betWinRate = bets.filter((b) => b.status === "WON").length / bets.length;
  const diff = betWinRate - historical;

  if (diff <= 0.2) return null;

  return {
    score: Math.min(100, Math.round(((diff - 0.2) / 0.3) * 100)),
    detail: {
      betWinRate: parseFloat(betWinRate.toFixed(3)),
      historicalWinRate: parseFloat(historical.toFixed(3)),
      diff: parseFloat(diff.toFixed(3)),
      total: bets.length,
    },
  };
}

// ── Sinal: PARTY_RECURRENCE ──────────────────────────────────────────────────
// Os mesmos Steam IDs aparecem na party do jogador em > 50% das partidas recentes

async function evalPartyRecurrence(userId: string): Promise<SignalResult | null> {
  const profile = await prisma.gameProfile.findFirst({
    where: { userId, game: "DOTA2" },
    select: { externalId: true, stats: true },
  });
  if (!profile) return null;

  const accountId = Number(profile.externalId);
  const stats = profile.stats as { recentMatches?: Array<{ match_id: number }> };
  const matchIds = (stats.recentMatches ?? []).slice(0, 10).map((m) => m.match_id);
  if (matchIds.length < 5) return null;

  const details = await Promise.all(
    matchIds.map((id) => fetchMatchDetails(String(id)))
  );

  const frequency: Record<number, number> = {};
  let analyzed = 0;

  for (const match of details) {
    if (!match) continue;
    const us = match.players.find((p) => p.account_id === accountId);
    if (!us?.party_id) continue;
    analyzed++;

    for (const p of match.players) {
      if (p.account_id === accountId || !p.account_id || p.party_id !== us.party_id) continue;
      frequency[p.account_id] = (frequency[p.account_id] ?? 0) + 1;
    }
  }

  if (analyzed < 3) return null;

  const suspicious = Object.entries(frequency)
    .map(([id, count]) => ({
      accountId: Number(id),
      count,
      ratio: parseFloat((count / analyzed).toFixed(3)),
    }))
    .filter((e) => e.ratio >= 0.5)
    .sort((a, b) => b.ratio - a.ratio);

  if (suspicious.length === 0) return null;

  const maxRatio = suspicious[0].ratio;
  return {
    score: Math.min(100, Math.round(((maxRatio - 0.5) / 0.5) * 100)),
    detail: { suspicious, matchesAnalyzed: analyzed },
  };
}

// ── Sinal: WEAK_ENEMIES ──────────────────────────────────────────────────────
// Os mesmos inimigos aparecem em > 30% das partidas (sugerindo adversários combinados)

async function evalWeakEnemies(userId: string): Promise<SignalResult | null> {
  const profile = await prisma.gameProfile.findFirst({
    where: { userId, game: "DOTA2" },
    select: { externalId: true, stats: true },
  });
  if (!profile) return null;

  const accountId = Number(profile.externalId);
  const stats = profile.stats as { recentMatches?: Array<{ match_id: number }> };
  const matchIds = (stats.recentMatches ?? []).slice(0, 10).map((m) => m.match_id);
  if (matchIds.length < 5) return null;

  const details = await Promise.all(
    matchIds.map((id) => fetchMatchDetails(String(id)))
  );

  const frequency: Record<number, number> = {};
  let analyzed = 0;

  for (const match of details) {
    if (!match) continue;
    const us = match.players.find((p) => p.account_id === accountId);
    if (!us) continue;
    analyzed++;

    const ourSideRadiant = us.player_slot < 128;
    for (const p of match.players) {
      if (!p.account_id || p.account_id === 0) continue;
      const isRadiant = p.player_slot < 128;
      if (isRadiant === ourSideRadiant) continue; // skip teammates
      frequency[p.account_id] = (frequency[p.account_id] ?? 0) + 1;
    }
  }

  if (analyzed < 5) return null;

  const suspicious = Object.entries(frequency)
    .map(([id, count]) => ({
      accountId: Number(id),
      count,
      ratio: parseFloat((count / analyzed).toFixed(3)),
    }))
    .filter((e) => e.ratio >= 0.3)
    .sort((a, b) => b.ratio - a.ratio);

  if (suspicious.length === 0) return null;

  const maxRatio = suspicious[0].ratio;
  return {
    score: Math.min(100, Math.round(((maxRatio - 0.3) / 0.7) * 100)),
    detail: { suspicious, matchesAnalyzed: analyzed },
  };
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Roda BET_ACCURACY + WIN_RATE_SPIKE. Chamado após cada liquidação de aposta. */
export async function evaluateBetSignals(userId: string) {
  const [acc, spike] = await Promise.all([
    evalBetAccuracy(userId),
    evalWinRateSpike(userId),
  ]);

  await Promise.all([
    acc   ? upsertFlag(userId, "BET_ACCURACY",  acc)   : null,
    spike ? upsertFlag(userId, "WIN_RATE_SPIKE", spike) : null,
  ]);

  await refreshSuspension(userId);
}

/** Roda PARTY_RECURRENCE + WEAK_ENEMIES. Chamado no sync do perfil (fire-and-forget). */
export async function evaluateMatchSignals(userId: string) {
  const [party, enemies] = await Promise.all([
    evalPartyRecurrence(userId),
    evalWeakEnemies(userId),
  ]);

  await Promise.all([
    party   ? upsertFlag(userId, "PARTY_RECURRENCE", party)   : null,
    enemies ? upsertFlag(userId, "WEAK_ENEMIES",      enemies) : null,
  ]);

  await refreshSuspension(userId);
}

/** Limpa flags revisadas e recalcula suspensão. Chamado pelo admin ao revisar. */
export async function reviewFlag(flagId: string, adminId: string) {
  await prisma.riskFlag.update({
    where: { id: flagId },
    data: { reviewedAt: new Date(), reviewedBy: adminId },
  });

  const flag = await prisma.riskFlag.findUnique({ where: { id: flagId }, select: { userId: true } });
  if (flag) await refreshSuspension(flag.userId);
}
