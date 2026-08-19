import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      suspendedAt: true, depositsBlocked: true, depositLimit: true, canGenerateInvites: true, createdAt: true,
      wallet: { select: { balance: true, bonusBalance: true } },
      bets: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, status: true, amount: true, potentialPayout: true,
          prediction: true, createdAt: true,
          gameProfile: { select: { displayName: true } },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json(user);
}
