import { prisma } from "./prisma";
import { fetchMatchDetails } from "./opendota";
import type { RiskSignal, Prisma } from "@prisma/client";

const SUSPEND_SCORE = 70;

// PARTY_RECURRENCE e WEAK_ENEMIES ficam como sinais para o admin,
// mas não disparam auto-suspensão — a proteção acontece na liquidação.
const AUTO_SUSPEND_SIGNALS: RiskSignal[] = ["BET_ACCURACY", "WIN_RATE_SPIKE"];

interface SignalResult {
  score: number;
  detail: Prisma.InputJsonValue;
}

// ── Upsert de flag ────────────────────────────────────────────────────────────

async function upsertFlag(userId: string, signal: RiskSignal, result: SignalResult) {
  const existing = await prisma.riskFlag.findFirst({
    where: { userId, signal, reviewedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
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

// ── API pública ───────────────────────────────────────────────────────────────

/** Roda BET_ACCURACY + WIN_RATE_SPIKE. Chamado após cada liquidação de aposta. */
export async function evaluateBetSignals(userId: string) {
  const [acc, spike] = await Promise.all([
    evalBetAccuracy(userId),
    evalWinRateSpike(userId),
  ]);

  await Promise.all([
    acc   ? upsertFlag(userId, "BET_ACCURACY",   acc)   : null,
    spike ? upsertFlag(userId, "WIN_RATE_SPIKE",  spike) : null,
  ]);

  await refreshSuspension(userId);
}

/**
 * Roda PARTY_RECURRENCE + WEAK_ENEMIES e atualiza knownTeammates no perfil.
 * Chamado no sync do perfil (fire-and-forget).
 *
 * knownTeammates: todos os account IDs que jogaram no mesmo time nas últimas
 * partidas analisadas. Usado na liquidação para cancelar apostas quando o
 * jogador submete uma partida com alguém desse histórico no seu time.
 */
export async function evaluateMatchSignals(userId: string) {
  const profile = await prisma.gameProfile.findFirst({
    where: { userId, game: "DOTA2" },
    select: { externalId: true, stats: true },
  });
  if (!profile) return;

  const accountId = Number(profile.externalId);
  const statsObj = profile.stats as { recentMatches?: Array<{ match_id: number }> };
  const matchIds = (statsObj.recentMatches ?? []).slice(0, 10).map((m) => m.match_id);
  if (matchIds.length < 5) return;

  // Busca detalhes de todas as partidas uma única vez
  const rawDetails = await Promise.all(matchIds.map((id) => fetchMatchDetails(String(id))));
  const details = rawDetails.filter((m): m is NonNullable<typeof m> => m !== null);
  if (details.length < 3) return;

  // Itera uma vez para extrair knownTeammates + dados dos dois sinais
  const knownTeammates = new Set<number>();
  const partyFrequency: Record<number, number> = {};
  const enemyFrequency: Record<number, number> = {};
  let analyzed = 0;

  for (const match of details) {
    const us = match.players.find((p) => p.account_id === accountId);
    if (!us) continue;
    analyzed++;

    const ourSideRadiant = us.player_slot < 128;

    for (const p of match.players) {
      if (!p.account_id || p.account_id === accountId) continue;
      const isTeammate = (p.player_slot < 128) === ourSideRadiant;

      if (isTeammate) {
        knownTeammates.add(p.account_id);
        if (us.party_id && p.party_id === us.party_id) {
          partyFrequency[p.account_id] = (partyFrequency[p.account_id] ?? 0) + 1;
        }
      } else {
        enemyFrequency[p.account_id] = (enemyFrequency[p.account_id] ?? 0) + 1;
      }
    }
  }

  // Persiste knownTeammates no stats do perfil
  const currentStats = profile.stats as Record<string, unknown>;
  await prisma.gameProfile.update({
    where: { userId_game: { userId, game: "DOTA2" } },
    data: { stats: { ...currentStats, knownTeammates: [...knownTeammates] } },
  });

  // PARTY_RECURRENCE
  const partySuspicious = Object.entries(partyFrequency)
    .map(([id, count]) => ({ accountId: Number(id), count, ratio: parseFloat((count / analyzed).toFixed(3)) }))
    .filter((e) => e.ratio >= 0.5)
    .sort((a, b) => b.ratio - a.ratio);

  const partyResult: SignalResult | null = partySuspicious.length > 0 ? {
    score: Math.min(100, Math.round(((partySuspicious[0].ratio - 0.5) / 0.5) * 100)),
    detail: { suspicious: partySuspicious, matchesAnalyzed: analyzed },
  } : null;

  // WEAK_ENEMIES
  const enemySuspicious = analyzed >= 5
    ? Object.entries(enemyFrequency)
        .map(([id, count]) => ({ accountId: Number(id), count, ratio: parseFloat((count / analyzed).toFixed(3)) }))
        .filter((e) => e.ratio >= 0.3)
        .sort((a, b) => b.ratio - a.ratio)
    : [];

  const enemiesResult: SignalResult | null = enemySuspicious.length > 0 ? {
    score: Math.min(100, Math.round(((enemySuspicious[0].ratio - 0.3) / 0.7) * 100)),
    detail: { suspicious: enemySuspicious, matchesAnalyzed: analyzed },
  } : null;

  await Promise.all([
    partyResult   ? upsertFlag(userId, "PARTY_RECURRENCE", partyResult)   : null,
    enemiesResult ? upsertFlag(userId, "WEAK_ENEMIES",      enemiesResult) : null,
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
