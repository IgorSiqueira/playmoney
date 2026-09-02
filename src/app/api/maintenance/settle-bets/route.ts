import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchRecentMatches, fetchMatchDetails, didPlayerWinMatch } from "@/lib/opendota";
import { verifyEventOutcome } from "@/lib/bet-events";
import { syncDota2Profile } from "@/lib/game-sync";
import {
  guardMatchSameDay,
  guardBetBeforeMatchEnd,
  guardBetBeforeMatchStart,
  guardMatchDataIntegrity,
  guardMatchLobbyType,
  guardMatchMinDuration,
  guardMatchGameMode,
  guardDailyWinningsCap,
  LIMITS,
} from "@/lib/bet-guards";

// Aguarda 15 min após fim da partida para garantir que OpenDota processou os dados
const OPENDOTA_PARSE_BUFFER_MS = 15 * 60_000;

// Chamado a cada 10 min pelo Coolify Scheduled Task
export async function GET(req: Request) {
  const expectedSecret = process.env.MAINTENANCE_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "MAINTENANCE_SECRET não configurado." }, { status: 503 });
  }
  const secret = req.headers.get("x-maintenance-secret");
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return runAutoSettle();
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  return runAutoSettle();
}

async function runAutoSettle() {
  // Só processa apostas velhas o suficiente para uma partida ter terminado (≥ 35 min)
  const minAgeMs = (LIMITS.MIN_MATCH_DURATION_SECONDS + 15 * 60) * 1000;
  const cutoff = new Date(Date.now() - minAgeMs);

  const activeBets = await prisma.bet.findMany({
    where: { status: "ACTIVE", createdAt: { lte: cutoff } },
    include: { gameProfile: true, user: { include: { wallet: true } } },
  });

  const results = {
    processed: activeBets.length,
    settled: 0,
    skipped: 0,
    errors: [] as string[],
  };

  const now = Date.now();

  for (const bet of activeBets) {
    try {
      const accountId = Number(bet.gameProfile.externalId);
      const recentMatches = await fetchRecentMatches(accountId, 10);

      // Filtra candidatos já usando os campos da recentMatches (evita fetchMatchDetails desnecessário)
      const betCreatedMs = bet.createdAt.getTime();
      const candidates = recentMatches
        .filter((m) => {
          const startMs = m.start_time * 1000;
          const endMs = startMs + m.duration * 1000;
          return (
            // Aposta criada ≥ 5 min antes do início
            startMs >= betCreatedMs + LIMITS.MIN_BET_BEFORE_MATCH_START_MINUTES * 60_000 &&
            // Partida terminou há pelo menos 15 min (OpenDota precisa de tempo para parsear)
            endMs < now - OPENDOTA_PARSE_BUFFER_MS &&
            // Duração mínima e modo válido (pré-filtro por campos disponíveis)
            m.duration >= LIMITS.MIN_MATCH_DURATION_SECONDS &&
            LIMITS.ALLOWED_LOBBY_TYPES.includes(m.lobby_type) &&
            LIMITS.ALLOWED_GAME_MODES.includes(m.game_mode) &&
            guardMatchSameDay(bet.createdAt, m.start_time).ok
          );
        })
        .sort((a, b) => a.start_time - b.start_time); // mais antiga primeiro

      if (candidates.length === 0) {
        results.skipped++;
        continue;
      }

      let settled = false;

      for (const candidate of candidates) {
        const matchIdStr = String(candidate.match_id);

        // Verifica que o match não foi usado para outra aposta deste perfil
        const alreadyUsed = await prisma.bet.findFirst({
          where: { matchId: matchIdStr, gameProfileId: bet.gameProfileId, status: { in: ["WON", "LOST", "CANCELLED"] } },
        });
        if (alreadyUsed) continue;

        // Busca dados completos para validação final e condições do combo
        const match = await fetchMatchDetails(matchIdStr);
        if (!match) continue;

        if (!guardMatchDataIntegrity(match).ok) continue;
        if (!guardMatchLobbyType(match.lobby_type).ok) continue;
        if (!guardMatchMinDuration(match.duration).ok) continue;
        if (!guardMatchGameMode(match.game_mode).ok) continue;
        if (!guardBetBeforeMatchStart(bet.createdAt, match.start_time).ok) continue;
        if (!guardBetBeforeMatchEnd(bet.createdAt, match.start_time, match.duration).ok) continue;

        const player = match.players.find((p) => p.account_id === accountId);
        if (!player) continue;

        // Verificação anti-conluio (parceiros conhecidos)
        const betData = bet.matchData as {
          knownTeammatesSnapshot?: number[];
          conditions?: Array<{ type: string; threshold: number }>;
        } | null;
        const knownTeammates = new Set<number>(betData?.knownTeammatesSnapshot ?? []);

        if (knownTeammates.size > 0) {
          const ourSideRadiant = player.player_slot < 128;
          const hasKnownTeammate = match.players.some(
            (p) =>
              p.account_id &&
              p.account_id !== accountId &&
              (p.player_slot < 128) === ourSideRadiant &&
              knownTeammates.has(p.account_id)
          );

          if (hasKnownTeammate) {
            await prisma.$transaction(async (tx) => {
              const cancelled = await tx.bet.updateMany({
                where: { id: bet.id, status: "ACTIVE" },
                data: { status: "CANCELLED", settledAt: new Date(), matchId: matchIdStr },
              });
              if (cancelled.count === 0) throw new Error("ALREADY_SETTLED");
              const wallet = await tx.wallet.update({
                where: { userId: bet.userId },
                data: { balance: { increment: Number(bet.amount) } },
              });
              await tx.transaction.create({
                data: {
                  walletId: wallet.id, type: "DEPOSIT", amount: Number(bet.amount),
                  status: "COMPLETED", description: "Aposta cancelada automaticamente — parceiro detectado.",
                },
              });
            });
            settled = true;
            results.settled++;
            break;
          }
        }

        // Determina o resultado
        const playerWon = didPlayerWinMatch(match, accountId);
        if (playerWon === null) continue;

        let betWon = (bet.prediction === "WIN" && playerWon) || (bet.prediction === "LOSE" && !playerWon);

        if (betWon) {
          let xpmUnavailable = false;
          for (const cond of betData?.conditions ?? []) {
            try {
              if (!verifyEventOutcome(cond.type, "OVER", cond.threshold, player)) {
                betWon = false;
                break;
              }
            } catch (err) {
              if (err instanceof Error && err.message === "XPM_NOT_AVAILABLE") {
                // OpenDota ainda não processou os dados de XPM — tenta na próxima rodada do cron
                xpmUnavailable = true;
                break;
              }
            }
          }
          if (xpmUnavailable) continue;
        }

        if (betWon) {
          const dailyGuard = await guardDailyWinningsCap(bet.userId, Number(bet.potentialPayout));
          if (!dailyGuard.ok) continue; // cap atingido — não liquida agora
        }

        // Liquidação atômica
        await prisma.$transaction(async (tx) => {
          const updated = await tx.bet.updateMany({
            where: { id: bet.id, status: "ACTIVE" },
            data: {
              matchId: matchIdStr,
              status: betWon ? "WON" : "LOST",
              settledAt: new Date(),
              matchData: JSON.parse(JSON.stringify({
                ...((bet.matchData as object) ?? {}),
                matchResult: {
                  playerWon, matchId: matchIdStr,
                  matchStartTime: match.start_time, duration: match.duration,
                  lobbyType: match.lobby_type, gameMode: match.game_mode,
                  autoSettled: true,
                },
              })),
            },
          });

          if (updated.count === 0) throw new Error("ALREADY_SETTLED");

          if (betWon) {
            const wallet = await tx.wallet.update({
              where: { userId: bet.userId },
              data: { balance: { increment: Number(bet.potentialPayout) } },
            });
            await tx.transaction.create({
              data: {
                walletId: wallet.id, type: "BET_WON", amount: Number(bet.potentialPayout),
                status: "COMPLETED",
                description: `Prêmio automático — Aposta ganha em Dota 2 (match #${matchIdStr})`,
              },
            });
          } else {
            const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
            if (wallet) {
              await tx.transaction.create({
                data: {
                  walletId: wallet.id, type: "BET_LOST", amount: Number(bet.amount),
                  status: "COMPLETED",
                  description: `Aposta perdida em Dota 2 (match #${matchIdStr})`,
                },
              });
            }
          }
        });

        // Sync do perfil em background após liquidação
        void syncDota2Profile(bet.userId).catch(() => null);

        settled = true;
        results.settled++;
        break;
      }

      if (!settled) results.skipped++;
    } catch (err) {
      results.errors.push(`bet ${bet.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({ ...results, ranAt: new Date().toISOString() });
}
