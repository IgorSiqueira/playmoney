import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { guardBodySize } from "@/lib/bet-guards";

const MIN_WITHDRAWAL = 20;

const withdrawSchema = z.object({
  amount: z.number().min(MIN_WITHDRAWAL).max(50_000),
  pixKey: z.string().min(5).max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;

  const bodySizeGuard = guardBodySize(req.headers.get("content-length"));
  if (!bodySizeGuard.ok) return NextResponse.json({ error: bodySizeGuard.error }, { status: 413 });

  // Rate limit: 3 saques por hora
  const rl = await rateLimit(`withdraw:${userId}`, 3, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  const body = await req.json();
  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: `Valor mínimo de saque: R$ ${MIN_WITHDRAWAL}` }, { status: 400 });
  }

  const { amount, pixKey } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    // Débito atômico — impede saldo negativo
    const updated = await tx.wallet.updateMany({
      where: { userId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });

    if (updated.count === 0) throw new Error("INSUFFICIENT_BALANCE");

    const wallet = await tx.wallet.findUnique({ where: { userId } });

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet!.id,
        type: "WITHDRAWAL",
        amount,
        status: "COMPLETED",
        description: `Saque PIX simulado · Chave: ${pixKey}`,
        metadata: { pixKey, simulatedAt: new Date().toISOString() },
      },
    });

    return { wallet, transaction };
  });

  return NextResponse.json(result, { status: 201 });
}
