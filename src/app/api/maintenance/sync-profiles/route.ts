import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncDota2Profile } from "@/lib/game-sync";

// Perfis com aposta ativa: sync a cada 1h. Demais: a cada 6h.
const ACTIVE_BET_STALENESS_H  = 1;
const REGULAR_STALENESS_H     = 6;

// Chamado a cada 1h pelo Coolify Scheduled Task
export async function GET(req: Request) {
  const expectedSecret = process.env.MAINTENANCE_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "MAINTENANCE_SECRET não configurado." }, { status: 503 });
  }
  const secret = req.headers.get("x-maintenance-secret");
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return runSync();
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  return runSync();
}

async function runSync() {
  const now = Date.now();
  const activeCutoff  = new Date(now - ACTIVE_BET_STALENESS_H  * 3_600_000);
  const regularCutoff = new Date(now - REGULAR_STALENESS_H     * 3_600_000);

  // Perfis com aposta ativa têm threshold menor de staleness
  const profilesWithActiveBet = await prisma.gameProfile.findMany({
    where: {
      game: "DOTA2",
      lastSyncAt: { lt: activeCutoff },
      bets: { some: { status: "ACTIVE" } },
    },
    select: { userId: true, id: true },
  });

  // Demais perfis que também estão desatualizados
  const activeIds = new Set(profilesWithActiveBet.map((p) => p.id));
  const regularProfiles = await prisma.gameProfile.findMany({
    where: {
      game: "DOTA2",
      lastSyncAt: { lt: regularCutoff },
      id: { notIn: [...activeIds] },
    },
    select: { userId: true, id: true },
    take: 50, // limita para não sobrecarregar OpenDota em uma rodada
  });

  const toSync = [...profilesWithActiveBet, ...regularProfiles];

  let synced = 0;
  let failed = 0;

  for (const profile of toSync) {
    const result = await syncDota2Profile(profile.userId);
    if (result) synced++;
    else failed++;
  }

  return NextResponse.json({
    synced,
    failed,
    withActiveBet: profilesWithActiveBet.length,
    regular: regularProfiles.length,
    ranAt: new Date().toISOString(),
  });
}
