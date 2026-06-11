import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EXCLUSION_PRESETS: Record<string, number> = {
  "7d": 7, "30d": 30, "90d": 90, "365d": 365, "indefinite": 365 * 10,
};

const settingsSchema = z.object({
  dailyLossLimit:   z.number().min(10).max(50_000).nullable().optional(),
  weeklyLossLimit:  z.number().min(10).max(200_000).nullable().optional(),
  selfExcludePeriod: z.enum(["7d", "30d", "90d", "365d", "indefinite"]).optional(),
  agreedToTerms:    z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [user, wallet] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { selfExcludedUntil: true, agreedToTermsAt: true },
    }),
    prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { dailyLossLimit: true, weeklyLossLimit: true },
    }),
  ]);

  return NextResponse.json({
    selfExcludedUntil: user?.selfExcludedUntil,
    agreedToTermsAt:   user?.agreedToTermsAt,
    dailyLossLimit:    wallet?.dailyLossLimit ? Number(wallet.dailyLossLimit) : null,
    weeklyLossLimit:   wallet?.weeklyLossLimit ? Number(wallet.weeklyLossLimit) : null,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { dailyLossLimit, weeklyLossLimit, selfExcludePeriod, agreedToTerms } = parsed.data;

  const userUpdates: Record<string, unknown> = {};
  const walletUpdates: Record<string, unknown> = {};

  if (agreedToTerms) userUpdates.agreedToTermsAt = new Date();

  if (selfExcludePeriod) {
    const days = EXCLUSION_PRESETS[selfExcludePeriod];
    const until = new Date();
    until.setDate(until.getDate() + days);
    userUpdates.selfExcludedUntil = until;
  }

  if (dailyLossLimit !== undefined)  walletUpdates.dailyLossLimit  = dailyLossLimit;
  if (weeklyLossLimit !== undefined) walletUpdates.weeklyLossLimit = weeklyLossLimit;

  await Promise.all([
    Object.keys(userUpdates).length > 0
      ? prisma.user.update({ where: { id: userId }, data: userUpdates })
      : Promise.resolve(),
    Object.keys(walletUpdates).length > 0
      ? prisma.wallet.update({ where: { userId }, data: walletUpdates })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true });
}
