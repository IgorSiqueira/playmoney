import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const take = 30;

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    prisma.adminLog.count(),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / take) });
}
