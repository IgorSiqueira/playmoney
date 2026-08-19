import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { name: true, email: true } },
      uses: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true, createdAt: true } } },
      },
    },
  });

  const unauthorized = await prisma.user.findMany({
    where: { canGenerateInvites: true, invite: null },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ invites, unauthorized });
}
