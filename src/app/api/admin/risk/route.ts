import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const showReviewed = searchParams.get("reviewed") === "true";

  const flags = await prisma.riskFlag.findMany({
    where: { reviewedAt: showReviewed ? { not: null } : null },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true, suspendedAt: true } },
    },
  });

  return NextResponse.json(flags);
}
