const BASE_URL = "https://api.opendota.com/api";

// ── Circuit breaker ───────────────────────────────────────────────────────────
// Prevents hammering OpenDota when it's down. Opens after 5 consecutive
// failures; stays open for 30s, then allows one probe (HALF_OPEN).
const CB = {
  state: "CLOSED" as "CLOSED" | "OPEN" | "HALF_OPEN",
  failures: 0,
  openedAt: 0,
  FAILURE_THRESHOLD: 5,
  RESET_MS: 30_000,
};

function cbRecordSuccess() {
  CB.state = "CLOSED";
  CB.failures = 0;
}

function cbRecordFailure() {
  CB.failures++;
  if (CB.failures >= CB.FAILURE_THRESHOLD) {
    CB.state = "OPEN";
    CB.openedAt = Date.now();
    console.warn("[opendota] circuit breaker OPEN — too many failures");
  }
}

function cbAllowRequest(): boolean {
  if (CB.state === "CLOSED") return true;
  if (CB.state === "OPEN") {
    if (Date.now() - CB.openedAt > CB.RESET_MS) {
      CB.state = "HALF_OPEN";
      return true;
    }
    return false;
  }
  // HALF_OPEN: allow exactly one probe
  return true;
}

async function fetchWithRetry(url: string, options: RequestInit & { next?: { revalidate?: number } }, retries = 3): Promise<Response | null> {
  if (!cbAllowRequest()) {
    console.warn("[opendota] circuit breaker OPEN — request blocked:", url);
    return null;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) { cbRecordSuccess(); return res; }
      if (res.status === 404) { cbRecordSuccess(); return res; } // don't retry 404
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
          continue;
        }
        cbRecordFailure();
      }
      return res;
    } catch {
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
        continue;
      }
      cbRecordFailure();
    }
  }
  return null;
}

export interface OpenDotaPlayer {
  profile: {
    account_id: number;
    personaname: string;
    avatarfull: string;
    steamid: string;
    fh_unavailable?: boolean; // true quando o perfil Steam está privado
  };
  mmr_estimate?: { estimate: number };
  solo_competitive_rank?: number;
  competitive_rank?: number;
  rank_tier?: number;
}

export interface OpenDotaMatch {
  match_id: number;
  players: OpenDotaMatchPlayer[];
  radiant_win: boolean;
  start_time: number;
  duration: number;
  /**
   * lobby_type:
   *  0 = Normal/Public  1 = Practice  2 = Tournament
   *  4 = Bot game       5 = Ranked    6 = 1v1 Solo Mid  7 = Battle Cup
   */
  lobby_type: number;
  /**
   * game_mode:
   *  1 = All Pick  2 = Captains Mode  3 = Random Draft  4 = Single Draft
   *  5 = All Random  22 = Captains Draft  ...etc
   */
  game_mode: number;
}

export interface OpenDotaMatchPlayer {
  account_id: number;
  player_slot: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  xp_per_min?: number;
  party_id?: number | null;
}

export interface PlayerRecentMatch {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  start_time: number;
  lobby_type: number;
  game_mode: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  xp_per_min?: number;
}

export interface PlayerStats {
  winRate: number;
  totalMatches: number;
  recentWinRate: number;
  averageKDA: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageGPM: number;
  averageXPM: number;
  rankTier?: number;
  mmrEstimate?: number;
  profilePrivate?: boolean;
  /** true quando as médias vieram da tabela por medalha (perfil público, 0 partidas), não do jogador */
  estimatedFromRank?: boolean;
}

/**
 * [Fallback por medalha] Médias reais de kills/mortes/assists/GPM/XPM por
 * faixa de rank, usadas apenas quando o perfil está público mas ainda não há
 * nenhuma partida disponível para consulta (ex.: acabou de tornar público).
 *
 * Fonte: dotabuff.com/heroes/meta?metric=rating_bracket (views "kills",
 * "assists", "deaths" e "farm"), média simples dos ~127 heróis em cada uma
 * das 5 faixas que o próprio Dotabuff usa, extraída em 22/09/2026. Esses
 * números mudam com patches/meta do jogo — vale reconferir periodicamente
 * e atualizar só esta tabela.
 *
 * Achado contra-intuitivo confirmado pelos dados: kills e mortes CAEM um
 * pouco em ranks mais altos (jogo mais disciplinado, menos teamfight caótico),
 * enquanto GPM/XPM sobem (melhor farm/execução). Não é uma progressão linear
 * "quanto mais alto o rank, mais kills" como se poderia supor.
 *
 * Win rate fica fixo em 50% em todas as faixas — o matchmaking do Dota 2 é
 * desenhado para manter isso próximo de 50% independente do nível do jogador.
 *
 * rank_tier da OpenDota: dezena = medalha (1=Arauto...8=Imortal), unidade = estrela.
 * Faixas do Dotabuff (mantidas aqui do mesmo jeito): Cruzado ou menos (<2K MMR),
 * Arconte (~2-3K), Lenda (~3-4K), Ancião (~4-5K), Divino+Imortal (>5K).
 * Ajuste os números aqui — nada mais precisa mudar.
 */
const RANK_TIER_AVERAGES: Record<string, { kills: number; deaths: number; assists: number; gpm: number; xpm: number }> = {
  crusader_and_below: { kills: 8.16, deaths: 8.62, assists: 14.76, gpm: 474, xpm: 718 },
  archon:             { kills: 8.04, deaths: 8.31, assists: 14.91, gpm: 493, xpm: 729 },
  legend:             { kills: 7.93, deaths: 8.08, assists: 14.93, gpm: 506, xpm: 734 },
  ancient:            { kills: 7.79, deaths: 7.87, assists: 14.78, gpm: 517, xpm: 735 },
  divine_immortal:    { kills: 7.49, deaths: 7.47, assists: 14.18, gpm: 527, xpm: 727 },
};

function getRankTierAverages(rankTier?: number) {
  const medal = rankTier ? Math.floor(rankTier / 10) : 0;
  const bracket =
    medal >= 7 ? "divine_immortal" :
    medal === 6 ? "ancient" :
    medal === 5 ? "legend" :
    medal === 4 ? "archon" :
    "crusader_and_below"; // Arauto/Guardião/Cruzado e sem rank/calibrando
  return RANK_TIER_AVERAGES[bracket];
}

function steamId64ToAccountId(steamId64: string): number {
  return Number(BigInt(steamId64) - BigInt("76561197960265728"));
}

function isAccountId(id: string): boolean {
  return id.length <= 10;
}

export function normalizePlayerId(id: string): number {
  if (isAccountId(id)) return Number(id);
  return steamId64ToAccountId(id);
}

export async function fetchPlayerProfile(accountId: number): Promise<OpenDotaPlayer | null> {
  const res = await fetchWithRetry(`${BASE_URL}/players/${accountId}`, { next: { revalidate: 300 } });
  if (!res?.ok) return null;
  return res.json();
}

/**
 * [Fix GPM/XPM] Por padrão a API só devolve um conjunto fixo de campos que
 * NÃO inclui gold_per_min/xp_per_min — é preciso pedir cada campo via
 * `project` explicitamente, o que troca a resposta para só os campos pedidos.
 */
const MATCH_FIELDS = [
  "match_id", "player_slot", "radiant_win", "duration", "start_time",
  "lobby_type", "game_mode", "hero_id", "kills", "deaths", "assists",
  "gold_per_min", "xp_per_min",
];

export async function fetchRecentMatches(accountId: number, limit = 20): Promise<PlayerRecentMatch[]> {
  const projectParams = MATCH_FIELDS.map((f) => `project=${f}`).join("&");
  const res = await fetchWithRetry(
    `${BASE_URL}/players/${accountId}/matches?limit=${limit}&significant=0&${projectParams}`,
    { next: { revalidate: 300 } }
  );
  if (!res?.ok) return [];
  return res.json();
}

export async function fetchHeroNames(): Promise<Record<number, string>> {
  try {
    const res = await fetch("https://api.opendota.com/api/heroes", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return {};
    const heroes: { id: number; localized_name: string }[] = await res.json();
    return Object.fromEntries(heroes.map((h) => [h.id, h.localized_name]));
  } catch {
    return {};
  }
}

const HERO_IMAGE_BASE = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes";

export interface HeroMeta {
  name: string;
  imageUrl: string;
}

/**
 * Mapa hero_id -> { name, imageUrl } usado para exibir o herói jogado em
 * cada aposta liquidada (histórico de apostas). O slug da imagem vem do
 * campo `name` da OpenDota (ex.: "npc_dota_hero_antimage" -> "antimage").
 */
export async function fetchHeroMeta(): Promise<Record<number, HeroMeta>> {
  try {
    const res = await fetch("https://api.opendota.com/api/heroes", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return {};
    const heroes: { id: number; name: string; localized_name: string }[] = await res.json();
    return Object.fromEntries(
      heroes.map((h) => {
        const slug = h.name.replace("npc_dota_hero_", "");
        return [h.id, { name: h.localized_name, imageUrl: `${HERO_IMAGE_BASE}/${slug}.png` }];
      })
    );
  } catch {
    return {};
  }
}

export async function fetchMatchDetails(matchId: string): Promise<OpenDotaMatch | null> {
  const res = await fetchWithRetry(`${BASE_URL}/matches/${matchId}`, { next: { revalidate: 60 } }, 3);
  if (!res?.ok) return null;
  return res.json();
}

export interface PlayerStatsWithMatches {
  stats: PlayerStats;
  recentMatches: PlayerRecentMatch[];
}

export async function calculatePlayerStats(accountId: number): Promise<PlayerStats> {
  const { stats } = await calculatePlayerStatsWithMatches(accountId);
  return stats;
}

export async function calculatePlayerStatsWithMatches(accountId: number): Promise<PlayerStatsWithMatches> {
  const [profile, recentMatches] = await Promise.all([
    fetchPlayerProfile(accountId),
    fetchRecentMatches(accountId, 50),
  ]);

  if (!recentMatches.length) {
    const isPrivate = profile?.profile?.fh_unavailable === true;
    // Perfil público sem nenhuma partida disponível ainda: usa médias por medalha
    // em vez de um chute único pra todo mundo. Perfil privado continua com os
    // mesmos valores neutros de sempre — não é usado pra exibir odds reais.
    const rankAvg = !isPrivate ? getRankTierAverages(profile?.rank_tier) : null;

    return {
      stats: {
        winRate: 0.5, totalMatches: 0, recentWinRate: 0.5,
        averageKDA: rankAvg ? (rankAvg.kills + rankAvg.assists) / Math.max(rankAvg.deaths, 1) : 1,
        averageKills:   rankAvg?.kills   ?? 5,
        averageDeaths:  rankAvg?.deaths  ?? 5,
        averageAssists: rankAvg?.assists ?? 8,
        averageGPM:     rankAvg?.gpm     ?? 400,
        averageXPM:     rankAvg?.xpm     ?? 500,
        rankTier: profile?.rank_tier,
        mmrEstimate: profile?.mmr_estimate?.estimate,
        profilePrivate: isPrivate,
        estimatedFromRank: rankAvg !== null,
      },
      recentMatches: [],
    };
  }

  const wins = recentMatches.filter((m) => {
    const isRadiant = m.player_slot < 128;
    return isRadiant === m.radiant_win;
  });

  const recentWinRate = wins.length / recentMatches.length;

  const avgKDA    = recentMatches.reduce((a, m) => a + (m.kills + m.assists) / Math.max(m.deaths, 1), 0) / recentMatches.length;
  const avgKills  = recentMatches.reduce((a, m) => a + m.kills,          0) / recentMatches.length;
  const avgDeaths = recentMatches.reduce((a, m) => a + m.deaths,         0) / recentMatches.length;
  const avgAssts  = recentMatches.reduce((a, m) => a + m.assists,        0) / recentMatches.length;
  const avgGPM    = recentMatches.reduce((a, m) => a + (m.gold_per_min ?? 0), 0) / recentMatches.length;
  const avgXPM    = recentMatches.reduce((a, m) => a + (m.xp_per_min    ?? 0), 0) / recentMatches.length;

  return {
    stats: {
      winRate: recentWinRate,
      totalMatches: recentMatches.length,
      recentWinRate,
      averageKDA: avgKDA,
      averageKills:   parseFloat(avgKills.toFixed(1)),
      averageDeaths:  parseFloat(avgDeaths.toFixed(1)),
      averageAssists: parseFloat(avgAssts.toFixed(1)),
      averageGPM:     parseFloat(avgGPM.toFixed(0)),
      averageXPM:     parseFloat(avgXPM.toFixed(0)),
      rankTier: profile?.rank_tier,
      mmrEstimate: profile?.mmr_estimate?.estimate,
    },
    recentMatches,
  };
}

export function didPlayerWinMatch(match: OpenDotaMatch, accountId: number): boolean | null {
  const player = match.players.find((p) => p.account_id === accountId);
  if (!player) return null;
  const isRadiant = player.player_slot < 128;
  return isRadiant === match.radiant_win;
}
