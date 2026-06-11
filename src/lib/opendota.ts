const BASE_URL = "https://api.opendota.com/api";

async function fetchWithRetry(url: string, options: RequestInit & { next?: { revalidate?: number } }, retries = 3): Promise<Response | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 404) return res; // don't retry 404
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
          continue;
        }
      }
      return res;
    } catch {
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
        continue;
      }
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
  party_id?: number | null;
}

export interface PlayerRecentMatch {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  start_time: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
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
  rankTier?: number;
  mmrEstimate?: number;
  profilePrivate?: boolean;
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

export async function fetchRecentMatches(accountId: number, limit = 20): Promise<PlayerRecentMatch[]> {
  const res = await fetchWithRetry(`${BASE_URL}/players/${accountId}/recentMatches?limit=${limit}`, { next: { revalidate: 300 } });
  if (!res?.ok) return [];
  return res.json();
}

export async function fetchMatchDetails(matchId: string): Promise<OpenDotaMatch | null> {
  const res = await fetchWithRetry(`${BASE_URL}/matches/${matchId}`, { next: { revalidate: 60 } }, 3);
  if (!res?.ok) return null;
  return res.json();
}

export async function calculatePlayerStats(accountId: number): Promise<PlayerStats> {
  const [profile, recentMatches] = await Promise.all([
    fetchPlayerProfile(accountId),
    fetchRecentMatches(accountId, 20),
  ]);

  if (!recentMatches.length) {
    return {
      winRate: 0.5, totalMatches: 0, recentWinRate: 0.5, averageKDA: 1,
      averageKills: 5, averageDeaths: 5, averageAssists: 8, averageGPM: 400,
      rankTier: profile?.rank_tier,
      mmrEstimate: profile?.mmr_estimate?.estimate,
      profilePrivate: profile?.profile?.fh_unavailable === true,
    };
  }

  const wins = recentMatches.filter((m) => {
    const isRadiant = m.player_slot < 128;
    return isRadiant === m.radiant_win;
  });

  const recentWinRate = wins.length / recentMatches.length;

  const avgKDA    = recentMatches.reduce((a, m) => a + (m.kills + m.assists) / Math.max(m.deaths, 1), 0) / recentMatches.length;
  const avgKills  = recentMatches.reduce((a, m) => a + m.kills,        0) / recentMatches.length;
  const avgDeaths = recentMatches.reduce((a, m) => a + m.deaths,       0) / recentMatches.length;
  const avgAssts  = recentMatches.reduce((a, m) => a + m.assists,      0) / recentMatches.length;
  const avgGPM    = recentMatches.reduce((a, m) => a + (m.gold_per_min ?? 0), 0) / recentMatches.length;

  return {
    winRate: recentWinRate,
    totalMatches: recentMatches.length,
    recentWinRate,
    averageKDA: avgKDA,
    averageKills: parseFloat(avgKills.toFixed(1)),
    averageDeaths: parseFloat(avgDeaths.toFixed(1)),
    averageAssists: parseFloat(avgAssts.toFixed(1)),
    averageGPM: parseFloat(avgGPM.toFixed(0)),
    rankTier: profile?.rank_tier,
    mmrEstimate: profile?.mmr_estimate?.estimate,
  };
}

export function didPlayerWinMatch(match: OpenDotaMatch, accountId: number): boolean | null {
  const player = match.players.find((p) => p.account_id === accountId);
  if (!player) return null;
  const isRadiant = player.player_slot < 128;
  return isRadiant === match.radiant_win;
}
