import type { PlayerStats } from "./opendota";

const HOUSE_EDGE = 0.08; // 8% margem da casa
const MAX_ODDS   = 1.80; // teto de odd para limitar exposição da casa

interface OddsResult {
  winOdds: number;
  loseOdds: number;
  winProbability: number;
  loseProbability: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

function rankTierToMmrBonus(rankTier?: number): number {
  if (!rankTier) return 0;
  const medal = Math.floor(rankTier / 10);
  const star = rankTier % 10;
  // medal: 1=Herald, 2=Guardian, 3=Crusader, 4=Archon, 5=Legend, 6=Ancient, 7=Divine, 8=Immortal
  const baseBonus = (medal - 4) * 0.03; // centralize em Archon
  const starBonus = (star - 3) * 0.005;
  return baseBonus + starBonus;
}

export function calculateOdds(stats: PlayerStats): OddsResult {
  let winProbability = stats.recentWinRate;

  // Ajuste por KDA
  const kdaAdjustment = (stats.averageKDA - 2.0) * 0.02;
  winProbability += kdaAdjustment;

  // Ajuste por rank
  const rankBonus = rankTierToMmrBonus(stats.rankTier);
  winProbability += rankBonus;

  // Clamp entre 25% e 75%
  winProbability = Math.max(0.25, Math.min(0.75, winProbability));

  const loseProbability = 1 - winProbability;

  // Odds com house edge (decimal odds)
  const rawWinOdds = 1 / winProbability;
  const rawLoseOdds = 1 / loseProbability;

  const winOdds  = parseFloat((Math.min(MAX_ODDS, rawWinOdds  * (1 - HOUSE_EDGE))).toFixed(2));
  const loseOdds = parseFloat((Math.min(MAX_ODDS, rawLoseOdds * (1 - HOUSE_EDGE))).toFixed(2));

  let riskLevel: "LOW" | "MEDIUM" | "HIGH";
  if (winProbability >= 0.6) riskLevel = "LOW";
  else if (winProbability >= 0.45) riskLevel = "MEDIUM";
  else riskLevel = "HIGH";

  return {
    winOdds,
    loseOdds,
    winProbability,
    loseProbability,
    riskLevel,
  };
}

export function calculatePayout(amount: number, odds: number): number {
  return parseFloat((amount * odds).toFixed(2));
}

export function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case "LOW":
      return "text-green-400";
    case "MEDIUM":
      return "text-yellow-400";
    case "HIGH":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export function getRiskLabel(riskLevel: string) {
  switch (riskLevel) {
    case "LOW":
      return "Baixo Risco";
    case "MEDIUM":
      return "Risco Médio";
    case "HIGH":
      return "Alto Risco";
    default:
      return "Desconhecido";
  }
}
