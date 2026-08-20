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

// Calibração do modelo de probabilidade por condição:
//   threshold < avg      → P = 0.999  → odds combinada ≈ 1.92× (aumento mínimo)
//   threshold = avg      → P ≈ 90%   → odds combinada ≈ 2.75× (aumento pequeno)
//   threshold = 2 × avg  → P ≈ 67%   → odds combinada ≈ 9×  (aposta difícil)
// Derivação: 0.51 × 0.90^4 = 0.335 → odds 2.75× → K = normalCDF⁻¹(0.90) = 1.28
//            0.51 × 0.67^4 = 0.103 → odds 9.0×  → SLOPE = 1.28 − 0.44 = 0.84
const COND_K     = 1.28;
const COND_SLOPE = 0.84;

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
 * P(stat > target | média histórica do jogador).
 *
 * Usa distância relativa à própria média do jogador — não depende de
 * distribuição específica por tipo de stat. Comportamento calibrado:
 *   - threshold = avg      → P ≈ 82% (aposta fácil, casa favorecida)
 *   - threshold = 2 × avg  → P ≈ 67% (combo 5-leg ≈ 9× de odd)
 */
export function calcOverProbability(average: number, target: number): number {
  if (average <= 0) return 0.5;
  const pctAbove = (target - average) / average;
  // Abaixo da média: P fixo em 0.999 → contribuição mínima para a odd combinada.
  // 4 condições abaixo do avg com WIN 48%: 0.48 × 0.999^4 = 0.478 → odds ≈ 1.92×
  if (pctAbove < 0) return 0.999;
  // Na média ou acima: queda proporcional (2.75× na média, 9× no dobro)
  return Math.max(0.05, Math.min(0.95, normalCDF(COND_K - pctAbove * COND_SLOPE)));
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
    combinedProb *= calcOverProbability(avg, cond.threshold);
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
