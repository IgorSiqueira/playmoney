import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-log";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("suspend") }),
  z.object({ action: z.literal("unsuspend") }),
  z.object({ action: z.literal("blockDeposits") }),
  z.object({ action: z.literal("unblockDeposits") }),
  z.object({ action: z.literal("setDepositLimit"), limit: z.number().min(0).nullable() }),
  z.object({ action: z.literal("enableInvite") }),
  z.object({ action: z.literal("disableInvite") }),
]);

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, email: true } });
  if (admin?.role !== "ADMIN") return null;
  return { id: session.user.id, email: session.user.email ?? "" };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } });
  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (target.role === "ADMIN") return NextResponse.json({ error: "Não é possível modificar outro admin" }, { status: 403 });

  const { action } = parsed.data;

  if (action === "suspend") {
    await prisma.user.update({ where: { id }, data: { suspendedAt: new Date() } });
    void logAdminAction(admin.id, admin.email, "SUSPEND_USER", id, { targetEmail: target.email });
  } else if (action === "unsuspend") {
    await prisma.user.update({ where: { id }, data: { suspendedAt: null } });
    void logAdminAction(admin.id, admin.email, "UNSUSPEND_USER", id, { targetEmail: target.email });
  } else if (action === "blockDeposits") {
    await prisma.user.update({ where: { id }, data: { depositsBlocked: true } });
    void logAdminAction(admin.id, admin.email, "BLOCK_DEPOSITS", id, { targetEmail: target.email });
  } else if (action === "unblockDeposits") {
    await prisma.user.update({ where: { id }, data: { depositsBlocked: false } });
    void logAdminAction(admin.id, admin.email, "UNBLOCK_DEPOSITS", id, { targetEmail: target.email });
  } else if (action === "setDepositLimit") {
    const limit = parsed.data.limit;
    await prisma.user.update({ where: { id }, data: { depositLimit: limit } });
    void logAdminAction(admin.id, admin.email, "SET_DEPOSIT_LIMIT", id, { targetEmail: target.email, limit });
  } else if (action === "enableInvite") {
    await prisma.user.update({ where: { id }, data: { canGenerateInvites: true } });
  } else if (action === "disableInvite") {
    await prisma.user.update({ where: { id }, data: { canGenerateInvites: false } });
  }

  return NextResponse.json({ ok: true });
}
