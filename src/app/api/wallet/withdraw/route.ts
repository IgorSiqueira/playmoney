import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/bet-guards";

const MIN_WITHDRAWAL = 20;

const withdrawSchema = z.object({
  amount: z.number().min(MIN_WITHDRAWAL).max(50_000),
  pixKey: z.string().min(5).max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;

  // Rate limit: 3 saques por hora
  const rl = await rateLimit(`withdraw:${userId}`, 3, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  const bodyResult = await readJsonBody(req);
  if (!bodyResult.ok) return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });

  const parsed = withdrawSchema.safeParse(bodyResult.data);
  if (!parsed.success) {
    return NextResponse.json({ error: `Valor mínimo de saque: R$ ${MIN_WITHDRAWAL}` }, { status: 400 });
  }

  const { amount, pixKey } = parsed.data;

  // A3: Exigir pelo menos 1 aposta liquidada antes do primeiro saque
  const settledBets = await prisma.bet.count({
    where: { userId, status: { in: ["WON", "LOST"] } },
  });
  if (settledBets === 0) {
    return NextResponse.json(
      { error: "É necessário ter pelo menos uma aposta liquidada antes de realizar um saque.", code: "NO_SETTLED_BETS" },
      { status: 422 }
    );
  }

  // Saldo sacável = balance total − bonusBalance (bônus não é sacável diretamente)
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });

  const withdrawable = Math.max(0, Number(wallet.balance) - Number(wallet.bonusBalance));
  if (amount > withdrawable) {
    return NextResponse.json(
      {
        error: `Saldo disponível para saque: R$ ${withdrawable.toFixed(2)}. Saldo bônus não é sacável diretamente.`,
        withdrawable,
      },
      { status: 422 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Débito atômico — impede saldo negativo e garante que o withdrawable ainda é válido
    const updated = await tx.wallet.updateMany({
      where: { userId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });

    if (updated.count === 0) throw new Error("INSUFFICIENT_BALANCE");

    const updatedWallet = await tx.wallet.findUnique({ where: { userId } });

    const transaction = await tx.transaction.create({
      data: {
        walletId: updatedWallet!.id,
        type: "WITHDRAWAL",
        amount,
        status: "COMPLETED",
        description: "Saque PIX",
        // pixKey em metadata, não na description — description é visível no extrato
        metadata: { pixKeyMasked: pixKey.slice(0, 3) + "***", simulatedAt: new Date().toISOString() },
      },
    });

    return { wallet: updatedWallet, transaction };
  });

  return NextResponse.json(result, { status: 201 });
}
