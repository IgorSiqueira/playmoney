"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getRankName } from "@/lib/utils";
import { calculateComboOdds } from "@/lib/bet-events";
import {
  Gamepad2, RefreshCw, Shield, Sword, Trophy,
  Target, BarChart3, X,
  TrendingUp, TrendingDown, Crosshair, Plus, Zap,
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
  xpmAdjustment?: number;
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
    averageKills: number; averageDeaths: number; averageAssists: number; averageGPM: number; averageXPM: number;
    rankTier?: number;
    odds: {
      winOdds: number; loseOdds: number; winProbability: number; riskLevel: string;
      factors?: OddsFactors;
    };
  } | null;
  lastSyncAt: string | null;
}

type ConditionType = "KILLS" | "ASSISTS" | "GPM" | "XPM";
interface Condition { type: ConditionType; threshold: number }

const CONDITION_META: Record<ConditionType, {
  label: string;
  unit: string;
  avg: (stats: NonNullable<GameProfile["stats"]>) => number;
}> = {
  KILLS:   { label: "Abates",       unit: "kills",  avg: s => s.averageKills },
  ASSISTS: { label: "Assistências", unit: "assists", avg: s => s.averageAssists },
  GPM:     { label: "GPM",          unit: "GPM",    avg: s => s.averageGPM },
  XPM:     { label: "XPM",          unit: "XPM",    avg: s => s.averageXPM },
};

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
                  note: f.formAdjustment > 0.01 ? "Melhorando" : f.formAdjustment < -0.01 ? "Piorando" : "Estável",
                  color: f.formAdjustment >= 0 ? "var(--neon)" : "var(--danger)",
                },
                {
                  label: `Sequência (${f.currentStreak.count} partidas)`,
                  value: pct(f.streakAdjustment),
                  note: f.currentStreak.type === "WIN" ? "Bônus por sequência positiva"
                    : f.currentStreak.type === "LOSS" ? "Penalidade por sequência negativa"
                    : "Sem sequência ativa",
                  color: f.streakAdjustment >= 0 ? "var(--neon)" : "var(--danger)",
                },
                {
                  label: "KDA",
                  value: pct(f.kdaAdjustment),
                  note: "Kills+Assists vs Deaths",
                  color: f.kdaAdjustment >= 0 ? "var(--neon)" : "var(--danger)",
                },
                {
                  label: "Rank / medalha",
                  value: pct(f.rankAdjustment),
                  note: "Ajuste por nível de habilidade",
                  color: f.rankAdjustment >= 0 ? "var(--neon)" : "var(--danger)",
                },
                {
                  label: "Tendência GPM",
                  value: pct(f.gpmAdjustment),
                  note: "Gold/min nas últimas 5 vs anteriores",
                  color: f.gpmAdjustment >= 0 ? "var(--neon)" : "var(--danger)",
                },
                {
                  label: "Tendência XPM",
                  value: pct(f.xpmAdjustment ?? 0),
                  note: "Exp/min nas últimas 5 vs anteriores",
                  color: (f.xpmAdjustment ?? 0) >= 0 ? "var(--neon)" : "var(--danger)",
                },
              ].map(({ label, value, note, color }) => (
                <tr key={label} className="border-t border-[rgba(0,128,255,0.08)] hover:bg-[rgba(0,128,255,0.04)]">
                  <td className="px-4 py-2">
                    <div className="font-display text-[11px] tracking-wide text-[var(--text)] uppercase">{label}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">{note}</div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="font-mono text-sm font-bold" style={{ color }}>{value}</span>
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
                  <span className="font-mono text-base font-black text-[var(--neon)]"
                    style={{ textShadow: "0 0 8px rgba(0,128,255,0.5)" }}>
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

  const [conditions, setConditions] = useState<Condition[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingType, setAddingType] = useState<ConditionType>("KILLS");
  const [addingThreshold, setAddingThreshold] = useState("");

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

        const STALE_HOURS = 24;
        const lastSync = d.lastSyncAt ? new Date(d.lastSyncAt).getTime() : 0;
        const staleMs  = STALE_HOURS * 60 * 60 * 1000;
        if (Date.now() - lastSync > staleMs) {
          fetch("/api/games/dota2", { method: "PATCH" })
            .then((r) => r.ok ? r.json() : null)
            .then((fresh) => { if (fresh?.id) setProfile(fresh); })
            .catch(() => { /* silencioso */ });
        }
      })
      .finally(() => setFetching(false));
  }, []);

  const availableConditionTypes = (["KILLS", "ASSISTS", "GPM", "XPM"] as ConditionType[])
    .filter((t) => !conditions.some((c) => c.type === t));

  // Combo odds: WIN probability multiplied by each condition probability
  const comboResult = useMemo(() => {
    if (!profile?.stats) return null;
    const s = profile.stats;
    return calculateComboOdds(
      s.odds.winProbability,
      conditions,
      { averageKills: s.averageKills, averageAssists: s.averageAssists, averageGPM: s.averageGPM, averageXPM: s.averageXPM },
    );
  }, [conditions, profile?.stats]);

  // When no conditions: use stored winOdds; when combo: use calculated combo odds
  const selectedOdds = conditions.length > 0 ? comboResult?.odds : profile?.stats?.odds.winOdds;
  const potentialPayout = betAmount && selectedOdds ? parseFloat(betAmount) * selectedOdds : 0;

  function openAddForm() {
    const firstAvailable = availableConditionTypes[0];
    if (!firstAvailable) return;
    setAddingType(firstAvailable);
    if (profile?.stats) {
      setAddingThreshold(String(Math.round(CONDITION_META[firstAvailable].avg(profile.stats))));
    }
    setShowAddForm(true);
  }

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
    const res = await fetch("/api/bets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameProfileId: profile.id,
        amount: parseFloat(betAmount),
        conditions,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setBetSuccess(`Aposta criada! Retorno potencial: ${formatCurrency(data.bet.potentialPayout)}`);
      setBetAmount("");
      setConditions([]);
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
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[
                  { icon: Shield,       label: "Win Rate",  value: `${((profile.stats.recentWinRate ?? 0) * 100).toFixed(1)}%`, color: "var(--neon)" },
                  { icon: BarChart3,    label: "Partidas",  value: String(profile.stats.totalMatches ?? 0),                      color: "var(--blue)" },
                  { icon: Sword,        label: "KDA",       value: (profile.stats.averageKDA    ?? 0).toFixed(2),                color: "var(--gold)" },
                  { icon: Crosshair,    label: "K Médio",   value: (profile.stats.averageKills  ?? 0).toFixed(1),                color: "var(--text)" },
                  { icon: TrendingDown, label: "D Médio",   value: (profile.stats.averageDeaths ?? 0).toFixed(1),                color: "var(--danger)" },
                  { icon: TrendingUp,   label: "GPM",       value: String(Math.round(profile.stats.averageGPM ?? 0)),            color: "var(--gold)" },
                  { icon: Zap,          label: "XPM",       value: String(Math.round(profile.stats.averageXPM ?? 0)),            color: "var(--neon)" },
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

      {/* Bet terminal */}
      <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)]">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Target size={13} className="text-[var(--gold)]" />
            <span className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-bright)]">Terminal de Apostas</span>
            {balance !== null && (
              <span className="ml-auto font-mono text-xs font-bold" style={{ color: balance > 0 ? "var(--neon)" : "var(--danger)" }}>
                Saldo: {formatCurrency(balance)}
              </span>
            )}
          </div>

          {/* Base WIN odds */}
          {odds && <WinLossOddsPanel odds={odds} />}

          {/* Conditions section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-display text-[11px] tracking-widest uppercase">
                <span className="text-[var(--text-muted)]">Condições Adicionais</span>
                <span className="text-[var(--border-mid)] ml-2">— opcional</span>
              </div>
              {availableConditionTypes.length > 0 && (
                <button
                  onClick={openAddForm}
                  className="flex items-center gap-1 font-display text-[11px] tracking-widest uppercase px-2.5 py-1 border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-150"
                >
                  <Plus size={10} /> Adicionar
                </button>
              )}
            </div>

            {/* Active conditions list */}
            {conditions.map((cond) => {
              const meta = CONDITION_META[cond.type];
              return (
                <div key={cond.type} className="flex items-center gap-3 border border-[rgba(255,184,0,0.3)] bg-[rgba(255,184,0,0.04)] px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm font-semibold text-[var(--gold)]">
                      {meta.label} &gt; {cond.threshold}
                      <span className="text-[var(--text-muted)] text-xs ml-1.5">{meta.unit}</span>
                    </span>
                    {profile.stats && (
                      <span className="font-mono text-[11px] text-[var(--text-muted)] ml-3">
                        (média: {meta.avg(profile.stats).toFixed(cond.type === "GPM" ? 0 : 1)})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setConditions((prev) => prev.filter((c) => c.type !== cond.type))}
                    className="w-5 h-5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] transition-all shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}

            {/* Add condition form */}
            {showAddForm && profile.stats && (
              <div className="border border-[var(--gold)] bg-[rgba(255,184,0,0.05)] p-4 space-y-3">
                <div className="font-display text-[11px] tracking-widest text-[var(--gold)] uppercase">Nova condição</div>

                {/* Type selector */}
                <div className="flex gap-1.5 flex-wrap">
                  {availableConditionTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setAddingType(t);
                        setAddingThreshold(String(Math.round(CONDITION_META[t].avg(profile.stats!))));
                      }}
                      className={`px-3 py-1.5 border font-display text-[11px] tracking-widest uppercase transition-all duration-150 ${
                        addingType === t
                          ? "border-[var(--gold)] bg-[rgba(255,184,0,0.1)] text-[var(--gold)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                      }`}
                    >
                      {CONDITION_META[t].label}
                    </button>
                  ))}
                </div>

                {/* Threshold input */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase shrink-0">Mínimo</span>
                  <Input
                    type="number"
                    value={addingThreshold}
                    onChange={(e) => setAddingThreshold(e.target.value)}
                    placeholder="0"
                    className="w-28"
                    min={0}
                    step={addingType === "GPM" ? 50 : 1}
                  />
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    {CONDITION_META[addingType].unit} · média: {CONDITION_META[addingType].avg(profile.stats).toFixed(addingType === "GPM" ? 0 : 1)}
                  </span>
                  <div className="flex gap-1.5 ml-auto">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-2.5 py-1.5 border border-[var(--border)] text-[var(--text-muted)] font-display text-[11px] tracking-widest uppercase hover:border-[var(--danger)] hover:text-[var(--danger)] transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        const t = parseFloat(addingThreshold);
                        if (!t || t <= 0) return;
                        setConditions((prev) => [...prev, { type: addingType, threshold: t }]);
                        setShowAddForm(false);
                        const remaining = availableConditionTypes.filter((x) => x !== addingType);
                        if (remaining.length > 0) {
                          setAddingType(remaining[0]);
                          setAddingThreshold(String(Math.round(CONDITION_META[remaining[0]].avg(profile.stats!))));
                        }
                      }}
                      disabled={!addingThreshold || parseFloat(addingThreshold) <= 0}
                      className="px-3 py-1.5 border border-[var(--gold)] text-[var(--gold)] font-display text-[11px] tracking-widest uppercase hover:bg-[rgba(255,184,0,0.1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Combo odds summary */}
            {comboResult && conditions.length > 0 && (
              <div className="border border-[var(--gold)] bg-[rgba(255,184,0,0.05)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[11px] tracking-widest text-[var(--gold)] uppercase">Odd Combinada</span>
                  <span className="font-display text-[11px] font-bold text-[var(--gold)] uppercase px-2 py-0.5 border border-[var(--gold)] bg-[rgba(255,184,0,0.1)]">
                    COMBO ×{conditions.length + 1}
                  </span>
                </div>
                <div
                  className="font-mono text-4xl font-black text-[var(--gold)]"
                  style={{ textShadow: "0 0 20px rgba(255,184,0,0.4)" }}
                >
                  {comboResult.odds}x
                </div>
                <div className="font-mono text-[11px] text-[var(--text-muted)]">
                  Prob. combinada · {(comboResult.combinedProbability * 100).toFixed(1)}%
                </div>
                <div className="mt-2 pt-2 border-t border-[rgba(255,184,0,0.15)] space-y-1">
                  <div className="font-mono text-[11px] text-[var(--neon)]">✓ Vitória na partida</div>
                  {conditions.map((c) => (
                    <div key={c.type} className="font-mono text-[11px] text-[var(--gold)]">
                      + {CONDITION_META[c.type].label} &gt; {c.threshold} {CONDITION_META[c.type].unit}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-[var(--border)]" />

          {balance !== null && balance < 5 && (
            <AlertBox variant="error">
              Saldo insuficiente. <a href="/wallet" className="underline">Deposite aqui</a> para apostar.
            </AlertBox>
          )}

          <form onSubmit={handleBet} className="space-y-4">
            <div className="space-y-2">
              <Label>Valor da aposta (R$)</Label>
              <Input
                type="number" placeholder="0.00" min={5} max={5000} step={0.01}
                value={betAmount} onChange={(e) => setBetAmount(e.target.value)} required
                disabled={balance !== null && balance < 5}
              />
              {balance !== null && betAmount && parseFloat(betAmount) > balance && (
                <p className="font-display text-[11px] tracking-widest text-[var(--danger)] uppercase">
                  Valor maior que seu saldo disponível ({formatCurrency(balance)})
                </p>
              )}
            </div>

            {betAmount && selectedOdds && (
              <div className="border border-[var(--border)] bg-[var(--surface-1)] divide-y divide-[var(--border)]">
                {[
                  { label: "Aposta",            value: formatCurrency(parseFloat(betAmount)), color: "var(--text)" },
                  { label: "Multiplicador",      value: `${selectedOdds}x`,                   color: conditions.length > 0 ? "var(--gold)" : "var(--text)" },
                  { label: "Retorno potencial",  value: formatCurrency(potentialPayout),       color: "var(--neon)" },
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

            <Button
              type="submit"
              disabled={
                betLoading || !betAmount || !selectedOdds ||
                (balance !== null && (balance < 5 || parseFloat(betAmount) > balance))
              }
              className="w-full"
              variant={conditions.length > 0 ? "gold" : "default"}
            >
              {betLoading
                ? "Criando aposta..."
                : conditions.length > 0
                  ? `Criar Aposta Combo (${comboResult?.odds}x)`
                  : "Criar Aposta"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
