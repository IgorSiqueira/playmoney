"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getRankName } from "@/lib/utils";
import { EVENT_TYPES, calcEventOdds, type EventType } from "@/lib/bet-events";
import {
  Gamepad2, RefreshCw, Shield, Sword, Trophy,
  Target, BarChart3, ChevronRight, AlertTriangle,
  TrendingUp, TrendingDown, Crosshair, Zap,
} from "lucide-react";
import { AlertBox } from "@/components/ui/alert-box";
import { Breadcrumb } from "@/components/shared/breadcrumb";

interface OddsFactors {
  baseWinRate: number;
  formAdjustment: number;
  streakAdjustment: number;
  kdaAdjustment: number;
  rankAdjustment: number;
  gpmAdjustment: number;
  finalProbability: number;
  last5WR: number;
  older15WR: number;
  currentStreak: { count: number; type: "WIN" | "LOSS" | "NONE" };
  form: "hot" | "warming" | "neutral" | "cooling" | "cold";
}

interface GameProfile {
  id: string; externalId: string; displayName: string | null; avatarUrl: string | null;
  stats: {
    winRate: number; totalMatches: number; recentWinRate: number; averageKDA: number;
    averageKills: number; averageDeaths: number; averageAssists: number; averageGPM: number;
    rankTier?: number;
    odds: {
      winOdds: number; loseOdds: number; winProbability: number; riskLevel: string;
      factors?: OddsFactors;
    };
  } | null;
  lastSyncAt: string | null;
}

type Prediction = "WIN" | "OVER" | "UNDER";

const FORM_CONFIG = {
  hot:     { label: "Em Chamas",  icon: "🔥", color: "var(--neon)" },
  warming: { label: "Aquecendo",  icon: "↗",  color: "var(--gold)" },
  neutral: { label: "Neutro",     icon: "→",  color: "var(--text-muted)" },
  cooling: { label: "Esfriando",  icon: "↘",  color: "var(--gold)" },
  cold:    { label: "Fria",       icon: "❄",  color: "var(--danger)" },
} as const;

function pct(v: number, sign = true): string {
  const s = sign && v > 0 ? "+" : "";
  return `${s}${(v * 100).toFixed(0)}%`;
}

function WinLossOddsPanel({
  odds,
}: {
  odds: NonNullable<GameProfile["stats"]>["odds"];
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const f = odds.factors;
  const form = f ? FORM_CONFIG[f.form] : null;

  return (
    <div className="border border-[var(--neon)] bg-[var(--neon-dim)] overflow-hidden">
      {/* Main odds row */}
      <div className="relative p-4 flex items-center gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Trophy size={12} style={{ color: "var(--neon)" }} />
            <span className="font-display text-[11px] tracking-[0.25em] uppercase text-[var(--neon)]">
              Vitória na próxima partida
            </span>
            {form && (
              <span
                className="ml-auto font-mono text-[11px] font-bold flex items-center gap-1"
                style={{ color: form.color }}
              >
                {form.icon} {form.label}
              </span>
            )}
          </div>
          <div
            className="font-mono text-4xl font-black text-[var(--neon)]"
            style={{ textShadow: "0 0 20px rgba(0,128,255,0.6)" }}
          >
            {odds.winOdds}x
          </div>
          <div className="flex items-center gap-4 mt-0.5 flex-wrap">
            <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">
              Prob. · {(odds.winProbability * 100).toFixed(0)}%
            </span>
            {f && f.currentStreak.type !== "NONE" && (
              <span
                className="font-mono text-[11px]"
                style={{ color: f.currentStreak.type === "WIN" ? "var(--neon)" : "var(--danger)" }}
              >
                {f.currentStreak.count}{" "}
                {f.currentStreak.type === "WIN" ? "vitória" : "derrota"}
                {f.currentStreak.count > 1 ? "s" : ""} seguida
                {f.currentStreak.count > 1 ? "s" : ""}
              </span>
            )}
            {f && (
              <button
                onClick={() => setShowBreakdown((v) => !v)}
                className="font-mono text-[11px] text-[var(--neon)] hover:underline ml-auto"
              >
                {showBreakdown ? "▲ ocultar" : "▼ ver fatores"}
              </button>
            )}
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, var(--neon), transparent)" }}
        />
      </div>

      {/* Breakdown table */}
      {f && showBreakdown && (
        <div className="border-t border-[rgba(0,128,255,0.2)] bg-[rgba(0,128,255,0.04)]">
          <div className="px-4 py-1 font-display text-[10px] tracking-[0.2em] text-[var(--neon)] uppercase opacity-60">
            Composição das odds
          </div>
          <table className="w-full">
            <tbody>
              {[
                {
                  label: "Win rate base (últimas 20)",
                  value: pct(f.baseWinRate, false),
                  note: `Ú5: ${pct(f.last5WR, false)} · A15: ${pct(f.older15WR, false)}`,
                  color: "var(--text)",
                },
                {
                  label: "Forma recente (Ú5 vs A15)",
                  value: pct(f.formAdjustment),
                  note:
                    f.formAdjustment > 0.01
                      ? "Melhorando"
                      : f.formAdjustment < -0.01
                        ? "Piorando"
                        : "Estável",
                  color:
                    f.formAdjustment >= 0 ? "var(--neon)" : "var(--danger)",
                },
                {
                  label: `Sequência (${f.currentStreak.count} partidas)`,
                  value: pct(f.streakAdjustment),
                  note:
                    f.currentStreak.type === "WIN"
                      ? "Bônus por sequência positiva"
                      : f.currentStreak.type === "LOSS"
                        ? "Penalidade por sequência negativa"
                        : "Sem sequência ativa",
                  color:
                    f.streakAdjustment >= 0 ? "var(--neon)" : "var(--danger)",
                },
                {
                  label: "KDA",
                  value: pct(f.kdaAdjustment),
                  note: "Kills+Assists vs Deaths",
                  color:
                    f.kdaAdjustment >= 0 ? "var(--neon)" : "var(--danger)",
                },
                {
                  label: "Rank / medalha",
                  value: pct(f.rankAdjustment),
                  note: "Ajuste por nível de habilidade",
                  color:
                    f.rankAdjustment >= 0 ? "var(--neon)" : "var(--danger)",
                },
                {
                  label: "Tendência GPM",
                  value: pct(f.gpmAdjustment),
                  note: "Gold/min nas últimas 5 vs anteriores",
                  color:
                    f.gpmAdjustment >= 0 ? "var(--neon)" : "var(--danger)",
                },
              ].map(({ label, value, note, color }) => (
                <tr
                  key={label}
                  className="border-t border-[rgba(0,128,255,0.08)] hover:bg-[rgba(0,128,255,0.04)]"
                >
                  <td className="px-4 py-2">
                    <div className="font-display text-[11px] tracking-wide text-[var(--text)] uppercase">
                      {label}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">{note}</div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="font-mono text-sm font-bold" style={{ color }}>
                      {value}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-[rgba(0,128,255,0.3)]">
                <td className="px-4 py-2">
                  <span className="font-display text-[11px] tracking-widest text-[var(--neon)] uppercase font-bold">
                    Probabilidade final
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <span
                    className="font-mono text-base font-black text-[var(--neon)]"
                    style={{ textShadow: "0 0 8px rgba(0,128,255,0.5)" }}
                  >
                    {pct(f.finalProbability, false)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Dota2Page() {
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [steamId, setSteamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [balance, setBalance] = useState<number | null>(null);

  const [eventType, setEventType] = useState<EventType>("WIN_LOSS");
  const [targetValue, setTargetValue] = useState("");
  const [betPrediction, setBetPrediction] = useState<Prediction>("WIN");
  const [betAmount, setBetAmount] = useState("");
  const [betLoading, setBetLoading] = useState(false);
  const [betSuccess, setBetSuccess] = useState("");
  const [betError, setBetError] = useState("");

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.balance !== undefined) setBalance(Number(d.balance)); });
  }, []);

  useEffect(() => {
    fetch("/api/games/dota2")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.id) return;
        setProfile(d);

        // Auto-sync silencioso se lastSyncAt > 24h
        const STALE_HOURS = 24;
        const lastSync = d.lastSyncAt ? new Date(d.lastSyncAt).getTime() : 0;
        const staleMs  = STALE_HOURS * 60 * 60 * 1000;
        if (Date.now() - lastSync > staleMs) {
          fetch("/api/games/dota2", { method: "PATCH" })
            .then((r) => r.ok ? r.json() : null)
            .then((fresh) => { if (fresh?.id) setProfile(fresh); })
            .catch(() => { /* silencioso — falha não bloqueia a UI */ });
        }
      })
      .finally(() => setFetching(false));
  }, []);

  // Reset prediction when event type changes
  useEffect(() => {
    if (eventType === "WIN_LOSS") {
      setBetPrediction("WIN");
    } else {
      setBetPrediction("OVER");
      // Suggest average as default target
      if (profile?.stats) {
        const avgs: Record<string, number> = {
          KILLS: profile.stats.averageKills,
          ASSISTS: profile.stats.averageAssists,
          GPM: profile.stats.averageGPM,
        };
        setTargetValue(String(Math.round(avgs[eventType] ?? 0)));
      }
    }
  }, [eventType, profile?.stats]);

  // Compute live odds
  const liveOdds = useMemo(() => {
    if (!profile?.stats) return null;
    if (eventType === "WIN_LOSS") return null; // use stored odds
    const tv = parseFloat(targetValue);
    if (!tv || tv <= 0) return null;
    return calcEventOdds(eventType, profile.stats as never, tv);
  }, [eventType, targetValue, profile?.stats]);

  const selectedOdds = useMemo(() => {
    if (eventType === "WIN_LOSS") return profile?.stats?.odds.winOdds;
    return betPrediction === "OVER" ? liveOdds?.overOdds : liveOdds?.underOdds;
  }, [eventType, betPrediction, profile, liveOdds]);

  const potentialPayout = betAmount && selectedOdds
    ? parseFloat(betAmount) * selectedOdds : 0;

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/games/dota2", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steamId }),
    });
    const data = await res.json();
    if (res.ok) setProfile(data);
    else setError(data.error || "Perfil não encontrado");
    setLoading(false);
  }

  async function handleBet(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBetLoading(true); setBetError(""); setBetSuccess("");
    const body: Record<string, unknown> = {
      gameProfileId: profile.id,
      prediction: betPrediction,
      amount: parseFloat(betAmount),
      eventType,
    };
    if (eventType !== "WIN_LOSS") body.targetValue = parseFloat(targetValue);

    const res = await fetch("/api/bets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setBetSuccess(`Aposta criada! Retorno potencial: ${formatCurrency(data.bet.potentialPayout)}`);
      setBetAmount(""); setTargetValue("");
      setBalance((prev) => prev !== null ? prev - parseFloat(betAmount) : prev);
    } else {
      setBetError(data.error || "Erro ao criar aposta");
    }
    setBetLoading(false);
  }

  if (fetching) return (
    <div className="flex items-center gap-3 py-20 justify-center">
      <div className="w-4 h-4 border-2 border-[var(--neon)] border-t-transparent rounded-full animate-spin" />
      <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">Carregando...</span>
    </div>
  );

  if (!profile) return (
    <div className="space-y-8 pb-8">
      <Breadcrumb
        pageTitle="Dota 2"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Jogos" }, { label: "Dota 2" }]}
      />
      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--neon)] uppercase mb-1">▸ Jogos</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Dota 2</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">Conecte sua conta Steam para calcularmos suas odds</p>
      </div>
      <div className="max-w-md">
        <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)]">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--neon)] to-transparent" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Gamepad2 size={14} className="text-[var(--neon)]" />
              <span className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-bright)]">Conectar Steam</span>
            </div>
            <p className="font-display text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase mb-5">Perfil público necessário · API gratuita</p>
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label>Steam ID (32-bit ou 64-bit)</Label>
                <Input placeholder="Ex: 86745912 ou 76561198..." value={steamId} onChange={(e) => setSteamId(e.target.value)} required />
                <p className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest">Encontre em: steamidfinder.com</p>
              </div>
              {error && <AlertBox variant="error">{error}</AlertBox>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Buscando perfil..." : "Conectar"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const odds = profile.stats?.odds;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--neon)] uppercase mb-1">▸ Dota 2</div>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Perfil & Apostas</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setProfile(null)} className="flex items-center gap-1">
          <RefreshCw size={10} /> Trocar conta
        </Button>
      </div>

      {/* Player card */}
      <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--neon)] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-48 opacity-5 pointer-events-none"
          style={{ background: "repeating-linear-gradient(-45deg, var(--neon) 0, var(--neon) 1px, transparent 0, transparent 50%)", backgroundSize: "8px 8px" }} />
        <div className="relative p-5 flex items-center gap-5">
          {profile.avatarUrl && (
            <div className="relative shrink-0">
              <div className="absolute inset-0 border-2 border-[var(--neon)] opacity-40 scale-110" />
              <Image src={profile.avatarUrl} alt={profile.displayName ?? "Avatar"} width={72} height={72}
                className="relative z-10 border border-[var(--neon-dim)]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h2 className="font-display text-xl font-black uppercase tracking-wide text-[var(--text-bright)]">{profile.displayName}</h2>
              {profile.stats?.rankTier && <Badge variant="warning">{getRankName(profile.stats.rankTier)}</Badge>}
            </div>
            <div className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest mb-4">STEAM ID · {profile.externalId}</div>
            {profile.stats && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { icon: Shield,      label: "Win Rate",  value: `${((profile.stats.recentWinRate ?? 0) * 100).toFixed(1)}%`,    color: "var(--neon)" },
                  { icon: BarChart3,   label: "Partidas",  value: String(profile.stats.totalMatches ?? 0),                         color: "var(--blue)" },
                  { icon: Sword,       label: "KDA",       value: (profile.stats.averageKDA   ?? 0).toFixed(2),                    color: "var(--gold)" },
                  { icon: Crosshair,   label: "K Médio",   value: (profile.stats.averageKills  ?? 0).toFixed(1),                   color: "var(--text)" },
                  { icon: TrendingDown,label: "D Médio",   value: (profile.stats.averageDeaths ?? 0).toFixed(1),                   color: "var(--danger)" },
                  { icon: TrendingUp,  label: "GPM Médio", value: String(Math.round(profile.stats.averageGPM ?? 0)),               color: "var(--gold)" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="border border-[var(--border)] bg-[var(--surface-1)] p-2.5">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Icon size={10} style={{ color }} />
                      <span className="font-display text-[11px] tracking-wide text-[var(--text-muted)] uppercase">{label}</span>
                    </div>
                    <div className="font-mono text-sm font-bold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bet terminal — event selector, odds and form unified */}
      <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)]">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
        <div className="p-5 space-y-5">
          {/* Terminal header */}
          <div className="flex items-center gap-2">
            <Target size={13} className="text-[var(--gold)]" />
            <span className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-bright)]">Terminal de Apostas</span>
            {balance !== null && (
              <span className="ml-auto font-mono text-xs font-bold" style={{ color: balance > 0 ? "var(--neon)" : "var(--danger)" }}>
                Saldo: {formatCurrency(balance)}
              </span>
            )}
          </div>

          {/* Event type selector */}
          <div>
            <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-2">Tipo de Aposta</div>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.entries(EVENT_TYPES) as [EventType, typeof EVENT_TYPES[EventType]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setEventType(key)}
                  className={`py-2.5 px-1 border font-display text-[11px] tracking-widest uppercase text-center transition-all leading-tight ${
                    eventType === key
                      ? "border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]"
                      : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-muted)] hover:border-[var(--border-mid)]"
                  }`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Odds display */}
          {eventType === "WIN_LOSS" && odds ? (
            <WinLossOddsPanel odds={odds} />
          ) : eventType !== "WIN_LOSS" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Valor alvo ({EVENT_TYPES[eventType].unit})</Label>
                <Input type="number" placeholder={`Ex: ${liveOdds ? Math.round(liveOdds.averageStat) : 0}`}
                  value={targetValue} onChange={(e) => setTargetValue(e.target.value)} min={0} step={eventType === "GPM" ? 50 : 1} />
                {liveOdds && (
                  <p className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest">
                    Sua média: {liveOdds.averageStat} {EVENT_TYPES[eventType].unit}
                  </p>
                )}
              </div>

              {liveOdds && targetValue && (
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { pred: "OVER" as Prediction, oddsVal: liveOdds.overOdds, prob: liveOdds.overProbability, color: "var(--neon)", border: "border-[var(--neon)]", bg: "bg-[var(--neon-dim)]" },
                    { pred: "UNDER" as Prediction, oddsVal: liveOdds.underOdds, prob: liveOdds.underProbability, color: "var(--danger)", border: "border-[var(--danger)]", bg: "bg-[var(--danger-dim)]" },
                  ]).map(({ pred, oddsVal, prob, color, border, bg }) => {
                    const active = betPrediction === pred;
                    return (
                      <button key={pred} onClick={() => setBetPrediction(pred)}
                        className={`p-4 border text-left transition-all ${active ? `${border} ${bg}` : "border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-mid)]"}`}>
                        <div className="font-display text-[11px] tracking-widest uppercase mb-2" style={{ color: active ? color : "var(--text-muted)" }}>
                          {pred === "OVER" ? `Acima de ${targetValue}` : `Abaixo de ${targetValue}`}
                        </div>
                        <div className="font-mono text-3xl font-black" style={{ color: active ? color : "var(--text)" }}>{oddsVal}x</div>
                        <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mt-1">Prob. · {(prob * 100).toFixed(0)}%</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {/* Separator */}
          <div className="border-t border-[var(--border)]" />

          {balance !== null && balance < 5 && (
            <AlertBox variant="error" className="mb-4">
              Saldo insuficiente. <a href="/wallet" className="underline">Deposite aqui</a> para apostar.
            </AlertBox>
          )}

          <form onSubmit={handleBet} className="space-y-4">
            <div className="space-y-2">
              <Label>Valor da aposta (R$)</Label>
              <Input type="number" placeholder="0.00" min={5} max={5000} step={0.01}
                value={betAmount} onChange={(e) => setBetAmount(e.target.value)} required
                disabled={balance !== null && balance < 5} />
              {balance !== null && betAmount && parseFloat(betAmount) > balance && (
                <p className="font-display text-[11px] tracking-widest text-[var(--danger)] uppercase">
                  Valor maior que seu saldo disponível ({formatCurrency(balance)})
                </p>
              )}
            </div>

            {betAmount && selectedOdds && (
              <div className="border border-[var(--border)] bg-[var(--surface-1)] divide-y divide-[var(--border)]">
                {[
                  { label: "Aposta",           value: formatCurrency(parseFloat(betAmount)), color: "var(--text)" },
                  { label: "Multiplicador",     value: `${selectedOdds}x`,                   color: "var(--text)" },
                  { label: "Retorno potencial", value: formatCurrency(potentialPayout),       color: "var(--neon)" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">{label}</span>
                    <span className="font-mono text-sm font-bold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {betError && <AlertBox variant="error">{betError}</AlertBox>}
            {betSuccess && <AlertBox variant="success">{betSuccess}</AlertBox>}

            <Button type="submit"
              disabled={
                betLoading ||
                !betAmount ||
                (eventType !== "WIN_LOSS" && !targetValue) ||
                !selectedOdds ||
                (balance !== null && (balance < 5 || parseFloat(betAmount) > balance))
              }
              className="w-full" variant="gold">
              {betLoading ? "Criando aposta..." : "Criar Aposta"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
