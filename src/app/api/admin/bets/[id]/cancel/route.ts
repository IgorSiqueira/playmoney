import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-log";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const bet = await prisma.bet.findUnique({ where: { id } });
  if (!bet) return NextResponse.json({ error: "Aposta não encontrada" }, { status: 404 });
  if (bet.status !== "ACTIVE") {
    return NextResponse.json({ error: `Aposta já liquidada (${bet.status})` }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.bet.update({ where: { id }, data: { status: "CANCELLED", settledAt: new Date() } });

    const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
    if (!wallet) return;

    await tx.wallet.update({
      where: { userId: bet.userId },
      data: { balance: { increment: Number(bet.amount) } },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "BONUS",
        amount: Number(bet.amount),
        status: "COMPLETED",
        description: `Reembolso — aposta cancelada pelo admin`,
        metadata: { betId: id, adminId: session.user!.id },
      },
    });
  });

  void logAdminAction(session.user.id, admin.email ?? "", "CANCEL_BET", bet.userId, { betId: id, amount: Number(bet.amount) });

  return NextResponse.json({ ok: true });
}
