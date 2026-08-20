import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-log";
import {
  fetchPlayerProfile,
  fetchRecentMatches,
  calculatePlayerStats,
  normalizePlayerId,
} from "@/lib/opendota";
import { calculateDynamicOdds } from "@/lib/odds";

const STEAM_ID_REGEX = /^(\d{1,10}|7656119\d{10})$/;

const schema = z.object({
  steamId: z.string().regex(STEAM_ID_REGEX, "Steam ID inválido"),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id: targetUserId } = await params;

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, email: true } });
  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Steam ID inválido" }, { status: 400 });
  }

  const accountId = normalizePlayerId(parsed.data.steamId);
  if (accountId <= 0 || accountId > 4_294_967_295) {
    return NextResponse.json({ error: "Steam ID fora do intervalo válido." }, { status: 400 });
  }

  // Bloquear se o usuário tem apostas ativas — não podemos trocar a conta durante uma aposta em andamento
  const activeBets = await prisma.bet.count({
    where: { userId: targetUserId, status: "ACTIVE" },
  });
  if (activeBets > 0) {
    return NextResponse.json(
      { error: `Usuário tem ${activeBets} aposta(s) ativa(s). Cancele-as antes de trocar a conta Steam.`, code: "HAS_ACTIVE_BETS" },
      { status: 409 }
    );
  }

  // Verificar se o Steam ID já está vinculado a outro usuário
  const takenByOther = await prisma.gameProfile.findFirst({
    where: { externalId: String(accountId), game: "DOTA2", NOT: { userId: targetUserId } },
  });
  if (takenByOther) {
    return NextResponse.json(
      { error: "Este perfil Steam já está vinculado a outra conta na plataforma." },
      { status: 409 }
    );
  }

  // Buscar dados da nova conta no OpenDota
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

  const odds = calculateDynamicOdds(recentMatches, stats);
  const statsJson = JSON.parse(JSON.stringify({ ...stats, odds, recentMatches: recentMatches.slice(0, 10) }));

  const currentProfile = await prisma.gameProfile.findUnique({
    where: { userId_game: { userId: targetUserId, game: "DOTA2" } },
    select: { externalId: true },
  });

  const gameProfile = await prisma.gameProfile.upsert({
    where: { userId_game: { userId: targetUserId, game: "DOTA2" } },
    update: {
      externalId:  String(accountId),
      displayName: playerProfile.profile.personaname,
      avatarUrl:   playerProfile.profile.avatarfull,
      stats:       statsJson,
      lastSyncAt:  new Date(),
    },
    create: {
      userId:      targetUserId,
      game:        "DOTA2",
      externalId:  String(accountId),
      displayName: playerProfile.profile.personaname,
      avatarUrl:   playerProfile.profile.avatarfull,
      stats:       statsJson,
      lastSyncAt:  new Date(),
    },
  });

  void logAdminAction(session.user.id, admin.email ?? "", "CHANGE_STEAM_ACCOUNT", targetUserId, {
    oldExternalId: currentProfile?.externalId ?? null,
    newExternalId: String(accountId),
    newDisplayName: playerProfile.profile.personaname,
    targetEmail: target.email,
  }).catch((e) => console.error("[admin-log] change steam failed:", e));

  return NextResponse.json(gameProfile);
}
