import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LIMITS } from "@/lib/bet-guards";

// Pode ser chamado via cron externo (GET /api/maintenance/expire-bets)
// ou manualmente pelo admin
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }, select: { role: true },
  });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  return runExpiry();
}

// GET público pode ser protegido por secret header em produção
export async function GET(req: Request) {
  const secret = req.headers.get("x-maintenance-secret");
  if (secret !== process.env.MAINTENANCE_SECRET && process.env.MAINTENANCE_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return runExpiry();
}

async function runExpiry() {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - LIMITS.BET_EXPIRY_DAYS);

  const expiredBets = await prisma.bet.findMany({
    where: { status: "ACTIVE", createdAt: { lt: expiryDate } },
    include: { user: { include: { wallet: true } } },
  });

  let cancelled = 0;
  let refunded = 0;

  for (const bet of expiredBets) {
    const wallet = bet.user.wallet;
    if (!wallet) continue;

    await prisma.$transaction(async (tx) => {
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: "CANCELLED", settledAt: new Date() },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: Number(bet.amount) } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          amount: Number(bet.amount),
          status: "COMPLETED",
          description: `Estorno automático — Aposta #${bet.id.slice(-6)} expirada`,
        },
      });
    });

    cancelled++;
    refunded += Number(bet.amount);
  }

  return NextResponse.json({
    processed: expiredBets.length,
    cancelled,
    totalRefunded: refunded,
    ranAt: new Date().toISOString(),
  });
}
