import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { guardBodySize } from "@/lib/bet-guards";

const DAILY_DEPOSIT_LIMIT = 2000; // R$ 2.000 por dia

const depositSchema = z.object({
  amount: z.number().min(10).max(10000),
  pixKey: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!wallet) {
    return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });
  }

  return NextResponse.json(wallet);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = session.user.id;

  // [V7] Limite de tamanho do body
  const bodySizeGuard = guardBodySize(req.headers.get("content-length"));
  if (!bodySizeGuard.ok) return NextResponse.json({ error: bodySizeGuard.error }, { status: 413 });

  // [Security 7] Rate limit: 10 depósitos por hora por usuário
  const rl = await rateLimit(`deposit:${userId}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  const body = await req.json();
  const parsed = depositSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  const { amount } = parsed.data;

  // [Security 6] Limite diário de depósito: R$ 2.000
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });
  }

  const depositsToday = await prisma.transaction.aggregate({
    where: {
      walletId: wallet.id,
      type: "DEPOSIT",
      status: "COMPLETED",
      createdAt: { gte: startOfDay },
    },
    _sum: { amount: true },
  });

  const totalToday = Number(depositsToday._sum.amount ?? 0);
  if (totalToday + amount > DAILY_DEPOSIT_LIMIT) {
    const remaining = Math.max(0, DAILY_DEPOSIT_LIMIT - totalToday);
    return NextResponse.json(
      {
        error: `Limite diário de depósito atingido. Você ainda pode depositar R$ ${remaining.toFixed(2)} hoje.`,
        remainingToday: remaining,
        dailyLimit: DAILY_DEPOSIT_LIMIT,
      },
      { status: 422 }
    );
  }

  // ── Bônus de primeiro depósito ─────────────────────────────────────────────
  // 50% do valor depositado, máximo R$ 50, apenas no primeiro depósito
  const BONUS_RATE    = 0.5;
  const BONUS_CAP     = 50;
  const MIN_BONUS_DEP = 20; // depósito mínimo para ganhar bônus
  const bonusAmount   = !wallet.depositBonusClaimed && amount >= MIN_BONUS_DEP
    ? Math.min(amount * BONUS_RATE, BONUS_CAP)
    : 0;

  const result = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        balance:             { increment: amount + bonusAmount },
        bonusBalance:        { increment: bonusAmount },
        depositBonusClaimed: bonusAmount > 0 ? true : wallet.depositBonusClaimed,
      },
    });

    await tx.transaction.create({
      data: {
        walletId:    updatedWallet.id,
        type:        "DEPOSIT",
        amount,
        status:      "COMPLETED",
        description: "Depósito via PIX simulado",
        metadata:    { simulatedAt: new Date().toISOString() },
      },
    });

    if (bonusAmount > 0) {
      await tx.transaction.create({
        data: {
          walletId:    updatedWallet.id,
          type:        "BONUS",
          amount:      bonusAmount,
          status:      "COMPLETED",
          description: `Bônus de boas-vindas (50% do depósito, máx. R$ 50)`,
          metadata:    { depositAmount: amount, bonusRate: BONUS_RATE },
        },
      });
    }

    return { wallet: updatedWallet, bonusAmount };
  });

  return NextResponse.json(result, { status: 201 });
}
