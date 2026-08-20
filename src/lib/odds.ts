import type { PlayerStats, PlayerRecentMatch } from "./opendota";

const HOUSE_EDGE = 0.08; // 8% margem da casa
const MAX_ODDS   = 1.80; // teto de odd para limitar exposição da casa

interface OddsResult {
  winOdds: number;
  loseOdds: number;
  winProbability: number;
  loseProbability: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface DynamicOddsFactors {
  baseWinRate: number;
  formAdjustment: number;
  streakAdjustment: number;
  kdaAdjustment: number;
  rankAdjustment: number;
  gpmAdjustment: number;
  xpmAdjustment: number;
  finalProbability: number;
  last5WR: number;
  older15WR: number;
  currentStreak: { count: number; type: "WIN" | "LOSS" | "NONE" };
  form: "hot" | "warming" | "neutral" | "cooling" | "cold";
}

export interface DynamicOddsResult extends OddsResult {
  factors: DynamicOddsFactors;
}

function rankTierToMmrBonus(rankTier?: number): number {
  if (!rankTier) return 0;
  const medal = Math.floor(rankTier / 10);
  const star = rankTier % 10;
  // medal: 1=Herald, 2=Guardian, 3=Crusader, 4=Archon, 5=Legend, 6=Ancient, 7=Divine, 8=Immortal
  const baseBonus = (medal - 4) * 0.03;
  const starBonus = (star - 3) * 0.005;
  return baseBonus + starBonus;
}

function toOdds(probability: number): number {
  return parseFloat(
    (Math.min(MAX_ODDS, (1 / probability) * (1 - HOUSE_EDGE))).toFixed(2)
  );
}

function riskOf(prob: number): "LOW" | "MEDIUM" | "HIGH" {
  if (prob >= 0.6) return "LOW";
  if (prob >= 0.45) return "MEDIUM";
  return "HIGH";
}

/**
 * Dynamic odds using per-match data from the last 20 matches.
 * Considers: recent form (last-5 trend), current streak, KDA, rank, GPM trend.
 */
export function calculateDynamicOdds(
  matches: PlayerRecentMatch[],
  stats: PlayerStats,
): DynamicOddsResult {
  const isWin = (m: PlayerRecentMatch) => (m.player_slot < 128) === m.radiant_win;

  if (matches.length === 0) {
    // No match data — fall back to stats-only calculation
    const base = calculateOdds(stats);
    return {
      ...base,
      factors: {
        baseWinRate: stats.recentWinRate,
        formAdjustment: 0,
        streakAdjustment: 0,
        kdaAdjustment: (stats.averageKDA - 2.0) * 0.02,
        rankAdjustment: rankTierToMmrBonus(stats.rankTier),
        gpmAdjustment: 0,
        xpmAdjustment: 0,
        finalProbability: base.winProbability,
        last5WR: stats.recentWinRate,
        older15WR: stats.recentWinRate,
        currentStreak: { count: 1, type: "NONE" },
        form: "neutral",
      },
    };
  }

  // ── Base win rate ──────────────────────────────────────────────────────────
  const baseWinRate = matches.filter(isWin).length / matches.length;

  // ── Form: last-5 vs matches 6-20 ──────────────────────────────────────────
  const last5 = matches.slice(0, Math.min(5, matches.length));
  const rest  = matches.slice(5);
  const last5WR   = last5.length > 0 ? last5.filter(isWin).length / last5.length : baseWinRate;
  const older15WR = rest.length  > 0 ? rest.filter(isWin).length  / rest.length  : baseWinRate;
  // Amplify the delta: a 20% swing → ±8% adjustment
  const formAdjustment = Math.max(-0.08, Math.min(0.08, (last5WR - older15WR) * 0.4));

  // ── Streak: consecutive same result from most-recent match ────────────────
  const firstWin = isWin(matches[0]);
  let streakCount = 1;
  for (let i = 1; i < matches.length; i++) {
    if (isWin(matches[i]) === firstWin) streakCount++;
    else break;
  }
  const streakSign = firstWin ? 1 : -1;
  // Each match beyond the first in a streak adds ±2%, capped at ±8% (5-match streak)
  const streakAdjustment = streakSign * Math.min(streakCount - 1, 4) * 0.02;
  const streakType: "WIN" | "LOSS" | "NONE" =
    streakCount >= 2 ? (firstWin ? "WIN" : "LOSS") : "NONE";

  // ── KDA factor (same as before) ───────────────────────────────────────────
  const kdaAdjustment = (stats.averageKDA - 2.0) * 0.02;

  // ── Rank factor (same as before) ──────────────────────────────────────────
  const rankAdjustment = rankTierToMmrBonus(stats.rankTier);

  // ── GPM trend: last-5 vs previous-5 ──────────────────────────────────────
  const prev5   = matches.slice(5, 10);
  const lastGPM = last5.reduce((s, m) => s + (m.gold_per_min ?? 0), 0) / last5.length;
  const prevGPM = prev5.length > 0
    ? prev5.reduce((s, m) => s + (m.gold_per_min ?? 0), 0) / prev5.length
    : lastGPM;
  const gpmDelta      = prevGPM > 0 ? (lastGPM - prevGPM) / prevGPM : 0;
  const gpmAdjustment = Math.max(-0.02, Math.min(0.02, gpmDelta * 0.1));

  // ── XPM trend: last-5 vs previous-5 ──────────────────────────────────────
  const lastXPM = last5.reduce((s, m) => s + (m.xp_per_min ?? 0), 0) / last5.length;
  const prevXPM = prev5.length > 0
    ? prev5.reduce((s, m) => s + (m.xp_per_min ?? 0), 0) / prev5.length
    : lastXPM;
  const xpmDelta      = prevXPM > 0 ? (lastXPM - prevXPM) / prevXPM : 0;
  const xpmAdjustment = Math.max(-0.02, Math.min(0.02, xpmDelta * 0.1));

  // ── Final probability (correlation-adjusted) ──────────────────────────────
  // Factors within each cluster are correlated — summing them naively inflates
  // the signal. Each secondary factor is discounted by its intra-cluster corr.
  // Cross-cluster diminishing returns (~0.50 correlation between perf & economy).

  // Cluster 1: recent performance (form + streak) — intra-corr ≈ 0.65
  const performanceAdj = formAdjustment + streakAdjustment * 0.35;
  // Cluster 2: player skill (KDA + rank) — intra-corr ≈ 0.40
  const skillAdj = kdaAdjustment + rankAdjustment * 0.60;
  // Cluster 3: economy (GPM + XPM) — intra-corr ≈ 0.85
  const economyAdj = gpmAdjustment + xpmAdjustment * 0.15;

  const finalProbability = Math.max(
    0.25,
    Math.min(0.75, baseWinRate + performanceAdj + skillAdj * 0.75 + economyAdj * 0.5625),
  );

  // ── Form label ────────────────────────────────────────────────────────────
  const formScore = formAdjustment + streakAdjustment;
  const form: DynamicOddsFactors["form"] =
    formScore >= 0.06 ? "hot"
    : formScore >= 0.02 ? "warming"
    : formScore <= -0.06 ? "cold"
    : formScore <= -0.02 ? "cooling"
    : "neutral";

  return {
    winOdds:         toOdds(finalProbability),
    loseOdds:        toOdds(1 - finalProbability),
    winProbability:  finalProbability,
    loseProbability: 1 - finalProbability,
    riskLevel:       riskOf(finalProbability),
    factors: {
      baseWinRate,
      formAdjustment,
      streakAdjustment,
      kdaAdjustment,
      rankAdjustment,
      gpmAdjustment,
      xpmAdjustment,
      finalProbability,
      last5WR,
      older15WR,
      currentStreak: { count: streakCount, type: streakType },
      form,
    },
  };
}

/** Legacy: stats-only calculation (no match array). Used as fallback. */
export function calculateOdds(stats: PlayerStats): OddsResult {
  let winProbability = stats.recentWinRate;
  winProbability += (stats.averageKDA - 2.0) * 0.02;
  winProbability += rankTierToMmrBonus(stats.rankTier);
  winProbability = Math.max(0.25, Math.min(0.75, winProbability));

  return {
    winOdds:         toOdds(winProbability),
    loseOdds:        toOdds(1 - winProbability),
    winProbability,
    loseProbability: 1 - winProbability,
    riskLevel:       riskOf(winProbability),
  };
}

export function calculatePayout(amount: number, odds: number): number {
  return parseFloat((amount * odds).toFixed(2));
}

export function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case "LOW":    return "text-green-400";
    case "MEDIUM": return "text-yellow-400";
    case "HIGH":   return "text-red-400";
    default:       return "text-gray-400";
  }
}

export function getRiskLabel(riskLevel: string) {
  switch (riskLevel) {
    case "LOW":    return "Baixo Risco";
    case "MEDIUM": return "Risco Médio";
    case "HIGH":   return "Alto Risco";
    default:       return "Desconhecido";
  }
}
