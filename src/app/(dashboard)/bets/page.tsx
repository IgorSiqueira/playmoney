"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Target, Trophy, Skull, Swords, Clock, Hash,
  ChevronDown, ChevronUp, Terminal, CheckCircle2, XCircle,
  Activity, Gamepad2, TrendingUp, TrendingDown,
} from "lucide-react";
import { describeEventBet } from "@/lib/bet-events";
import { AlertBox } from "@/components/ui/alert-box";

interface Bet {
  id: string;
  prediction: string;
  amount: number;
  odds: number;
  potentialPayout: number;
  status: string;
  matchId: string | null;
  eventType: string;
  targetValue: number | null;
  createdAt: string;
  settledAt: string | null;
  gameProfile: { game: string; displayName: string | null };
}

const statusCfg: Record<string, { label: string; variant: "default" | "destructive" | "warning" | "secondary"; icon: typeof Trophy; color: string }> = {
  ACTIVE:    { label: "Ativa",     variant: "warning",     icon: Activity, color: "var(--gold)" },
  WON:       { label: "Vitória",   variant: "default",     icon: Trophy,   color: "var(--neon)" },
  LOST:      { label: "Derrota",   variant: "destructive", icon: Skull,    color: "var(--danger)" },
  PENDING:   { label: "Pendente",  variant: "secondary",   icon: Clock,    color: "var(--text-muted)" },
  CANCELLED: { label: "Cancelada", variant: "secondary",   icon: XCircle,  color: "var(--text-muted)" },
};

export default function BetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [settleBetId, setSettleBetId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState("");
  const [settling, setSettling] = useState(false);
  const [settleResult, setSettleResult] = useState<{ won: boolean; payout: number } | null>(null);
  const [settleError, setSettleError] = useState("");

  async function loadBets() {
    const res = await fetch("/api/bets");
    if (res.ok) setBets(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadBets(); }, []);

  async function handleSettle(betId: string) {
    if (!matchId.trim()) return;
    setSettling(true);
    setSettleError("");
    setSettleResult(null);

    const res = await fetch(`/api/bets/${betId}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });

    const data = await res.json();
    if (res.ok) {
      setSettleResult({ won: data.betWon, payout: data.payout });
      setMatchId("");
      setSettleBetId(null);
      loadBets();
    } else {
      setSettleError(data.error || "Erro ao liquidar aposta");
    }
    setSettling(false);
  }

  const activeBets = bets.filter((b) => b.status === "ACTIVE");
  const finishedBets = bets.filter((b) => b.status !== "ACTIVE");

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-16">
        <div className="w-1.5 h-1.5 bg-[var(--neon)] animate-pulse" />
        <span className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">
          Carregando apostas...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--neon)] uppercase mb-1">▸ Arena</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">
          Apostas
        </h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">
          Gerencie e liquide suas apostas em andamento
        </p>
      </div>

      {/* Settle result banner */}
      {settleResult && (
        <div
          className="bracket relative border p-4 flex items-center gap-4"
          style={{
            borderColor: settleResult.won ? "var(--neon)" : "var(--danger)",
            background: settleResult.won ? "var(--neon-dim)" : "var(--danger-dim)",
          }}
        >
          <div className="h-0.5 absolute top-0 left-0 right-0"
            style={{ background: `linear-gradient(90deg, transparent, ${settleResult.won ? "var(--neon)" : "var(--danger)"}, transparent)` }}
          />
          {settleResult.won ? (
            <Trophy size={20} className="text-[var(--neon)] shrink-0" />
          ) : (
            <Skull size={20} className="text-[var(--danger)] shrink-0" />
          )}
          <div>
            <div className="font-display text-sm font-bold uppercase tracking-widest"
              style={{ color: settleResult.won ? "var(--neon)" : "var(--danger)" }}
            >
              {settleResult.won ? "Vitória Confirmada" : "Derrota Registrada"}
            </div>
            {settleResult.won && (
              <div className="font-mono text-xs text-[var(--text-muted)] mt-0.5">
                +{formatCurrency(settleResult.payout)} creditado na carteira
              </div>
            )}
          </div>
          <button
            onClick={() => setSettleResult(null)}
            className="ml-auto text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Active bets */}
      {activeBets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-0.5 h-4 bg-[var(--gold)]" />
            <Activity size={13} className="text-[var(--gold)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">
              Apostas Ativas
            </span>
            <div className="ml-1 px-2 py-0.5 border border-[var(--gold)] bg-[var(--gold-dim)]">
              <span className="font-mono text-[11px] text-[var(--gold)]">{activeBets.length}</span>
            </div>
          </div>

          <div className="space-y-3">
            {activeBets.map((bet) => (
              <ActiveBetCard
                key={bet.id}
                bet={bet}
                isSettling={settleBetId === bet.id}
                matchId={settleBetId === bet.id ? matchId : ""}
                settling={settling}
                settleError={settleError}
                onOpenSettle={() => { setSettleBetId(bet.id); setSettleError(""); }}
                onCloseSettle={() => { setSettleBetId(null); setMatchId(""); setSettleError(""); }}
                onMatchIdChange={setMatchId}
                onSettle={() => handleSettle(bet.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {finishedBets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-0.5 h-4 bg-[var(--neon)]" />
            <Swords size={13} className="text-[var(--text-muted)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">
              Histórico
            </span>
          </div>

          <div className="space-y-1.5">
            {finishedBets.map((bet) => {
              const s = statusCfg[bet.status] ?? { label: bet.status, variant: "secondary" as const, icon: Target, color: "var(--text-muted)" };
              const Icon = s.icon;
              return (
                <div
                  key={bet.id}
                  className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 hover:border-[var(--border-mid)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 border flex items-center justify-center shrink-0"
                      style={{ borderColor: `${s.color}40` }}
                    >
                      <Icon size={12} style={{ color: s.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-ui text-sm font-semibold text-[var(--text-bright)]">
                          {describeEventBet(bet.eventType ?? "WIN_LOSS", bet.prediction, bet.targetValue ?? undefined)}
                        </span>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">
                          {formatDate(bet.createdAt)}
                        </span>
                        {bet.matchId && (
                          <span className="font-mono text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                            <Hash size={9} />
                            {bet.matchId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-[var(--text-bright)]">
                      {formatCurrency(Number(bet.amount))}
                    </div>
                    {bet.status === "WON" && (
                      <div className="font-mono text-[10px] text-[var(--neon)]">
                        +{formatCurrency(Number(bet.potentialPayout))}
                      </div>
                    )}
                    {bet.status === "LOST" && (
                      <div className="font-mono text-[10px] text-[var(--danger)]">
                        -{formatCurrency(Number(bet.amount))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {bets.length === 0 && (
        <div className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] py-16 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--neon) 0, var(--neon) 1px, transparent 0, transparent 50%)", backgroundSize: "8px 8px" }}
          />
          <div className="relative z-10">
            <div className="w-14 h-14 border border-[var(--border)] bg-[var(--surface-3)] flex items-center justify-center mx-auto mb-4">
              <Target size={24} className="text-[var(--text-muted)]" />
            </div>
            <div className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)] mb-1">
              Sem Apostas
            </div>
            <div className="font-ui text-[13px] text-[var(--text-muted)]">
              Vá para Dota 2 para criar sua primeira aposta
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveBetCard({
  bet, isSettling, matchId, settling, settleError,
  onOpenSettle, onCloseSettle, onMatchIdChange, onSettle,
}: {
  bet: Bet;
  isSettling: boolean;
  matchId: string;
  settling: boolean;
  settleError: string;
  onOpenSettle: () => void;
  onCloseSettle: () => void;
  onMatchIdChange: (v: string) => void;
  onSettle: () => void;
}) {
  const isWinLoss = !bet.eventType || bet.eventType === "WIN_LOSS";
  const isPositivePred = bet.prediction === "WIN" || bet.prediction === "OVER";
  const predColor = isPositivePred ? "var(--neon)" : "var(--danger)";
  const predDim   = isPositivePred ? "var(--neon-dim)" : "var(--danger-dim)";
  const PredIcon  = isPositivePred
    ? (isWinLoss ? Trophy : TrendingUp)
    : (isWinLoss ? Skull  : TrendingDown);
  const predLabel = isWinLoss
    ? (bet.prediction === "WIN" ? "WIN" : "LOSS")
    : bet.prediction;

  const betDescription = describeEventBet(
    bet.eventType ?? "WIN_LOSS",
    bet.prediction,
    bet.targetValue ?? undefined
  );

  return (
    <div className="bracket relative border border-[var(--gold)] bg-[var(--surface-2)] overflow-hidden">
      {/* top accent */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent absolute top-0 left-0 right-0" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-[var(--gold)] bg-[var(--gold-dim)] flex items-center justify-center shrink-0">
              <Gamepad2 size={16} className="text-[var(--gold)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold uppercase tracking-wide text-[var(--text-bright)]">
                  {betDescription}
                </span>
                <Badge variant="warning">Ativa</Badge>
              </div>
              <div className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5">
                {bet.gameProfile.displayName} · {formatDate(bet.createdAt)}
              </div>
            </div>
          </div>

          {/* Prediction badge */}
          <div
            className="px-3 py-1.5 border shrink-0 flex items-center gap-1.5"
            style={{ borderColor: predColor, background: predDim }}
          >
            <PredIcon size={10} style={{ color: predColor }} />
            <span
              className="font-display text-[11px] tracking-widest uppercase font-bold"
              style={{ color: predColor }}
            >
              {predLabel}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Apostado",  value: formatCurrency(Number(bet.amount)),          color: "var(--text-bright)" },
            { label: "Odds",      value: `${Number(bet.odds).toFixed(2)}×`,           color: "var(--gold)" },
            { label: "Retorno",   value: formatCurrency(Number(bet.potentialPayout)), color: "var(--neon)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-center">
              <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-1">{label}</div>
              <div className="font-mono text-sm font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Settle section */}
        <div className="border-t border-[var(--border)] pt-4">
          {isSettling ? (
            <div className="space-y-3">
              {/* Terminal-style header */}
              <div className="flex items-center gap-2 mb-3">
                <Terminal size={11} className="text-[var(--neon)]" />
                <span className="font-display text-[11px] tracking-widest text-[var(--neon)] uppercase">
                  Submeter Resultado
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Hash size={10} />
                  Match ID da partida jogada
                </Label>
                <Input
                  placeholder="Ex: 7890123456"
                  value={matchId}
                  onChange={(e) => onMatchIdChange(e.target.value)}
                  className="font-mono"
                />
                <p className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">
                  ▸ Encontre em opendota.com ou no histórico do jogo
                </p>
              </div>

              {settleError && <AlertBox variant="error">{settleError}</AlertBox>}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={onSettle}
                  disabled={settling || !matchId.trim()}
                  className="flex items-center gap-1.5"
                >
                  {settling ? (
                    <>
                      <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={11} />
                      Confirmar Resultado
                    </>
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={onCloseSettle}>
                  <ChevronUp size={11} className="mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={onOpenSettle} className="flex items-center gap-1.5">
              <Swords size={11} />
              Joguei — Submeter Resultado
              <ChevronDown size={11} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
