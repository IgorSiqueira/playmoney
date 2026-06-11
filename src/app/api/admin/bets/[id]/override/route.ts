import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const overrideSchema = z.object({
  outcome: z.enum(["WON", "LOST"]),
  reason:  z.string().max(200).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verificar role ADMIN
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  const body = await req.json();
  const parsed = overrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { outcome, reason } = parsed.data;

  // Buscar a aposta — só ACTIVE pode ser forçada
  const bet = await prisma.bet.findUnique({
    where: { id },
    include: { gameProfile: { select: { userId: true } } },
  });

  if (!bet) {
    return NextResponse.json({ error: "Aposta não encontrada" }, { status: 404 });
  }
  if (bet.status !== "ACTIVE") {
    return NextResponse.json(
      { error: `Aposta já foi liquidada com status "${bet.status}". Só apostas ACTIVE podem ser forçadas.` },
      { status: 409 }
    );
  }

  const betWon  = outcome === "WON";
  const userId  = bet.userId;

  const result = await prisma.$transaction(async (tx) => {
    // Atualizar status da aposta
    const updated = await tx.bet.update({
      where: { id },
      data: {
        status:    outcome,
        settledAt: new Date(),
        matchId:   bet.matchId ?? "ADMIN_OVERRIDE",
        matchData: {
          ...((bet.matchData as object) ?? {}),
          adminOverride: {
            adminId:    session.user!.id,
            outcome,
            reason:     reason ?? null,
            overriddenAt: new Date().toISOString(),
          },
        },
      },
    });

    if (betWon) {
      // Creditar payout na carteira do usuário
      const wallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: Number(bet.potentialPayout) } },
      });

      await tx.transaction.create({
        data: {
          walletId:    wallet.id,
          type:        "BET_WON",
          amount:      Number(bet.potentialPayout),
          status:      "COMPLETED",
          description: `Prêmio — Override admin · ${reason ?? "sem motivo"}`,
        },
      });
    } else {
      // Registrar perda (o valor já foi debitado no momento da aposta)
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (wallet) {
        await tx.transaction.create({
          data: {
            walletId:    wallet.id,
            type:        "BET_LOST",
            amount:      Number(bet.amount),
            status:      "COMPLETED",
            description: `Aposta perdida — Override admin · ${reason ?? "sem motivo"}`,
          },
        });
      }
    }

    return updated;
  });

  return NextResponse.json({ bet: result, betWon, payout: betWon ? Number(bet.potentialPayout) : 0 });
}
