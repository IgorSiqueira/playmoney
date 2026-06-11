import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchPlayerProfile, fetchRecentMatches, calculatePlayerStats, normalizePlayerId } from "@/lib/opendota";
import { calculateOdds } from "@/lib/odds";
import { syncDota2Profile } from "@/lib/game-sync";

import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { evaluateMatchSignals } from "@/lib/risk";

// [Security 8] Aceita apenas account ID 32-bit (≤10 dígitos) ou Steam64 (começa com 7656119...)
const STEAM_ID_REGEX = /^(\d{1,10}|7656119\d{10})$/;

const connectSchema = z.object({
  steamId: z.string().regex(STEAM_ID_REGEX, "Steam ID inválido. Use o Account ID (32-bit) ou o Steam64 ID."),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const profile = await prisma.gameProfile.findUnique({
    where: { userId_game: { userId: session.user.id, game: "DOTA2" } },
    include: { bets: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  return NextResponse.json(profile);
}

/** PATCH — re-sync silencioso usando o externalId já salvo. Sem body necessário. */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = session.user.id;

  // Rate limit compartilhado com o POST
  const rl = await rateLimit(`dota2-connect:${userId}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  const existing = await prisma.gameProfile.findUnique({
    where: { userId_game: { userId, game: "DOTA2" } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Nenhum perfil Dota 2 conectado." }, { status: 404 });
  }

  const updated = await syncDota2Profile(userId);

  void evaluateMatchSignals(userId);

  return NextResponse.json(updated ?? existing);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = session.user.id;

  // [Security 7] Rate limit: 10 conexões/sync por hora por usuário
  const rl = await rateLimit(`dota2-connect:${userId}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  const body = await req.json();
  const parsed = connectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Steam ID inválido" },
      { status: 400 }
    );
  }

  const accountId = normalizePlayerId(parsed.data.steamId);

  // Sanity check: account IDs above this range are invalid 32-bit IDs
  if (accountId <= 0 || accountId > 4_294_967_295) {
    return NextResponse.json({ error: "Steam ID fora do intervalo válido." }, { status: 400 });
  }

  const [playerProfile, recentMatches, stats] = await Promise.all([
    fetchPlayerProfile(accountId),
    fetchRecentMatches(accountId, 20),
    calculatePlayerStats(accountId),
  ]);

  if (!playerProfile?.profile) {
    return NextResponse.json(
      { error: "Perfil Steam não encontrado. Verifique se o perfil é público." },
      { status: 404 }
    );
  }

  const odds = calculateOdds(stats);
  const statsJson = JSON.parse(JSON.stringify({ ...stats, odds, recentMatches: recentMatches.slice(0, 10) }));

  // [E1] Bloquear hedge: Steam ID já vinculado a outro usuário
  const takenByOther = await prisma.gameProfile.findFirst({
    where: { externalId: String(accountId), game: "DOTA2", NOT: { userId } },
  });
  if (takenByOther) {
    return NextResponse.json(
      { error: "Este perfil Steam já está vinculado a outra conta na plataforma." },
      { status: 409 }
    );
  }

  // [E2] Bloquear troca de conta: se o usuário já tem um perfil com Steam ID diferente
  const ownProfile = await prisma.gameProfile.findUnique({
    where: { userId_game: { userId, game: "DOTA2" } },
    select: { externalId: true },
  });
  if (ownProfile && ownProfile.externalId !== String(accountId)) {
    return NextResponse.json(
      {
        error:
          "Você já possui uma conta Dota 2 vinculada. Para trocar de conta, entre em contato com o suporte.",
      },
      { status: 409 }
    );
  }

  const gameProfile = await prisma.gameProfile.upsert({
    where: { userId_game: { userId, game: "DOTA2" } },
    update: {
      displayName: playerProfile.profile.personaname,
      avatarUrl: playerProfile.profile.avatarfull,
      stats: statsJson,
      lastSyncAt: new Date(),
    },
    create: {
      userId,
      game: "DOTA2",
      externalId: String(accountId),
      displayName: playerProfile.profile.personaname,
      avatarUrl: playerProfile.profile.avatarfull,
      stats: statsJson,
      lastSyncAt: new Date(),
    },
  });

  void evaluateMatchSignals(userId);

  return NextResponse.json(gameProfile, { status: 201 });
}
