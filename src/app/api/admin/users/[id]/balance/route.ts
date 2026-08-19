import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-log";

const schema = z.object({
  amount: z.number().min(-100000).max(100000).refine((v) => v !== 0, "Valor não pode ser zero"),
  reason: z.string().min(3).max(200),
});

export async function POST(
  req: Request,
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
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

  const { amount, reason } = parsed.data;

  const wallet = await prisma.wallet.findUnique({ where: { userId: id } });
  if (!wallet) return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });

  if (Number(wallet.balance) + amount < 0) {
    return NextResponse.json({ error: "Saldo insuficiente para esse débito" }, { status: 422 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.wallet.update({
      where: { userId: id },
      data: { balance: { increment: amount } },
    });
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: amount > 0 ? "BONUS" : "WITHDRAWAL",
        amount: Math.abs(amount),
        status: "COMPLETED",
        description: `Ajuste admin: ${reason}`,
        metadata: { adminId: session.user!.id, adminEmail: admin.email, amount, reason },
      },
    });
    return updated;
  });

  void logAdminAction(session.user.id, admin.email ?? "", "ADJUST_BALANCE", id, { amount, reason });

  return NextResponse.json({ balance: Number(result.balance) });
}
