import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { evaluateBetSignals } from "@/lib/risk";
import { syncDota2Profile } from "@/lib/game-sync";
import { prisma } from "@/lib/prisma";
import { fetchMatchDetails, didPlayerWinMatch } from "@/lib/opendota";
import { verifyEventOutcome } from "@/lib/bet-events";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  guardBetExpiry,
  guardDailyWinningsCap,
  guardMatchSameDay,
  guardBetBeforeMatchEnd,
  guardMatchDataIntegrity,
  guardMatchLobbyType,
  guardMatchMinDuration,
  guardMatchGameMode,
  guardBodySize,
} from "@/lib/bet-guards";

const MATCH_MAX_AGE_DAYS = 30;
const CLOCK_SKEW_BUFFER_MS = 60_000; // 1 minuto de tolerância

const settleSchema = z.object({
  matchId: z.string().regex(/^\d{5,13}$/, "Match ID inválido"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = session.user.id;

  // [Security 7] Rate limit: 10 liquidações por hora por usuário
  const rl = await rateLimit(`settle:${userId}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  // [V7] Limite de tamanho do body
  const bodySizeGuard = guardBodySize(req.headers.get("content-length"));
  if (!bodySizeGuard.ok) return NextResponse.json({ error: bodySizeGuard.error }, { status: 413 });

  const { id } = await params;
  const body = await req.json();
  const parsed = settleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Match ID inválido" }, { status: 400 });
  }

  const bet = await prisma.bet.findFirst({
    where: { id, userId, status: "ACTIVE" },
    include: { gameProfile: true },
  });

  if (!bet) {
    return NextResponse.json({ error: "Aposta não encontrada ou já liquidada" }, { status: 404 });
  }

  // [E10] Aposta expirada (> 14 dias sem liquidar)
  const expiryGuard = guardBetExpiry(bet.createdAt);
  if (!expiryGuard.ok) {
    // Cancela automaticamente a aposta expirada e devolve o valor
    await prisma.$transaction(async (tx) => {
      await tx.bet.update({ where: { id }, data: { status: "CANCELLED", settledAt: new Date() } });
      const wallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: Number(bet.amount) } },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          amount: Number(bet.amount),
          status: "COMPLETED",
          description: `Estorno — Aposta expirada sem liquidação (match não submetido em 14 dias)`,
        },
      });
    });
    return NextResponse.json({ error: expiryGuard.error, code: expiryGuard.code, refunded: true }, { status: 422 });
  }

  const match = await fetchMatchDetails(parsed.data.matchId);
  if (!match) {
    return NextResponse.json(
      { error: "Partida não encontrada. Verifique o Match ID e tente novamente." },
      { status: 404 }
    );
  }

  // [V5] Validar integridade estrutural dos dados antes de usar
  const integrityGuard = guardMatchDataIntegrity(match);
  if (!integrityGuard.ok) {
    return NextResponse.json({ error: integrityGuard.error, code: integrityGuard.code }, { status: 422 });
  }

  // [V1] Apenas lobby types competitivos/públicos
  const lobbyGuard = guardMatchLobbyType(match.lobby_type);
  if (!lobbyGuard.ok) {
    return NextResponse.json({ error: lobbyGuard.error, code: lobbyGuard.code }, { status: 422 });
  }

  // [V2] Duração mínima de 20 minutos
  const durationGuard = guardMatchMinDuration(match.duration);
  if (!durationGuard.ok) {
    return NextResponse.json({ error: durationGuard.error, code: durationGuard.code }, { status: 422 });
  }

  // [V8] Apenas game modes competitivos
  const gameModeGuard = guardMatchGameMode(match.game_mode);
  if (!gameModeGuard.ok) {
    return NextResponse.json({ error: gameModeGuard.error, code: gameModeGuard.code }, { status: 422 });
  }

  const matchStartMs = match.start_time * 1000;
  const now = Date.now();

  // [Security 3] Partida não pode ter mais de 30 dias (safety net global)
  const maxAgeMs = MATCH_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  if (matchStartMs < now - maxAgeMs) {
    return NextResponse.json(
      { error: `Partida inválida: só são aceitas partidas dos últimos ${MATCH_MAX_AGE_DAYS} dias.` },
      { status: 422 }
    );
  }

  // [Security 1] Partida deve ter começado APÓS a criação da aposta
  const betCreatedMs = bet.createdAt.getTime();
  if (matchStartMs < betCreatedMs - CLOCK_SKEW_BUFFER_MS) {
    return NextResponse.json(
      { error: "Partida inválida: esta partida foi jogada antes da sua aposta ser criada." },
      { status: 422 }
    );
  }

  // [E11] Partida deve ser do mesmo dia da aposta (horário BRT)
  const sameDayGuard = guardMatchSameDay(bet.createdAt, match.start_time);
  if (!sameDayGuard.ok) {
    return NextResponse.json({ error: sameDayGuard.error, code: sameDayGuard.code }, { status: 422 });
  }

  // [E12] Aposta deve ter sido criada com ≥ 15 min de antecedência ao fim da partida
  const timingGuard = guardBetBeforeMatchEnd(bet.createdAt, match.start_time, match.duration);
  if (!timingGuard.ok) {
    return NextResponse.json({ error: timingGuard.error, code: timingGuard.code }, { status: 422 });
  }

  // [Security 2] Mesmo matchId não pode ser reutilizado na mesma conta
  const alreadyUsed = await prisma.bet.findFirst({
    where: {
      matchId: parsed.data.matchId,
      gameProfileId: bet.gameProfileId,
      status: { in: ["WON", "LOST"] },
    },
  });
  if (alreadyUsed) {
    return NextResponse.json(
      { error: "Esta partida já foi usada para liquidar outra aposta deste perfil." },
      { status: 422 }
    );
  }

  const accountId = Number(bet.gameProfile.externalId);
  const player = match.players.find((p) => p.account_id === accountId);

  if (!player) {
    return NextResponse.json(
      { error: "Você não participou desta partida. Verifique se o Match ID está correto." },
      { status: 400 }
    );
  }

  // [E13] Verificar se algum jogador do time amigo está no histórico de parceiros
  // Snapshot tirado no momento da criação da aposta — imune a sync posterior
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
          where: { id, status: "ACTIVE" },
          data: { status: "CANCELLED", settledAt: new Date(), matchId: parsed.data.matchId },
        });
        if (cancelled.count === 0) throw new Error("ALREADY_SETTLED");
        const wallet = await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: Number(bet.amount) } },
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "DEPOSIT",
            amount: Number(bet.amount),
            status: "COMPLETED",
            description: "Aposta cancelada. Valor devolvido.",
          },
        });
      });
      return NextResponse.json({ cancelled: true, refunded: Number(bet.amount) });
    }
  }

  // Determinar resultado
  let betWon: boolean;
  let playerWon: boolean | null = null;
  const eventType = bet.eventType ?? "WIN_LOSS";

  if (eventType !== "WIN_LOSS") {
    // Legado: aposta em evento isolado (KILLS/ASSISTS/GPM OVER/UNDER)
    try {
      betWon = verifyEventOutcome(eventType, bet.prediction, Number(bet.targetValue ?? 0), player);
    } catch {
      return NextResponse.json({ error: "Tipo de evento inválido na aposta." }, { status: 400 });
    }
  } else {
    // Aposta de vitória (simples ou combo com condições)
    playerWon = didPlayerWinMatch(match, accountId);
    if (playerWon === null) {
      return NextResponse.json({ error: "Não foi possível determinar o resultado da partida." }, { status: 400 });
    }
    betWon = (bet.prediction === "WIN" && playerWon) || (bet.prediction === "LOSE" && !playerWon);

    // Verificar condições do combo (sistema novo) — reutiliza betData já tipado acima
    if (betWon) {
      for (const cond of betData?.conditions ?? []) {
        try {
          if (!verifyEventOutcome(cond.type, "OVER", cond.threshold, player)) {
            betWon = false;
            break;
          }
        } catch {
          // tipo de condição desconhecido — ignora sem anular a aposta
        }
      }
    }
  }

  // [E8] Cap de ganhos diários — verificado antes de creditar
  if (betWon) {
    const dailyGuard = await guardDailyWinningsCap(userId, Number(bet.potentialPayout));
    if (!dailyGuard.ok) {
      return NextResponse.json({ error: dailyGuard.error, code: dailyGuard.code }, { status: 422 });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // [V3] Race condition fix: updateMany com WHERE status="ACTIVE" é atômico.
    // Se dois requests concorrentes chegarem aqui, apenas um vai encontrar 1 row;
    // o segundo encontrará 0 rows (bet já foi marcada WON/LOST) e lança erro.
    const settled = await tx.bet.updateMany({
      where: { id, status: "ACTIVE" },
      data: {
        matchId: parsed.data.matchId,
        status: betWon ? "WON" : "LOST",
        settledAt: new Date(),
        matchData: JSON.parse(
          JSON.stringify({
            ...((bet.matchData as object) ?? {}),
            matchResult: {
              playerWon,
              matchId: parsed.data.matchId,
              matchStartTime: match.start_time,
              duration: match.duration,
              lobbyType: match.lobby_type,
              gameMode: match.game_mode,
            },
          })
        ),
      },
    });

    // [V3] Se count=0, outra requisição concorrente já liquidou — abortamos
    if (settled.count === 0) {
      throw new Error("ALREADY_SETTLED");
    }

    const updatedBet = await tx.bet.findUnique({ where: { id } });

    if (betWon) {
      const wallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: Number(bet.potentialPayout) } },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "BET_WON",
          amount: Number(bet.potentialPayout),
          status: "COMPLETED",
          description: `Prêmio — Aposta ganha em Dota 2 (match #${parsed.data.matchId})`,
        },
      });
    } else {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (wallet) {
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "BET_LOST",
            amount: Number(bet.amount),
            status: "COMPLETED",
            description: `Aposta perdida em Dota 2 (match #${parsed.data.matchId})`,
          },
        });
      }
    }

    return updatedBet;
  });

  // Fire-and-forget: avalia sinais de risco e sincroniza perfil sem bloquear a resposta
  void evaluateBetSignals(userId);
  void syncDota2Profile(userId);

  return NextResponse.json({
    bet: result,
    playerWon,
    betWon,
    payout: betWon ? Number(bet.potentialPayout) : 0,
  });
}
