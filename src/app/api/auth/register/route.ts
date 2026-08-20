import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/bet-guards";

const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email().max(254),
  password: z.string().min(6).max(128),
  refCode: z.string().max(20).optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // [Security 7] Rate limit: 5 registros por hora por IP
  const rl = await rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  try {
    const bodyResult = await readJsonBody(req);
    if (!bodyResult.ok) return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });

    const parsed = registerSchema.safeParse(bodyResult.data);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { name, email, password, refCode } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    // [V6] Detectar múltiplas contas por IP: máximo 3 contas criadas pelo mesmo IP
    // Armazenamos o IP como metadata na transação de criação de carteira
    const accountsFromIp = await rateLimit(`accounts-created:${ip}`, 3, 30 * 24 * 60 * 60 * 1000); // 3 por mês
    if (!accountsFromIp.ok) {
      return NextResponse.json(
        { error: "Limite de contas criadas a partir deste endereço atingido. Entre em contato com o suporte." },
        { status: 429 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const invite = refCode
      ? await prisma.invite.findUnique({ where: { code: refCode.toUpperCase() } })
      : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        wallet: { create: { balance: 0 } },
      },
    });

    if (invite) {
      await prisma.inviteUse.create({ data: { inviteId: invite.id, userId: user.id } });
    }

    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
