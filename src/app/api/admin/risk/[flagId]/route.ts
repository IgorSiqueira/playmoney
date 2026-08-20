import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewFlag } from "@/lib/risk";
import { logAdminAction } from "@/lib/admin-log";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ flagId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { flagId } = await params;

  const flag = await prisma.riskFlag.findUnique({ where: { id: flagId } });
  if (!flag) return NextResponse.json({ error: "Flag não encontrada" }, { status: 404 });
  if (flag.reviewedAt) return NextResponse.json({ error: "Flag já revisada" }, { status: 409 });

  await reviewFlag(flagId, session.user.id);

  void logAdminAction(session.user.id, admin.email ?? "", "REVIEW_RISK_FLAG", flag.userId, { flagId }).catch(
    (e) => console.error("[admin-log] review flag failed:", e)
  );

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
    select: { role: true, email: true },
  });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { flagId } = await params;
  const flag = await prisma.riskFlag.findUnique({ where: { id: flagId }, select: { userId: true } });
  if (!flag) return NextResponse.json({ error: "Flag não encontrada" }, { status: 404 });

  await prisma.user.update({
    where: { id: flag.userId },
    data: { suspendedAt: new Date() },
  });

  void logAdminAction(session.user.id, admin.email ?? "", "MANUAL_SUSPEND_USER", flag.userId, { flagId }).catch(
    (e) => console.error("[admin-log] manual suspend failed:", e)
  );

  return NextResponse.json({ ok: true });
}
