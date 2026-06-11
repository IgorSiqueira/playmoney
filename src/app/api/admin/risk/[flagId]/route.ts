import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewFlag } from "@/lib/risk";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ flagId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { flagId } = await params;

  const flag = await prisma.riskFlag.findUnique({ where: { id: flagId } });
  if (!flag) return NextResponse.json({ error: "Flag não encontrada" }, { status: 404 });
  if (flag.reviewedAt) return NextResponse.json({ error: "Flag já revisada" }, { status: 409 });

  await reviewFlag(flagId, session.user.id);

  return NextResponse.json({ ok: true });
}

/** Suspende manualmente um usuário (independente do score) */
export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ flagId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { flagId } = await params;
  const flag = await prisma.riskFlag.findUnique({ where: { id: flagId }, select: { userId: true } });
  if (!flag) return NextResponse.json({ error: "Flag não encontrada" }, { status: 404 });

  await prisma.user.update({
    where: { id: flag.userId },
    data: { suspendedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
