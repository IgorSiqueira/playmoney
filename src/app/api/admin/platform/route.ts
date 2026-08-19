import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/admin-log";

const patchSchema = z.object({
  depositsBlocked:    z.boolean().optional(),
  globalDepositLimit: z.number().min(0).nullable().optional(),
  maintenanceMode:    z.boolean().optional(),
  maintenanceBanner:  z.string().max(300).nullable().optional(),
});

async function requireAdmin(sessionUserId: string) {
  const admin = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { role: true, email: true },
  });
  return admin?.role === "ADMIN" ? admin : null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const admin = await requireAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const settings = await prisma.platformSettings.findFirst() ?? {
    id: "singleton",
    depositsBlocked: false,
    globalDepositLimit: null,
    maintenanceMode: false,
    maintenanceBanner: null,
  };

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const admin = await requireAdmin(session.user.id);
  if (!admin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const data = parsed.data;

  const settings = await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      depositsBlocked:    data.depositsBlocked    ?? false,
      globalDepositLimit: data.globalDepositLimit ?? null,
      maintenanceMode:    data.maintenanceMode    ?? false,
      maintenanceBanner:  data.maintenanceBanner  ?? null,
    },
    update: {
      ...(data.depositsBlocked    !== undefined && { depositsBlocked:    data.depositsBlocked }),
      ...(data.globalDepositLimit !== undefined && { globalDepositLimit: data.globalDepositLimit }),
      ...(data.maintenanceMode    !== undefined && { maintenanceMode:    data.maintenanceMode }),
      ...(data.maintenanceBanner  !== undefined && { maintenanceBanner:  data.maintenanceBanner }),
    },
  });

  if (data.depositsBlocked !== undefined) {
    void logAdminAction(
      session.user.id, admin.email ?? "",
      data.depositsBlocked ? "PLATFORM_DEPOSITS_BLOCKED" : "PLATFORM_DEPOSITS_UNBLOCKED"
    );
  }
  if (data.maintenanceMode !== undefined) {
    void logAdminAction(
      session.user.id, admin.email ?? "",
      data.maintenanceMode ? "PLATFORM_MAINTENANCE_ON" : "PLATFORM_MAINTENANCE_OFF"
    );
  }
  if (data.globalDepositLimit !== undefined) {
    void logAdminAction(session.user.id, admin.email ?? "", "PLATFORM_DEPOSIT_LIMIT", undefined, { limit: data.globalDepositLimit });
  }

  return NextResponse.json(settings);
}
