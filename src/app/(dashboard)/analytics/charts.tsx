"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart2, Swords, Clock, Zap, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface PnlPoint {
  date: string;
  betPnl: number;
  cumPnl: number;
  status: "WON" | "LOST";
  odds: number;
}

export interface HeroStat {
  heroId: number;
  heroName: string;
  wins: number;
  total: number;
}

export interface HeatCell {
  day: number;
  hour: number;
  wins: number;
  total: number;
}

export interface AnalyticsData {
  pnlPoints: PnlPoint[];
  heroStats: HeroStat[];
  heatmap: HeatCell[];
  totalPnl: number;
  currentOdds: number | null;
  prevOdds: number | null;
  oddsDelta: number | null;
  winProbability: number | null;
  winProbTrend: "improving" | "declining" | "stable";
  settledCount: number;
  wonCount: number;
  allTimeWinRate: number | null;
  recentWinRate: number | null;
  hasGameProfile: boolean;
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function cellBg(wins: number, total: number): string {
  if (total === 0) return "rgba(0,128,255,0.04)";
  const wr = wins / total;
  const r = Math.round(255 * (1 - wr));
  const g = Math.round(58 + 70 * wr);
  const b = Math.round(110 + 145 * wr);
  const a = 0.2 + 0.55 * Math.min(1, total / 4);
  return `rgba(${r},${g},${b},${a})`;
}

function PnlChart({ points }: { points: PnlPoint[] }) {
  const [hov, setHov] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 border border-dashed border-[var(--border)]">
        <span className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest uppercase">
          Sem apostas liquidadas ainda
        </span>
      </div>
    );
  }

  const W = 580, H = 160;
  const PL = 54, PR = 16, PT = 12, PB = 28;
  const IW = W - PL - PR;
  const IH = H - PT - PB;

  const vals = points.map((p) => p.cumPnl);
  const minV = Math.min(0, ...vals);
  const maxV = Math.max(0, ...vals);
  const range = maxV - minV || 1;

  const sx = (i: number) =>
    points.length === 1 ? PL + IW / 2 : PL + (i / (points.length - 1)) * IW;
  const sy = (v: number) => PT + (1 - (v - minV) / range) * IH;
  const yZero = sy(0);

  const lineStr = points.map((p, i) => `${sx(i)},${sy(p.cumPnl)}`).join(" ");
  const areaD =
    `M${sx(0)},${yZero} ` +
    points.map((p, i) => `L${sx(i)},${sy(p.cumPnl)}`).join(" ") +
    ` L${sx(points.length - 1)},${yZero} Z`;

  const finalPnl = points[points.length - 1]!.cumPnl;
  const fillCol = finalPnl >= 0 ? "rgba(0,128,255,0.12)" : "rgba(255,58,110,0.12)";
  const lineCol = finalPnl >= 0 ? "var(--neon)" : "var(--danger)";

  const hovP = hov !== null ? points[hov] : null;
  const hovX = hov !== null ? sx(hov) : 0;
  const hovY = hovP ? sy(hovP.cumPnl) : 0;
  const tooltipX = Math.min(Math.max(hovX - 56, PL), W - PR - 120);
  const tooltipY = Math.max(hovY - 48, PT);

  const yLabels: number[] = [];
  if (maxV !== 0) yLabels.push(maxV);
  if (minV < 0 && maxV > 0) yLabels.push(0);
  if (minV !== 0 && minV !== maxV) yLabels.push(minV);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 160, overflow: "visible" }}
    >
      <defs>
        <filter id="pnl-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Zero line when chart spans both positive and negative */}
      {minV < 0 && maxV > 0 && (
        <line
          x1={PL} y1={yZero} x2={W - PR} y2={yZero}
          stroke="var(--border-mid)" strokeWidth={1} strokeDasharray="4 4"
        />
      )}

      {/* Area fill */}
      <path d={areaD} fill={fillCol} />

      {/* Main line */}
      {points.length > 1 && (
        <polyline
          points={lineStr}
          fill="none"
          stroke={lineCol}
          strokeWidth={2}
          filter="url(#pnl-glow)"
        />
      )}

      {/* Hover vertical guide */}
      {hovP && (
        <line
          x1={hovX} y1={PT} x2={hovX} y2={H - PB}
          stroke="var(--border-mid)" strokeWidth={1} strokeDasharray="3 3"
        />
      )}

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={sx(i)} cy={sy(p.cumPnl)} r={hov === i ? 5 : 3}
          fill={p.status === "WON" ? "var(--neon)" : "var(--danger)"}
          stroke="var(--bg)" strokeWidth={1.5}
          style={{ cursor: "pointer", transition: "r 0.1s" }}
          onMouseEnter={() => setHov(i)}
          onMouseLeave={() => setHov(null)}
        />
      ))}

      {/* Y-axis labels */}
      {yLabels.map((v, i) => (
        <text
          key={i}
          x={PL - 4} y={sy(v) + 4}
          textAnchor="end" fontSize={10}
          fill="var(--text-muted)"
          fontFamily="'JetBrains Mono', monospace"
        >
          {v >= 0 ? "+" : ""}{v.toFixed(0)}
        </text>
      ))}

      {/* X-axis labels */}
      <text
        x={PL} y={H - 6}
        fontSize={10} fill="var(--text-muted)"
        fontFamily="'JetBrains Mono', monospace"
      >
        {points[0]?.date}
      </text>
      {points.length > 1 && (
        <text
          x={W - PR} y={H - 6}
          fontSize={10} fill="var(--text-muted)"
          fontFamily="'JetBrains Mono', monospace" textAnchor="end"
        >
          {points[points.length - 1]?.date}
        </text>
      )}

      {/* Hover tooltip */}
      {hovP && (
        <g>
          <rect
            x={tooltipX} y={tooltipY}
            width={120} height={38} rx={2}
            fill="var(--surface-3)"
            stroke="rgba(0,128,255,0.3)" strokeWidth={0.5}
          />
          <text
            x={tooltipX + 60} y={tooltipY + 15}
            textAnchor="middle" fontSize={11} fontWeight="bold"
            fill={hovP.cumPnl >= 0 ? "var(--neon)" : "var(--danger)"}
            fontFamily="'JetBrains Mono', monospace"
          >
            {hovP.cumPnl >= 0 ? "+" : ""}{hovP.cumPnl.toFixed(2)}
          </text>
          <text
            x={tooltipX + 60} y={tooltipY + 29}
            textAnchor="middle" fontSize={9}
            fill="var(--text-muted)"
            fontFamily="'JetBrains Mono', monospace"
          >
            {hovP.date} · {hovP.odds.toFixed(2)}x
          </text>
        </g>
      )}
    </svg>
  );
}

function HeroChart({ heroes }: { heroes: HeroStat[] }) {
  if (heroes.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 border border-dashed border-[var(--border)]">
        <span className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest uppercase">
          Conecte o Dota 2
        </span>
      </div>
    );
  }

  const maxTotal = Math.max(...heroes.map((h) => h.total));

  return (
    <div className="space-y-3">
      {heroes.map((h) => {
        const wr = h.total > 0 ? h.wins / h.total : 0;
        const barW = (h.total / maxTotal) * 100;
        const wrColor = wr >= 0.5 ? "var(--neon)" : "var(--danger)";
        return (
          <div key={h.heroId}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[11px] text-[var(--text)] truncate max-w-[150px]">
                {h.heroName}
              </span>
              <span className="font-mono text-[11px] shrink-0 ml-2" style={{ color: wrColor }}>
                {(wr * 100).toFixed(0)}%{" "}
                <span className="text-[var(--text-muted)]">{h.wins}/{h.total}</span>
              </span>
            </div>
            <div
              className="h-[14px] bg-[var(--surface-1)] relative overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {/* Activity bar (total games relative to max) */}
              <div
                className="absolute inset-y-0 left-0 bg-[var(--surface-3)]"
                style={{ width: `${barW}%` }}
              />
              {/* Win rate bar */}
              <div
                className="absolute inset-y-0 left-0 opacity-70"
                style={{ width: `${wr * barW}%`, background: wrColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HeatMap({ cells, betCount }: { cells: HeatCell[]; betCount: number }) {
  const cellMap = new Map<string, HeatCell>();
  for (const c of cells) cellMap.set(`${c.day}-${c.hour}`, c);

  const best = [...cellMap.values()]
    .filter((c) => c.total >= 2)
    .sort((a, b) => b.wins / b.total - a.wins / a.total)[0];

  return (
    <div>
      {betCount < 5 && (
        <div className="mb-3 font-mono text-[11px] text-[var(--text-muted)] tracking-wide">
          ▸ Poucos dados — acumule mais apostas para padrões precisos
        </div>
      )}
      {best && (
        <div className="mb-3 px-3 py-2 border border-[rgba(0,128,255,0.25)] bg-[var(--neon-dim)]">
          <span className="font-mono text-[11px] text-[var(--neon)]">
            ▸ Melhor horário: {DAYS[best.day]} {String(best.hour).padStart(2, "0")}h UTC
            {" "}· {((best.wins / best.total) * 100).toFixed(0)}% vitórias ({best.wins}/{best.total})
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <div style={{ minWidth: 560 }}>
          {/* Hour header */}
          <div className="flex mb-1" style={{ paddingLeft: 36 }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="font-mono text-[10px] text-center"
                style={{
                  width: 20,
                  flexShrink: 0,
                  color: h % 6 === 0 ? "var(--text-muted)" : "transparent",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {DAYS.map((dayLabel, d) => (
            <div key={d} className="flex items-center gap-[2px] mb-[2px]">
              <span
                className="font-mono text-[10px] text-[var(--text-muted)] shrink-0 text-right pr-1"
                style={{ width: 32 }}
              >
                {dayLabel}
              </span>
              {Array.from({ length: 24 }, (_, h) => {
                const cell = cellMap.get(`${d}-${h}`);
                const bg = cellBg(cell?.wins ?? 0, cell?.total ?? 0);
                const tip = cell
                  ? `${dayLabel} ${h}h UTC: ${cell.wins}/${cell.total} vitórias`
                  : `${dayLabel} ${h}h UTC: sem dados`;
                return (
                  <div
                    key={h}
                    title={tip}
                    style={{
                      width: 20,
                      height: 16,
                      background: bg,
                      flexShrink: 0,
                      border: "1px solid rgba(0,128,255,0.06)",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest">
        ▸ Baseado em {betCount} apostas liquidadas · Horário UTC
      </div>
    </div>
  );
}

export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const {
    pnlPoints,
    heroStats,
    heatmap,
    totalPnl,
    currentOdds,
    oddsDelta,
    winProbability,
    winProbTrend,
    settledCount,
    wonCount,
    allTimeWinRate,
    recentWinRate,
    hasGameProfile,
  } = data;

  const TrendIcon =
    winProbTrend === "improving"
      ? TrendingUp
      : winProbTrend === "declining"
        ? TrendingDown
        : Minus;

  const trendColor =
    winProbTrend === "improving"
      ? "var(--neon)"
      : winProbTrend === "declining"
        ? "var(--danger)"
        : "var(--text-muted)";

  const pnlColor = totalPnl >= 0 ? "var(--neon)" : "var(--danger)";
  const pnlGlow =
    totalPnl >= 0
      ? "0 0 20px rgba(0,128,255,0.4)"
      : "0 0 20px rgba(255,58,110,0.4)";

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Win probability */}
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">
              Prob. Vitória
            </span>
            <TrendIcon size={12} style={{ color: trendColor }} />
          </div>
          <div
            className="font-mono text-3xl font-black leading-none"
            style={{ color: trendColor, textShadow: `0 0 20px ${trendColor}` }}
          >
            {winProbability !== null ? `${(winProbability * 100).toFixed(0)}%` : "—"}
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)] mt-2">
            {winProbTrend === "improving"
              ? "↑ Melhorando"
              : winProbTrend === "declining"
                ? "↓ Declinando"
                : "→ Estável"}
          </div>
        </div>

        {/* Current odds */}
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">
              Suas Odds
            </span>
            <Zap size={12} className="text-[var(--gold)]" />
          </div>
          <div
            className="font-mono text-3xl font-black leading-none text-[var(--gold)]"
            style={{ textShadow: "0 0 20px rgba(255,184,0,0.4)" }}
          >
            {currentOdds !== null ? `${currentOdds.toFixed(2)}x` : "—"}
          </div>
          {oddsDelta !== null ? (
            <div
              className="font-mono text-[11px] mt-2"
              style={{ color: oddsDelta >= 0 ? "var(--neon)" : "var(--danger)" }}
            >
              {oddsDelta >= 0 ? "+" : ""}
              {oddsDelta.toFixed(2)} vs ant.
            </div>
          ) : (
            <div className="font-mono text-[11px] text-[var(--text-muted)] mt-2">
              {hasGameProfile ? "Perfil ativo" : "Sem perfil"}
            </div>
          )}
        </div>

        {/* Total P&L */}
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">
              P&L Total
            </span>
            {totalPnl >= 0 ? (
              <TrendingUp size={12} className="text-[var(--neon)]" />
            ) : (
              <TrendingDown size={12} className="text-[var(--danger)]" />
            )}
          </div>
          <div
            className="font-mono text-2xl font-black leading-none"
            style={{ color: pnlColor, textShadow: pnlGlow }}
          >
            {totalPnl >= 0 ? "+" : ""}
            {formatCurrency(Math.abs(totalPnl))}
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)] mt-2">
            {settledCount} liquidadas
          </div>
        </div>

        {/* Win rate */}
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">
              Win Rate
            </span>
            <Target size={12} className="text-[var(--text-muted)]" />
          </div>
          <div
            className="font-mono text-3xl font-black leading-none"
            style={{
              color: (allTimeWinRate ?? 0) >= 0.5 ? "var(--neon)" : "var(--danger)",
            }}
          >
            {allTimeWinRate !== null
              ? `${(allTimeWinRate * 100).toFixed(0)}%`
              : "—"}
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)] mt-2">
            {wonCount}/{settledCount} ·{" "}
            {recentWinRate !== null
              ? `Dota: ${(recentWinRate * 100).toFixed(0)}%`
              : "Sem perfil"}
          </div>
        </div>
      </div>

      {/* P&L chart */}
      <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-px h-4 bg-[var(--neon)]" />
          <BarChart2 size={13} className="text-[var(--text-muted)]" />
          <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">
            P&L ao Longo do Tempo
          </span>
          <span className="ml-auto font-mono text-[11px] text-[var(--text-muted)]">
            {pnlPoints.length} eventos
          </span>
        </div>
        <PnlChart points={pnlPoints} />
      </div>

      {/* Hero chart + Heat map */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-px h-4 bg-[var(--gold)]" />
            <Swords size={13} className="text-[var(--text-muted)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">
              Win Rate por Herói
            </span>
          </div>
          <HeroChart heroes={heroStats} />
          {!hasGameProfile && heroStats.length === 0 && (
            <p className="font-mono text-[11px] text-[var(--text-muted)] mt-3 tracking-wide">
              ▸ Conecte sua conta Dota 2 para análise por herói
            </p>
          )}
        </div>

        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-px h-4 bg-[var(--neon)]" />
            <Clock size={13} className="text-[var(--text-muted)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">
              Mapa de Calor
            </span>
          </div>
          <HeatMap cells={heatmap} betCount={settledCount} />
        </div>
      </div>

      {/* Prediction insight card */}
      {winProbability !== null && (
        <div className="bracket border border-[rgba(0,128,255,0.4)] bg-[var(--neon-dim)] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 border border-[var(--neon)] flex items-center justify-center shrink-0 bg-[rgba(0,128,255,0.08)]">
              <span className="font-display text-xs font-black text-[var(--neon)]">AI</span>
            </div>
            <div>
              <div className="font-display text-xs font-bold uppercase tracking-widest text-[var(--neon)] mb-2">
                Previsão de Resultado
              </div>
              <p className="font-ui text-sm text-[var(--text)] leading-relaxed">
                Baseado nas suas últimas partidas, sua probabilidade de vitória hoje é{" "}
                <span
                  className="font-mono font-bold"
                  style={{ color: trendColor }}
                >
                  {(winProbability * 100).toFixed(0)}%
                </span>
                {winProbTrend === "improving" &&
                  " — você está em tendência de melhora. Bom momento para apostar."}
                {winProbTrend === "declining" &&
                  " — tendência de queda detectada. Considere apostas menores."}
                {winProbTrend === "stable" && " — forma estável e consistente."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
