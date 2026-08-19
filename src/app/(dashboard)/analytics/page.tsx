import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchHeroNames } from "@/lib/opendota";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { AnalyticsCharts } from "./charts";
import type { AnalyticsData, HeatCell, HeroStat, PnlPoint } from "./charts";

type StatsJson = {
  recentWinRate?: number;
  odds?: { winOdds: number; winProbability: number };
  recentMatches?: Array<{
    hero_id: number;
    player_slot: number;
    radiant_win: boolean;
    start_time?: number;
  }>;
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [settledBets, gameProfile, heroNames] = await Promise.all([
    prisma.bet.findMany({
      where: { userId, status: { in: ["WON", "LOST"] } },
      select: {
        amount: true,
        potentialPayout: true,
        status: true,
        settledAt: true,
        eventType: true,
        matchData: true,
      },
      orderBy: { settledAt: "asc" },
    }),
    prisma.gameProfile.findUnique({
      where: { userId_game: { userId, game: "DOTA2" } },
    }),
    fetchHeroNames(),
  ]);

  // ── P&L over time ──────────────────────────────────────────────────────────
  let cumPnl = 0;
  const pnlPoints: PnlPoint[] = settledBets.map((bet) => {
    const betPnl =
      bet.status === "WON"
        ? Number(bet.potentialPayout) - Number(bet.amount)
        : -Number(bet.amount);
    cumPnl += betPnl;
    return {
      date: bet.settledAt!.toISOString().slice(0, 10),
      betPnl,
      cumPnl,
      status: bet.status as "WON" | "LOST",
      odds: parseFloat(
        (Number(bet.potentialPayout) / Number(bet.amount)).toFixed(2)
      ),
    };
  });

  // ── Heat map from settled bets ─────────────────────────────────────────────
  type MatchDataShape = {
    matchResult?: { matchStartTime?: number };
  };
  const heatMap = new Map<string, { wins: number; total: number }>();
  for (const bet of settledBets) {
    const md = bet.matchData as MatchDataShape | null;
    const ts = md?.matchResult?.matchStartTime;
    if (!ts) continue;
    const d = new Date(ts * 1000);
    const key = `${d.getUTCDay()}-${d.getUTCHours()}`;
    const entry = heatMap.get(key) ?? { wins: 0, total: 0 };
    entry.total++;
    if (bet.status === "WON") entry.wins++;
    heatMap.set(key, entry);
  }
  const heatmap: HeatCell[] = Array.from(heatMap.entries()).map(([k, v]) => {
    const [day, hour] = k.split("-").map(Number);
    return { day, hour, ...v };
  });

  // ── Hero stats from game profile ───────────────────────────────────────────
  const stats = gameProfile?.stats as StatsJson | null;
  const recentMatches = stats?.recentMatches ?? [];

  const heroMap = new Map<number, { wins: number; total: number }>();
  for (const m of recentMatches) {
    const won = (m.player_slot < 128) === m.radiant_win;
    const entry = heroMap.get(m.hero_id) ?? { wins: 0, total: 0 };
    entry.total++;
    if (won) entry.wins++;
    heroMap.set(m.hero_id, entry);
  }
  const heroStats: HeroStat[] = Array.from(heroMap.entries())
    .map(([heroId, v]) => ({
      heroId,
      heroName: heroNames[heroId] ?? `Hero #${heroId}`,
      ...v,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── Odds comparison ────────────────────────────────────────────────────────
  const currentOdds = stats?.odds?.winOdds ?? null;
  const winProbability = stats?.odds?.winProbability ?? null;
  const recentWinRate = stats?.recentWinRate ?? null;

  // Compare current odds vs implied odds from WIN_LOSS bets settled 7-21 days ago
  const now = Date.now();
  const prevBets = settledBets.filter((b) => {
    if (!b.settledAt) return false;
    if (b.eventType && b.eventType !== "WIN_LOSS") return false;
    const age = now - b.settledAt.getTime();
    return age >= 7 * 864e5 && age <= 21 * 864e5;
  });
  const prevOdds =
    prevBets.length >= 2
      ? parseFloat(
          (
            prevBets.reduce(
              (s, b) => s + Number(b.potentialPayout) / Number(b.amount),
              0
            ) / prevBets.length
          ).toFixed(2)
        )
      : null;
  const oddsDelta =
    currentOdds !== null && prevOdds !== null
      ? parseFloat((currentOdds - prevOdds).toFixed(2))
      : null;

  // ── Win probability trend ──────────────────────────────────────────────────
  const isWin = (m: (typeof recentMatches)[number]) =>
    (m.player_slot < 128) === m.radiant_win;
  const last5 = recentMatches.slice(0, 5);
  const prev5 = recentMatches.slice(5, 10);
  const last5wr =
    last5.length > 0 ? last5.filter(isWin).length / last5.length : null;
  const prev5wr =
    prev5.length > 0 ? prev5.filter(isWin).length / prev5.length : null;

  const winProbTrend: "improving" | "declining" | "stable" =
    last5wr !== null && prev5wr !== null
      ? last5wr > prev5wr + 0.1
        ? "improving"
        : last5wr < prev5wr - 0.1
          ? "declining"
          : "stable"
      : "stable";

  // ── Summary ────────────────────────────────────────────────────────────────
  const wonCount = settledBets.filter((b) => b.status === "WON").length;
  const allTimeWinRate =
    settledBets.length > 0 ? wonCount / settledBets.length : null;

  const analyticsData: AnalyticsData = {
    pnlPoints,
    heroStats,
    heatmap,
    totalPnl: cumPnl,
    currentOdds,
    prevOdds,
    oddsDelta,
    winProbability,
    winProbTrend,
    settledCount: settledBets.length,
    wonCount,
    allTimeWinRate,
    recentWinRate,
    hasGameProfile: !!gameProfile,
  };

  return (
    <div className="space-y-8 pb-8">
      <Breadcrumb
        pageTitle="Analytics"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
      />

      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--neon)] uppercase mb-1">
          ▸ Inteligência
        </div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">
          Analytics
        </h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">
          Performance e padrões baseados no seu histórico de apostas e partidas
        </p>
      </div>

      <AnalyticsCharts data={analyticsData} />
    </div>
  );
}
