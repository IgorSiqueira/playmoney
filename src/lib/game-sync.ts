import { prisma } from "@/lib/prisma";
import { fetchPlayerProfile, fetchRecentMatches, calculatePlayerStats } from "@/lib/opendota";
import { calculateDynamicOdds } from "@/lib/odds";

/**
 * Syncs a user's Dota 2 game profile: recent matches, stats, odds.
 * Fire-and-forget safe — catches and swallows errors internally.
 * Returns the updated profile, or null if the profile doesn't exist or OpenDota is down.
 */
export async function syncDota2Profile(userId: string) {
  try {
    const existing = await prisma.gameProfile.findUnique({
      where: { userId_game: { userId, game: "DOTA2" } },
    });

    if (!existing) return null;

    const accountId = Number(existing.externalId);

    const [playerProfile, recentMatches, stats] = await Promise.all([
      fetchPlayerProfile(accountId),
      fetchRecentMatches(accountId, 50),
      calculatePlayerStats(accountId),
    ]);

    // OpenDota unavailable — just bump lastSyncAt to avoid blocking the user
    if (!playerProfile?.profile) {
      return await prisma.gameProfile.update({
        where: { userId_game: { userId, game: "DOTA2" } },
        data: { lastSyncAt: new Date() },
      });
    }

    const odds = calculateDynamicOdds(recentMatches, stats);
    const statsJson = JSON.parse(
      JSON.stringify({ ...stats, odds, recentMatches: recentMatches.slice(0, 50) })
    );

    // [Trust] Perfil detectado como privado agora: zera profilePublicSince —
    // ele terá que tornar público de novo e acumular MIN_MATCH_HISTORY partidas
    // a partir dali. Perfil público: só carimba a primeira vez que detectamos
    // (não sobrescreve a cada sync, senão o relógio nunca avançaria).
    const isPrivate = stats.profilePrivate === true;
    const profilePublicSince = isPrivate
      ? null
      : (existing.profilePublicSince ?? new Date());

    return await prisma.gameProfile.update({
      where: { userId_game: { userId, game: "DOTA2" } },
      data: {
        displayName: playerProfile.profile.personaname,
        avatarUrl:   playerProfile.profile.avatarfull,
        stats:       statsJson,
        lastSyncAt:  new Date(),
        profilePublicSince,
      },
    });
  } catch {
    // Never throw — this is always called fire-and-forget
    return null;
  }
}
