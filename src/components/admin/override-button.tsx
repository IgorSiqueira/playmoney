"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Skull, ShieldAlert, XCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  betId:          string;
  userName:       string;
  betAmount:      string; // formatted
  potentialPayout: string; // formatted
  onDone: () => void;
}

export function OverrideButton({ betId, userName, betAmount, potentialPayout, onDone }: Props) {
  const [open,    setOpen]    = useState(false);
  const [outcome, setOutcome] = useState<"WON" | "LOST" | null>(null);
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  async function handleOverride() {
    if (!outcome) return;
    setLoading(true); setError("");

    const res = await fetch(`/api/admin/bets/${betId}/override`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ outcome, reason: reason.trim() || undefined }),
    });

    const data = await res.json();
    if (res.ok) {
      setDone(true);
      setTimeout(onDone, 1200);
    } else {
      setError(data.error || "Erro ao aplicar override");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--neon)] bg-[var(--neon-dim)]">
        <CheckCircle2 size={10} className="text-[var(--neon)]" />
        <span className="font-display text-[11px] tracking-widest text-[var(--neon)] uppercase">Aplicado</span>
      </div>
    );
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline"
        className="border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-dim)] text-[10px]"
        onClick={() => setOpen(true)}>
        <ShieldAlert size={10} className="mr-1" />
        Override
        <ChevronDown size={10} className="ml-1" />
      </Button>
    );
  }

  return (
    <div className="col-span-full border border-[var(--danger)] bg-[var(--danger-dim)] p-4 space-y-3 mt-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={12} className="text-[var(--danger)]" />
          <span className="font-display text-[10px] tracking-widest text-[var(--danger)] uppercase font-bold">
            Override — {userName}
          </span>
        </div>
        <button onClick={() => { setOpen(false); setOutcome(null); setError(""); }}
          className="text-[var(--text-muted)] hover:text-[var(--text)]">
          <ChevronUp size={12} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <button
          onClick={() => setOutcome("WON")}
          className={`py-3 border flex flex-col items-center gap-1 transition-all ${
            outcome === "WON"
              ? "border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--neon)]"
          }`}>
          <Trophy size={14} />
          <span className="font-display text-[11px] tracking-widest uppercase">User Ganhou</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">+{potentialPayout}</span>
        </button>
        <button
          onClick={() => setOutcome("LOST")}
          className={`py-3 border flex flex-col items-center gap-1 transition-all ${
            outcome === "LOST"
              ? "border-[var(--danger)] bg-[rgba(255,58,110,0.1)] text-[var(--danger)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--danger)]"
          }`}>
          <Skull size={14} />
          <span className="font-display text-[11px] tracking-widest uppercase">Casa Ganhou</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">+{betAmount}</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px]">Motivo (opcional)</Label>
        <Input
          placeholder="Ex: OpenDota indisponível, partida verificada manualmente"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="text-xs"
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 border border-[var(--danger)] px-3 py-2">
          <XCircle size={10} className="text-[var(--danger)]" />
          <span className="font-mono text-[11px] text-[var(--danger)] tracking-widest">{error}</span>
        </div>
      )}

      <Button
        size="sm" variant="destructive"
        disabled={!outcome || loading}
        onClick={handleOverride}
        className="w-full">
        {loading ? "Aplicando..." : `Confirmar: ${outcome === "WON" ? "User Ganhou" : outcome === "LOST" ? "Casa Ganhou" : "—"}`}
      </Button>
    </div>
  );
}
