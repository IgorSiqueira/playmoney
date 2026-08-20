import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/bet-guards";
import { PLATFORM } from "@/lib/platform-config";

const DEFAULT_DAILY_DEPOSIT_LIMIT = 2000; // R$ 2.000 por dia — fallback quando não há config global

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

  // [Security 7] Rate limit: 10 depósitos por hora por usuário
  const rl = await rateLimit(`deposit:${userId}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  const bodyResult = await readJsonBody(req);
  if (!bodyResult.ok) return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });

  const parsed = depositSchema.safeParse(bodyResult.data);

  if (!parsed.success) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  const { amount } = parsed.data;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Fetch platform settings, user deposit restrictions, and wallet in parallel
  const [platformSettings, userRestrictions, wallet] = await Promise.all([
    prisma.platformSettings.findFirst(),
    prisma.user.findUnique({ where: { id: userId }, select: { depositsBlocked: true, depositLimit: true } }),
    prisma.wallet.findUnique({ where: { userId } }),
  ]);

  if (platformSettings?.depositsBlocked) {
    return NextResponse.json({ error: "Depósitos estão temporariamente desabilitados na plataforma." }, { status: 503 });
  }
  if (userRestrictions?.depositsBlocked) {
    return NextResponse.json({ error: "Seus depósitos estão bloqueados. Entre em contato com o suporte." }, { status: 403 });
  }

  if (!wallet) {
    return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });
  }

  const effectiveLimit = Number(
    userRestrictions?.depositLimit ?? platformSettings?.globalDepositLimit ?? DEFAULT_DAILY_DEPOSIT_LIMIT
  );

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
  if (totalToday + amount > effectiveLimit) {
    const remaining = Math.max(0, effectiveLimit - totalToday);
    return NextResponse.json(
      {
        error: `Limite diário de depósito atingido. Você ainda pode depositar R$ ${remaining.toFixed(2)} hoje.`,
        remainingToday: remaining,
        dailyLimit: effectiveLimit,
      },
      { status: 422 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Check-and-set atômico: updateMany só atualiza se depositBonusClaimed ainda for false.
    // Em requisições concorrentes, a segunda encontra 0 linhas e não ganha bônus.
    let bonusAmount = 0;
    if (amount >= PLATFORM.MIN_BONUS_DEP) {
      const claimed = await tx.wallet.updateMany({
        where: { userId, depositBonusClaimed: false },
        data: { depositBonusClaimed: true },
      });
      if (claimed.count > 0) {
        bonusAmount = Math.min(amount * PLATFORM.BONUS_RATE, PLATFORM.BONUS_CAP);
      }
    }

    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        balance:      { increment: amount + bonusAmount },
        bonusBalance: { increment: bonusAmount },
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
          description: `Bônus de boas-vindas (${PLATFORM.BONUS_RATE * 100}% do depósito, máx. R$ ${PLATFORM.BONUS_CAP})`,
          metadata:    { depositAmount: amount, bonusRate: PLATFORM.BONUS_RATE },
        },
      });
    }

    return { wallet: updatedWallet, bonusAmount };
  });

  return NextResponse.json(result, { status: 201 });
}
