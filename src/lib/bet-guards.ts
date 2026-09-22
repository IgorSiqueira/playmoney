/**
 * bet-guards.ts — Regras anti-exploit para o sistema de apostas.
 *
 * Cada guard retorna { ok, error, code } para facilitar logging e respostas uniformes.
 *
 * Exploit coberto por cada guard:
 *  E2  — Throwing intencional (padrão suspeito de LOSE wins)
 *  E3  — Smurf / stats fabricadas (histórico mínimo)
 *  E4  — KDA inflado (limitado pelo histórico mínimo + peso reduzido no odds engine)
 *  E5  — Odds stale (perfil desatualizado)
 *  E7  — Payout ilimitado (teto por aposta)
 *  E8  — Winnings diários ilimitados (cap diário)
 *  E10 — Janela de liquidação aberta (aposta expirada)
 *  E11 — Partida de dia diferente da aposta
 *  E12 — Aposta criada depois (ou próximo) do fim da partida
 */

import { prisma } from "@/lib/prisma";
import type { PlayerStats, PlayerRecentMatch } from "@/lib/opendota";

// ── Limites configuráveis ──────────────────────────────────────────────────────
export const LIMITS = {
  /** [E3] Mínimo de partidas recentes para calcular odds confiáveis */
  MIN_MATCH_HISTORY: 15,
  /** [E7] Retorno máximo por aposta (R$) */
  MAX_BET_PAYOUT: 10_000,
  /** [E8] Ganhos máximos por dia por usuário (R$) */
  DAILY_WINNINGS_CAP: 5_000,
  /** [E5] Horas até exigir re-sync do perfil */
  PROFILE_MAX_STALENESS_HOURS: 24,
  /** [E2] Taxa mínima de LOSE bets ganhas para considerar suspeito */
  SUSPICIOUS_LOSE_WIN_RATIO: 0.80,
  /** [E2] Mínimo de LOSE bets liquidadas para avaliar o padrão */
  SUSPICIOUS_MIN_SETTLED: 3,
  /** [E10] Dias máximos para liquidar uma aposta após sua criação */
  BET_EXPIRY_DAYS: 1,
  /** [Security 1] Minutos mínimos de antecedência ao início da partida para a aposta ser válida */
  MIN_BET_BEFORE_MATCH_START_MINUTES: 5,
  /** [E12] Minutos mínimos de antecedência ao fim da partida para a aposta ser válida */
  BET_BEFORE_MATCH_END_MINUTES: 15,
  /**
   * [E11] Fuso horário da plataforma para comparação de datas (BRT = UTC-3).
   * Ajuste conforme o público-alvo.
   */
  TIMEZONE_OFFSET_HOURS: -3,
  /**
   * [V1] Lobby types permitidos para apostas.
   *  7 = Ranked Matchmaking (único aceito)
   * OpenDota constants: 0=Normal, 1=Prática, 2=Torneio, 4=Bots, 5=Team Match,
   *                     6=Solo Queue, 7=Ranked, 8=1v1 Mid, 9=Battle Cup
   */
  ALLOWED_LOBBY_TYPES: [7] as number[],
  /**
   * [V2] Duração mínima de partida em segundos (20 minutos).
   * Partidas muito curtas são rendições, stomps ou saídas antecipadas.
   */
  MIN_MATCH_DURATION_SECONDS: 20 * 60,
  /**
   * [V8] Game modes permitidos para apostas (modos competitivos).
   *  1=All Pick, 2=Captains Mode, 3=Random Draft, 4=Single Draft,
   *  5=All Random, 22=Captains Draft
   * Bloqueados: modos triviais ou experimentais
   */
  ALLOWED_GAME_MODES: [1, 2, 3, 4, 5, 22] as number[],
  /** [V7] Tamanho máximo do body em bytes (64 KB) */
  MAX_BODY_BYTES: 65_536,
} as const;

/**
 * [Trust Tier] Limites progressivos de valor máximo por aposta, com base no
 * número de apostas já liquidadas (WON + LOST) do usuário — não importa o
 * resultado, só a experiência acumulada na plataforma.
 *
 * Cada faixa é [minApostas, maxApostas, valorMáximo]. As faixas são avaliadas
 * em ordem; a primeira cujo intervalo contenha o total de apostas liquidadas
 * do usuário define o teto. Quando nenhuma faixa cobre o total (ou seja, o
 * usuário já passou da última faixa), nenhum teto de trust tier é aplicado —
 * o valor máximo passa a ser regido apenas pelos demais limites da plataforma
 * (ex.: MAX_BET_PAYOUT, e o schema de validação em /api/bets).
 *
 * Para ajustar as faixas, edite só este array — nada mais precisa mudar.
 * Exemplo para adicionar uma faixa nova entre a 2ª e a 3ª:
 *   { minSettledBets: 31, maxSettledBets: 40, maxBetAmount: 85 },
 *
 * Quando o usuário ultrapassa a última faixa configurada, o comportamento
 * depende de TRUST_TIER_LOCK_AFTER_LAST logo abaixo.
 */
export const TRUST_TIERS: readonly { minSettledBets: number; maxSettledBets: number; maxBetAmount: number }[] = [
  { minSettledBets: 0,  maxSettledBets: 15, maxBetAmount: 40 },
  { minSettledBets: 16, maxSettledBets: 30, maxBetAmount: 70 },
  { minSettledBets: 31, maxSettledBets: 50, maxBetAmount: 100 },
];

/**
 * [Trust Tier] Controla o que acontece depois que o usuário ultrapassa a
 * última faixa de TRUST_TIERS (hoje, após 50 apostas liquidadas):
 *
 *   true  → apostas ficam travadas (bloqueadas) até uma nova faixa ser
 *           adicionada acima, ou até liberação manual. É o comportamento
 *           atual: travar por padrão assim que o usuário se forma na última
 *           faixa, enquanto não existem faixas maiores configuradas.
 *   false → nenhum teto de trust tier é aplicado; o valor máximo passa a
 *           ser regido só pelos demais limites da plataforma (MAX_BET_PAYOUT
 *           etc.). Use quando quiser "graduar" o usuário em vez de travá-lo.
 *
 * Para reabrir apostas de quem já bateu 50, basta adicionar uma faixa nova
 * em TRUST_TIERS cobrindo o intervalo acima de 50 — a trava só vale para
 * quem está acima da última faixa existente.
 */
export const TRUST_TIER_LOCK_AFTER_LAST = true;

// ── Tipo de retorno padrão ─────────────────────────────────────────────────────
export interface GuardResult {
  ok: boolean;
  error?: string;
  code?: string;
}

// ── Guards síncronos ───────────────────────────────────────────────────────────

/**
 * [E3/E4] Exige histórico mínimo de partidas jogadas *depois* que o perfil
 * ficou público (profilePublicSince) — não o histórico total. Isso impede
 * que o jogador deixe o perfil privado a maior parte do tempo e abra só o
 * suficiente pra "carimbar" a liberação, e também impede que smurfs com
 * poucas partidas manipulem as odds por amostra insignificante.
 *
 * Se o jogador fechar o perfil de novo, profilePublicSince é zerado (ver
 * syncDota2Profile em game-sync.ts) e a contagem recomeça do zero na
 * próxima vez que ele tornar público.
 */
export function guardMinMatchHistory(
  stats: PlayerStats,
  recentMatches: PlayerRecentMatch[],
  profilePublicSince: Date | null
): GuardResult {
  if (stats.profilePrivate) {
    return {
      ok: false,
      error:
        `Seu perfil do Dota 2 está privado para consulta. Para apostar, siga os dois passos: ` +
        `1) No Steam → Editar perfil → Privacidade → defina "Detalhes do jogo" como Público. ` +
        `2) Dentro do próprio Dota 2 → Configurações → Opções Avançadas → ative "Expor Dados de Partida Pública" ` +
        `(sem isso, só a privacidade do Steam não é suficiente). ` +
        `3) Jogue pelo menos ${LIMITS.MIN_MATCH_HISTORY} partidas depois de ativar. ` +
        `4) Volte aqui e sincronize seu perfil novamente.`,
      code: "PROFILE_PRIVATE",
    };
  }

  if (!profilePublicSince) {
    return {
      ok: false,
      error: "Ainda não conseguimos confirmar que seu perfil está público. Sincronize seu perfil novamente para atualizarmos essa informação.",
      code: "PROFILE_NOT_CONFIRMED_PUBLIC",
    };
  }

  const publicSinceMs = profilePublicSince.getTime();
  const matchesSincePublic = recentMatches.filter((m) => m.start_time * 1000 >= publicSinceMs).length;

  if (matchesSincePublic < LIMITS.MIN_MATCH_HISTORY) {
    const missing = LIMITS.MIN_MATCH_HISTORY - matchesSincePublic;
    return {
      ok: false,
      error:
        `Seu perfil está público, mas você só tem ${matchesSincePublic} partida${matchesSincePublic === 1 ? "" : "s"} jogada${matchesSincePublic === 1 ? "" : "s"} desde então ` +
        `— são necessárias pelo menos ${LIMITS.MIN_MATCH_HISTORY}. Jogue mais ${missing} partida${missing === 1 ? "" : "s"} mantendo o perfil público e sincronize novamente. ` +
        `Partidas jogadas antes de tornar o perfil público não contam.`,
      code: "INSUFFICIENT_HISTORY_SINCE_PUBLIC",
    };
  }
  return { ok: true };
}

/**
 * [E7] Limita o retorno máximo por aposta.
 * Controla a exposição máxima da casa em uma única aposta.
 */
export function guardMaxPayout(potentialPayout: number): GuardResult {
  if (potentialPayout > LIMITS.MAX_BET_PAYOUT) {
    return {
      ok: false,
      error: `O retorno máximo por aposta é R$ ${LIMITS.MAX_BET_PAYOUT.toLocaleString("pt-BR")}. Reduza o valor apostado.`,
      code: "MAX_PAYOUT_EXCEEDED",
    };
  }
  return { ok: true };
}

/**
 * [E5] Exige perfil sincronizado recentemente.
 * Odds calculadas sobre dados desatualizados não refletem a habilidade real do jogador.
 */
export function guardProfileFreshness(lastSyncAt: Date | null): GuardResult {
  if (!lastSyncAt) {
    return { ok: false, error: "Sincronize seu perfil antes de apostar.", code: "PROFILE_NOT_SYNCED" };
  }
  const ageHours = (Date.now() - lastSyncAt.getTime()) / (1000 * 60 * 60);
  if (ageHours > LIMITS.PROFILE_MAX_STALENESS_HOURS) {
    return {
      ok: false,
      error: `Seu perfil está desatualizado (${Math.floor(ageHours)}h). Acesse a página do Dota 2 e sincronize antes de apostar.`,
      code: "STALE_PROFILE",
    };
  }
  return { ok: true };
}

/**
 * [E10] Verifica se a aposta ainda está dentro da janela de liquidação.
 * Impede que o usuário "estacione" a aposta e escolha o momento perfeito para liquidar.
 */
export function guardBetExpiry(betCreatedAt: Date): GuardResult {
  const expiryMs = LIMITS.BET_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() > betCreatedAt.getTime() + expiryMs) {
    return {
      ok: false,
      error: `Esta aposta expirou. Apostas devem ser liquidadas em até ${LIMITS.BET_EXPIRY_DAYS} dias após sua criação.`,
      code: "BET_EXPIRED",
    };
  }
  return { ok: true };
}

// ── Guards assíncronos (consultam o banco) ─────────────────────────────────────

/**
 * [E8] Limita os ganhos totais por dia por usuário.
 * Impede acumulação irrestrita de prêmios em um único dia.
 */
export async function guardDailyWinningsCap(
  userId: string,
  potentialPayout: number
): Promise<GuardResult> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return { ok: true };

  const agg = await prisma.transaction.aggregate({
    where: {
      walletId: wallet.id,
      type: "BET_WON",
      status: "COMPLETED",
      createdAt: { gte: startOfDay },
    },
    _sum: { amount: true },
  });

  const todayWinnings = Number(agg._sum.amount ?? 0);
  if (todayWinnings + potentialPayout > LIMITS.DAILY_WINNINGS_CAP) {
    const remaining = Math.max(0, LIMITS.DAILY_WINNINGS_CAP - todayWinnings);
    return {
      ok: false,
      error: `Limite diário de ganhos atingido. Você pode receber no máximo mais R$ ${remaining.toFixed(2)} hoje.`,
      code: "DAILY_WINNINGS_CAP",
    };
  }
  return { ok: true };
}

/**
 * [E2] Detecta padrão suspeito de throwing intencional.
 *
 * Lógica: se o usuário tem >= MIN_SETTLED apostas em LOSE liquidadas
 * e >= 80% delas foram ganhas (ou seja, o jogador PERDEU a partida "propositalmente"),
 * a conta é temporariamente bloqueada para novas apostas LOSE.
 *
 * Contexto: um jogador habilidoso tem ~30-40% de chance de perder.
 * Taxa de 80%+ em apostas de LOSE é estatisticamente improvável sem manipulação.
 */
export async function guardSuspiciousThrowPattern(
  userId: string,
  gameProfileId: string,
  prediction: string
): Promise<GuardResult> {
  // Só verifica apostas em LOSE (que é onde o throwing é lucrativo)
  if (prediction !== "LOSE") return { ok: true };

  const loseBets = await prisma.bet.findMany({
    where: {
      userId,
      gameProfileId,
      prediction: "LOSE",
      status: { in: ["WON", "LOST"] },
    },
    select: { status: true },
  });

  if (loseBets.length < LIMITS.SUSPICIOUS_MIN_SETTLED) return { ok: true };

  const throwWins = loseBets.filter((b) => b.status === "WON").length;
  const ratio = throwWins / loseBets.length;

  if (ratio >= LIMITS.SUSPICIOUS_LOSE_WIN_RATIO) {
    return {
      ok: false,
      error: `Apostas em derrota suspensas: sua taxa de acerto em apostas de "Derrota" (${Math.round(ratio * 100)}%) está acima do threshold permitido. Entre em contato com o suporte.`,
      code: "SUSPICIOUS_THROW_PATTERN",
    };
  }

  return { ok: true };
}

// ── Guards de integridade temporal da partida ──────────────────────────────────

/**
 * Converte um timestamp Unix para uma string de data "YYYY-MM-DD"
 * no fuso horário da plataforma (BRT = UTC-3).
 */
function toLocalDateString(timestampMs: number): string {
  const offsetMs = LIMITS.TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
  return new Date(timestampMs + offsetMs).toISOString().slice(0, 10);
}

/**
 * [Security 1] A aposta deve ter sido criada pelo menos MIN_BET_BEFORE_MATCH_START_MINUTES
 * antes do início da partida.
 *
 * Impede que o jogador já dentro de uma partida em andamento crie a aposta sabendo
 * como a partida está evoluindo (pick/ban favorável, vantagem acumulada etc.).
 */
export function guardBetBeforeMatchStart(
  betCreatedAt: Date,
  matchStartTime: number
): GuardResult {
  const matchStartMs = matchStartTime * 1000;
  const bufferMs = LIMITS.MIN_BET_BEFORE_MATCH_START_MINUTES * 60_000;
  const betCreatedMs = betCreatedAt.getTime();

  if (matchStartMs < betCreatedMs + bufferMs) {
    const diffMs = betCreatedMs + bufferMs - matchStartMs;
    const diffMin = Math.ceil(diffMs / 60_000);
    return {
      ok: false,
      error: `Partida inválida: a aposta deve ser criada pelo menos ${LIMITS.MIN_BET_BEFORE_MATCH_START_MINUTES} minutos antes do início da partida. Sua aposta foi criada ${diffMin} min tarde demais.`,
      code: "BET_AFTER_MATCH_START",
    };
  }
  return { ok: true };
}

/**
 * [E11] A partida deve ter sido jogada no mesmo dia em que a aposta foi criada (horário BRT).
 *
 * Impede que o usuário crie uma aposta hoje e jogue a partida amanhã com
 * informação privilegiada (lineup favorável, oponentes fracos conhecidos etc.).
 */
export function guardMatchSameDay(betCreatedAt: Date, matchStartTime: number): GuardResult {
  const betDay   = toLocalDateString(betCreatedAt.getTime());
  const matchDay = toLocalDateString(matchStartTime * 1000);

  if (betDay !== matchDay) {
    return {
      ok: false,
      error: `A partida deve ter sido jogada no mesmo dia em que a aposta foi criada. Aposta: ${betDay} · Partida: ${matchDay} (horário de Brasília).`,
      code: "MATCH_DIFFERENT_DAY",
    };
  }
  return { ok: true };
}

/**
 * [E12] A aposta deve ter sido criada com pelo menos 15 minutos de antecedência ao fim da partida.
 *
 * Impede que o usuário jogue a partida, veja que ganhou/perdeu no client do Dota 2
 * (o placar é visível antes da tela de resultados aparecer) e só então crie a aposta
 * sabendo o desfecho com certeza.
 *
 *   matchEndMs  = (start_time + duration) × 1000
 *   deadline    = matchEndMs − 15 min
 *   betCreatedAt ≤ deadline  →  OK
 *   betCreatedAt > deadline  →  BLOQUEADO
 */
export function guardBetBeforeMatchEnd(
  betCreatedAt: Date,
  matchStartTime: number,
  matchDuration: number
): GuardResult {
  const matchEndMs  = (matchStartTime + matchDuration) * 1000;
  const bufferMs    = LIMITS.BET_BEFORE_MATCH_END_MINUTES * 60 * 1000;
  const deadlineMs  = matchEndMs - bufferMs;
  const betCreatedMs = betCreatedAt.getTime();

  if (betCreatedMs > deadlineMs) {
    const afterEnd = betCreatedMs > matchEndMs;
    const minsLate = Math.ceil((betCreatedMs - deadlineMs) / 60_000);
    const direction = afterEnd
      ? `${Math.ceil((betCreatedMs - matchEndMs) / 60_000)} min após o fim`
      : `${Math.ceil((matchEndMs - betCreatedMs) / 60_000)} min antes do fim (mínimo: ${LIMITS.BET_BEFORE_MATCH_END_MINUTES} min)`;

    return {
      ok: false,
      error: `Aposta inválida: a aposta foi criada ${direction} da partida. São necessários pelo menos ${LIMITS.BET_BEFORE_MATCH_END_MINUTES} minutos de antecedência ao término. Você chegou ${minsLate} min tarde.`,
      code: "BET_TOO_LATE",
    };
  }
  return { ok: true };
}

// ── Guards de jogo responsável ────────────────────────────────────────────────

/**
 * [Jogo Responsável] Bloqueia apostas durante período de auto-exclusão.
 */
export function guardSelfExclusion(selfExcludedUntil: Date | null): GuardResult {
  if (!selfExcludedUntil) return { ok: true };
  if (new Date() < selfExcludedUntil) {
    const until = selfExcludedUntil.toLocaleDateString("pt-BR");
    return {
      ok: false,
      error: `Sua conta está auto-excluída até ${until}. Acesse as configurações para mais informações.`,
      code: "SELF_EXCLUDED",
    };
  }
  return { ok: true };
}

/**
 * [Jogo Responsável] Verifica limite diário de perda do usuário.
 */
export async function guardDailyLossLimit(
  userId: string,
  betAmount: number
): Promise<GuardResult> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet?.dailyLossLimit) return { ok: true };

  const limit = Number(wallet.dailyLossLimit);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const lostToday = await prisma.transaction.aggregate({
    where: { walletId: wallet.id, type: "BET_PLACED", createdAt: { gte: startOfDay } },
    _sum: { amount: true },
  });

  const totalToday = Number(lostToday._sum.amount ?? 0);
  if (totalToday + betAmount > limit) {
    const remaining = Math.max(0, limit - totalToday);
    return {
      ok: false,
      error: `Limite diário de perdas atingido (R$ ${limit.toFixed(2)}). Você ainda pode apostar R$ ${remaining.toFixed(2)} hoje.`,
      code: "DAILY_LOSS_LIMIT",
    };
  }
  return { ok: true };
}

/**
 * [Jogo Responsável] Verifica limite semanal de perda do usuário.
 */
export async function guardWeeklyLossLimit(
  userId: string,
  betAmount: number
): Promise<GuardResult> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet?.weeklyLossLimit) return { ok: true };

  const limit = Number(wallet.weeklyLossLimit);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const lostThisWeek = await prisma.transaction.aggregate({
    where: { walletId: wallet.id, type: "BET_PLACED", createdAt: { gte: startOfWeek } },
    _sum: { amount: true },
  });

  const totalWeek = Number(lostThisWeek._sum.amount ?? 0);
  if (totalWeek + betAmount > limit) {
    const remaining = Math.max(0, limit - totalWeek);
    return {
      ok: false,
      error: `Limite semanal de perdas atingido (R$ ${limit.toFixed(2)}). Você ainda pode apostar R$ ${remaining.toFixed(2)} esta semana.`,
      code: "WEEKLY_LOSS_LIMIT",
    };
  }
  return { ok: true };
}

/**
 * [Trust Tier] Conta quantas apostas o usuário já liquidou (WON + LOST),
 * em todos os perfis de jogo — é essa contagem que define a faixa de confiança.
 */
export async function countSettledBets(userId: string): Promise<number> {
  return prisma.bet.count({
    where: { userId, status: { in: ["WON", "LOST"] } },
  });
}

/**
 * [Trust Tier] Retorna o valor máximo de aposta permitido para o número de
 * apostas já liquidadas informado, ou `null` se o usuário já superou a
 * última faixa configurada (nesse caso, nenhum teto de trust tier se aplica
 * — mas veja `isTrustTierLocked`, que pode travar as apostas nesse cenário).
 */
export function getTrustTierMaxAmount(settledBetsCount: number): number | null {
  const tier = TRUST_TIERS.find(
    (t) => settledBetsCount >= t.minSettledBets && settledBetsCount <= t.maxSettledBets
  );
  return tier?.maxBetAmount ?? null;
}

/**
 * [Trust Tier] Indica se o usuário já ultrapassou a última faixa configurada
 * em TRUST_TIERS e, por isso, está travado (quando TRUST_TIER_LOCK_AFTER_LAST
 * estiver ativo).
 */
export function isTrustTierLocked(settledBetsCount: number): boolean {
  if (!TRUST_TIER_LOCK_AFTER_LAST) return false;
  const lastTier = TRUST_TIERS[TRUST_TIERS.length - 1];
  if (!lastTier) return false;
  return settledBetsCount > lastTier.maxSettledBets;
}

/**
 * [Trust Tier] Bloqueia apostas acima do teto da faixa de confiança atual do usuário,
 * e trava novas apostas por completo assim que ele ultrapassa a última faixa
 * configurada (ver TRUST_TIER_LOCK_AFTER_LAST). Novatos apostam pouco; conforme
 * liquidam apostas (ganhando ou perdendo — o que importa é a experiência
 * acumulada), o teto sobe.
 */
export function guardTrustTierMaxAmount(settledBetsCount: number, amount: number): GuardResult {
  if (isTrustTierLocked(settledBetsCount)) {
    return {
      ok: false,
      error: `Você atingiu o limite de ${TRUST_TIERS[TRUST_TIERS.length - 1]!.maxSettledBets} apostas liquidadas do seu nível atual. Novas apostas estão temporariamente indisponíveis enquanto liberamos o próximo nível — fique de olho, em breve você poderá continuar apostando.`,
      code: "TRUST_TIER_LOCKED",
    };
  }

  const maxAmount = getTrustTierMaxAmount(settledBetsCount);
  if (maxAmount !== null && amount > maxAmount) {
    return {
      ok: false,
      error: `Seu limite atual é de R$ ${maxAmount.toFixed(2)} por aposta, com base nas suas ${settledBetsCount} apostas liquidadas até agora. Continue apostando para desbloquear limites maiores.`,
      code: "TRUST_TIER_LIMIT_EXCEEDED",
    };
  }
  return { ok: true };
}

// ── Guards de integridade da partida (OpenDota) ────────────────────────────────

/**
 * [V5] Valida que a resposta da OpenDota tem a estrutura mínima esperada.
 *
 * A API pode retornar um match "em processamento" (parse ainda não finalizado)
 * com campos ausentes ou arrays vazios. Tomar decisão sobre uma aposta com
 * dados incompletos é um vetor de erro silencioso.
 */
export function guardMatchDataIntegrity(match: {
  match_id?: unknown;
  players?: unknown;
  radiant_win?: unknown;
  start_time?: unknown;
  duration?: unknown;
  lobby_type?: unknown;
  game_mode?: unknown;
}): GuardResult {
  if (
    typeof match.match_id !== "number" ||
    !Array.isArray(match.players) ||
    match.players.length === 0 ||
    typeof match.radiant_win !== "boolean" ||
    typeof match.start_time !== "number" ||
    match.start_time <= 0 ||
    typeof match.duration !== "number" ||
    match.duration <= 0
  ) {
    return {
      ok: false,
      error: "Dados da partida incompletos ou ainda em processamento. A OpenDota pode levar até 1 hora para processar uma partida. Tente novamente mais tarde.",
      code: "MATCH_DATA_INCOMPLETE",
    };
  }
  return { ok: true };
}

/**
 * [V1] Permite apenas lobby types competitivos/públicos.
 *
 * Bloqueia partidas contra bots (4), practice (1) e 1v1 solo (6),
 * onde o resultado é previsível ou trivialmente controlável.
 */
export function guardMatchLobbyType(lobbyType: number): GuardResult {
  // Fonte: https://api.opendota.com/api/constants/lobby_type
  const LOBBY_NAMES: Record<number, string> = {
    0: "Normal",
    1: "Prática",
    2: "Torneio",
    4: "Co-op com Bots",
    5: "Team Match",
    6: "Solo Queue",
    7: "Ranked",
    8: "1v1 Mid",
    9: "Battle Cup",
  };

  if (!LIMITS.ALLOWED_LOBBY_TYPES.includes(lobbyType)) {
    const name = LOBBY_NAMES[lobbyType] ?? `tipo ${lobbyType}`;
    return {
      ok: false,
      error: `Partidas do tipo "${name}" não são aceitas. Apenas partidas Ranked são válidas para apostas.`,
      code: "INVALID_LOBBY_TYPE",
    };
  }
  return { ok: true };
}

/**
 * [V2] Exige duração mínima de 20 minutos.
 *
 * Partidas muito curtas são rendições precoces, disconnects ou jogos
 * claramente controlados. Além disso, se a partida durou menos de 15 min
 * o usuário não poderia ter apostado 15 min antes do fim — esse guard
 * fornece uma mensagem de erro mais clara para esse cenário.
 */
export function guardMatchMinDuration(duration: number): GuardResult {
  if (duration < LIMITS.MIN_MATCH_DURATION_SECONDS) {
    const actualMin = Math.floor(duration / 60);
    return {
      ok: false,
      error: `Partida muito curta (${actualMin} min). São aceitas apenas partidas com duração mínima de ${LIMITS.MIN_MATCH_DURATION_SECONDS / 60} minutos.`,
      code: "MATCH_TOO_SHORT",
    };
  }
  return { ok: true };
}

/**
 * [V8] Permite apenas game modes competitivos.
 *
 * Modos como Ability Draft, Low Priority ou modos experimentais têm
 * dinâmica muito diferente do ranked/normal e dificultam a calibração das odds.
 */
export function guardMatchGameMode(gameMode: number): GuardResult {
  const MODE_NAMES: Record<number, string> = {
    1: "All Pick", 2: "Captains Mode", 3: "Random Draft",
    4: "Single Draft", 5: "All Random", 22: "Captains Draft",
  };

  if (!LIMITS.ALLOWED_GAME_MODES.includes(gameMode)) {
    return {
      ok: false,
      error: `Modo de jogo não aceito para apostas. São permitidos: All Pick, Captains Mode, Random Draft, Single Draft, All Random e Captains Draft.`,
      code: "INVALID_GAME_MODE",
    };
  }
  return { ok: true };
}

/**
 * [V7] Rejeita bodies acima de MAX_BODY_BYTES baseado no header Content-Length.
 * @deprecated Use readJsonBody que verifica o tamanho real do body.
 */
export function guardBodySize(contentLength: string | null): GuardResult {
  if (contentLength !== null) {
    const bytes = parseInt(contentLength, 10);
    if (!isNaN(bytes) && bytes > LIMITS.MAX_BODY_BYTES) {
      return { ok: false, error: "Payload muito grande.", code: "PAYLOAD_TOO_LARGE" };
    }
  }
  return { ok: true };
}

type ReadJsonBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: 413 | 400 };

/**
 * [V7] Lê o body real da request e verifica o tamanho ANTES de parsear JSON.
 * Não confia no header Content-Length (pode ser manipulado).
 * Retorna { ok: true, data } ou { ok: false, error, status }.
 */
export async function readJsonBody<T = unknown>(req: Request): Promise<ReadJsonBodyResult<T>> {
  const text = await req.text();
  if (text.length > LIMITS.MAX_BODY_BYTES) {
    return { ok: false, error: "Payload muito grande.", status: 413 };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, error: "JSON inválido.", status: 400 };
  }
}
