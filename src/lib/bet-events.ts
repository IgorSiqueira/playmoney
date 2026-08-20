/**
 * bet-events.ts — Tipos de aposta em eventos in-game do Dota 2.
 *
 * Cada evento tem:
 *  - metadados de exibição (label, description, unit)
 *  - cálculo de odds baseado na média histórica do jogador
 *  - verificação do resultado a partir dos dados da partida (OpenDota)
 */

import type { OpenDotaMatchPlayer } from "./opendota";

const HOUSE_EDGE = 0.08;
const MAX_ODDS   = 1.80;

// ── Estatística ────────────────────────────────────────────────────────────────

/**
 * CDF da distribuição normal padrão — aproximação Abramowitz & Stegun 26.2.17.
 * Erro máximo < 7.5e-8 em todo o domínio real.
 */
function normalCDF(z: number): number {
  const a = [0.319381530, -0.356563782, 1.781477937, -1.821255978, 1.330274429];
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly = t * (a[0] + t * (a[1] + t * (a[2] + t * (a[3] + t * a[4]))));
  const pdf  = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const tail = pdf * poly;
  return z >= 0 ? 1 - tail : tail;
}

export type StatDistribution = "poisson" | "normal";

// ── Definições de eventos ──────────────────────────────────────────────────────

export const EVENT_TYPES = {
  WIN_LOSS: {
    label: "Resultado",
    description: "Resultado final da partida",
    unit: "",
    hasTarget: false,
  },
  KILLS: {
    label: "Abates",
    description: "Quantidade de abates na partida",
    unit: "kills",
    hasTarget: true,
    min: 0,
    max: 30,
    step: 1,
  },
  ASSISTS: {
    label: "Assistências",
    description: "Quantidade de assistências na partida",
    unit: "assists",
    hasTarget: true,
    min: 0,
    max: 40,
    step: 1,
  },
  GPM: {
    label: "GPM",
    description: "Ouro por minuto médio na partida",
    unit: "GPM",
    hasTarget: true,
    min: 100,
    max: 1000,
    step: 50,
  },
} as const;

export type EventType = keyof typeof EVENT_TYPES;

// ── Odds por evento ────────────────────────────────────────────────────────────

/**
 * Calcula P(stat > target) com base na média histórica usando a distribuição
 * estatística apropriada para cada tipo de dado:
 *
 * - "poisson": dados de contagem (kills, assists) — Poisson normal approx com
 *   correção de continuidade: z = (avg − target − 0.5) / √avg
 * - "normal": dados contínuos (GPM, XPM) — Normal(μ=avg, σ=avg×CV) com CV
 *   empírico de 0.22 para stats de economia no Dota 2:
 *   z = (avg − target) / (avg × 0.22)
 *
 * Resultado clamped em [0.05, 0.95] — a distribuição cuida das probabilidades
 * extremas de forma muito mais precisa do que um clamp em [0.20, 0.80].
 */
export function calcOverProbability(
  average: number,
  target: number,
  dist: StatDistribution = "poisson",
): number {
  if (average <= 0) return 0.5;

  let z: number;
  if (dist === "poisson") {
    // Aproximação normal de Poisson(λ=average) com correção de continuidade
    z = (average - target - 0.5) / Math.sqrt(average);
  } else {
    // Normal(μ=average, σ=average×CV) — CV ≈ 0.22 para GPM/XPM no Dota
    z = (average - target) / (average * 0.22);
  }

  return Math.max(0.05, Math.min(0.95, normalCDF(z)));
}

export interface ComboCondition {
  type: "KILLS" | "ASSISTS" | "GPM" | "XPM";
  threshold: number;
}

export interface ComboOddsResult {
  odds: number;
  combinedProbability: number;
  isCombo: boolean;
}

/**
 * Calcula odds de uma aposta WIN com condições adicionais de stats.
 * Combos não têm teto de odd (MAX_ODDS); apostas simples sim.
 */
export function calculateComboOdds(
  winProbability: number,
  conditions: ComboCondition[],
  stats: { averageKills: number; averageAssists: number; averageGPM: number; averageXPM: number },
): ComboOddsResult {
  let combinedProb = winProbability;
  for (const cond of conditions) {
    const avg =
      cond.type === "KILLS"   ? stats.averageKills
      : cond.type === "ASSISTS" ? stats.averageAssists
      : cond.type === "GPM"     ? stats.averageGPM
      : stats.averageXPM;
    const dist: StatDistribution = (cond.type === "GPM" || cond.type === "XPM") ? "normal" : "poisson";
    combinedProb *= calcOverProbability(avg, cond.threshold, dist);
  }
  const isCombo = conditions.length > 0;
  const rawOdds = (1 / combinedProb) * (1 - HOUSE_EDGE);
  return {
    odds: parseFloat((isCombo ? rawOdds : Math.min(MAX_ODDS, rawOdds)).toFixed(2)),
    combinedProbability: combinedProb,
    isCombo,
  };
}

// ── Verificação do resultado ───────────────────────────────────────────────────

/**
 * Verifica se o jogador ganhou a aposta de evento in-game.
 *
 * @param eventType  Tipo do evento (KILLS, ASSISTS, GPM)
 * @param prediction "OVER" ou "UNDER"
 * @param targetValue Valor alvo
 * @param player     Dados do jogador na partida (OpenDota)
 * @returns true se a aposta foi ganha, false se perdida
 */
export function verifyEventOutcome(
  eventType: string,
  prediction: string,
  targetValue: number,
  player: OpenDotaMatchPlayer
): boolean {
  let actual: number;

  switch (eventType) {
    case "KILLS":   actual = player.kills;               break;
    case "ASSISTS": actual = player.assists;             break;
    case "GPM":     actual = player.gold_per_min;        break;
    case "XPM":
      // xp_per_min pode estar ausente no endpoint /matches/{id} — se vier nulo,
      // não podemos julgar a condição: lançamos erro para que o settle rejeite
      // e o usuário receba uma mensagem clara em vez de perder por dados faltantes.
      if (player.xp_per_min === undefined || player.xp_per_min === null) {
        throw new Error("XPM_NOT_AVAILABLE");
      }
      actual = player.xp_per_min;
      break;
    default:
      throw new Error(`Tipo de evento desconhecido: ${eventType}`);
  }

  if (prediction === "OVER")  return actual > targetValue;
  if (prediction === "UNDER") return actual < targetValue;
  throw new Error(`Predição inválida para evento: ${prediction}`);
}

/** Formata o alvo para exibição */
export function formatEventTarget(eventType: EventType, targetValue: number): string {
  const cfg = EVENT_TYPES[eventType];
  if (!cfg.hasTarget) return "";
  return `${targetValue} ${cfg.unit}`;
}

/** Retorna a descrição completa de uma aposta de evento */
export function describeEventBet(eventType: string, prediction: string, targetValue?: number): string {
  if (eventType === "WIN_LOSS") {
    return "Aposta em Vitória";
  }
  const cfg = EVENT_TYPES[eventType as EventType];
  const dir = prediction === "OVER" ? "Acima de" : "Abaixo de";
  return `${cfg?.label ?? eventType} — ${dir} ${targetValue} ${cfg?.unit ?? ""}`.trim();
}
