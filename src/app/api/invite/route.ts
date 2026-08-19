import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { canGenerateInvites: true },
  });
  if (!user?.canGenerateInvites) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  // Auto-create invite if it doesn't exist yet
  let invite = await prisma.invite.findUnique({ where: { creatorId: session.user.id } });
  if (!invite) {
    let code = generateCode();
    // Ensure uniqueness
    while (await prisma.invite.findUnique({ where: { code } })) {
      code = generateCode();
    }
    invite = await prisma.invite.create({ data: { code, creatorId: session.user.id } });
  }

  const uses = await prisma.inviteUse.findMany({
    where: { inviteId: invite.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, createdAt: true } } },
  });

  return NextResponse.json({ invite, uses, total: uses.length });
}
