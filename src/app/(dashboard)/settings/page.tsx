"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Shield, AlertTriangle, CheckCircle2, Settings,
  Lock, Clock, Ban, Heart, XCircle,
} from "lucide-react";

interface UserSettings {
  selfExcludedUntil: string | null;
  agreedToTermsAt: string | null;
  dailyLossLimit: number | null;
  weeklyLossLimit: number | null;
}

const EXCLUSION_OPTIONS = [
  { value: "7d",         label: "7 dias" },
  { value: "30d",        label: "30 dias" },
  { value: "90d",        label: "90 dias" },
  { value: "365d",       label: "1 ano" },
  { value: "indefinite", label: "Indefinidamente" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [dailyLimit, setDailyLimit] = useState("");
  const [weeklyLimit, setWeeklyLimit] = useState("");
  const [selectedExclusion, setSelectedExclusion] = useState<string>("");
  const [confirmExclusion, setConfirmExclusion] = useState(false);

  async function load() {
    const res = await fetch("/api/user/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
      setDailyLimit(data.dailyLossLimit ? String(data.dailyLossLimit) : "");
      setWeeklyLimit(data.weeklyLossLimit ? String(data.weeklyLossLimit) : "");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(patch: Record<string, unknown>) {
    setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) { setSuccess("Configurações salvas."); load(); }
    else { const d = await res.json(); setError(d.error || "Erro ao salvar"); }
    setSaving(false);
  }

  async function handleLimits(e: React.FormEvent) {
    e.preventDefault();
    await save({
      dailyLossLimit:  dailyLimit  ? parseFloat(dailyLimit)  : null,
      weeklyLossLimit: weeklyLimit ? parseFloat(weeklyLimit) : null,
    });
  }

  async function handleExclusion() {
    if (!selectedExclusion || !confirmExclusion) return;
    await save({ selfExcludePeriod: selectedExclusion });
    setConfirmExclusion(false);
    setSelectedExclusion("");
  }

  async function handleTerms() {
    await save({ agreedToTerms: true });
  }

  const isExcluded = settings?.selfExcludedUntil && new Date(settings.selfExcludedUntil) > new Date();

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-16">
        <div className="w-1.5 h-1.5 bg-[var(--neon)] animate-pulse" />
        <span className="font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="font-display text-[10px] tracking-[0.3em] text-[var(--neon)] uppercase mb-1">▸ Conta</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Configurações</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">Jogo responsável e preferências da conta</p>
      </div>

      {/* Feedback */}
      {success && (
        <div className="border border-[var(--neon)] bg-[var(--neon-dim)] px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 size={11} className="text-[var(--neon)]" />
          <span className="font-display text-[10px] tracking-widest text-[var(--neon)] uppercase">{success}</span>
        </div>
      )}
      {error && (
        <div className="border border-[var(--danger)] bg-[var(--danger-dim)] px-4 py-2.5 flex items-center gap-2">
          <XCircle size={11} className="text-[var(--danger)]" />
          <span className="font-display text-[10px] tracking-widest text-[var(--danger)] uppercase">{error}</span>
        </div>
      )}

      {/* Termos de uso */}
      <section className="bracket border border-[var(--border)] bg-[var(--surface-2)]">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--neon)] to-transparent" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={13} className="text-[var(--neon)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">Termos & Verificação de Idade</span>
            {settings?.agreedToTermsAt
              ? <Badge variant="default" className="ml-auto">Aceito</Badge>
              : <Badge variant="warning" className="ml-auto">Pendente</Badge>}
          </div>
          {settings?.agreedToTermsAt ? (
            <p className="font-mono text-[11px] text-[var(--text-muted)] tracking-wide">
              Aceito em {new Date(settings.agreedToTermsAt).toLocaleDateString("pt-BR")} · Você confirmou ser maior de 18 anos
            </p>
          ) : (
            <div className="space-y-3">
              <p className="font-ui text-sm text-[var(--text-muted)]">
                Para apostar, você precisa confirmar que tem 18 anos ou mais e aceitar os Termos de Uso da plataforma.
              </p>
              <div className="border border-[var(--border)] bg-[var(--surface-1)] p-3 space-y-1">
                <p className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">▸ Este é um serviço de apostas simuladas para fins de entretenimento</p>
                <p className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">▸ Você deve ter 18 anos ou mais para participar</p>
                <p className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">▸ Apostas envolvem risco de perda financeira</p>
                <p className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">▸ Jogue com responsabilidade</p>
              </div>
              <Button onClick={handleTerms} disabled={saving}>
                <CheckCircle2 size={11} className="mr-1.5" /> Confirmo que tenho 18+ anos e aceito os Termos
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Limites de perda */}
      <section className="bracket border border-[var(--border)] bg-[var(--surface-2)]">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={13} className="text-[var(--gold)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">Limites de Perda</span>
          </div>
          <p className="font-ui text-sm text-[var(--text-muted)] mb-4">
            Defina limites máximos de quanto pode perder em apostas por dia e por semana. Deixe em branco para sem limite.
          </p>
          <form onSubmit={handleLimits} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Clock size={10} /> Limite Diário (R$)</Label>
                <Input type="number" placeholder="Sem limite" min={10} step={10}
                  value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
                {settings?.dailyLossLimit && (
                  <p className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">
                    Atual: {formatCurrency(settings.dailyLossLimit)}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Clock size={10} /> Limite Semanal (R$)</Label>
                <Input type="number" placeholder="Sem limite" min={10} step={10}
                  value={weeklyLimit} onChange={(e) => setWeeklyLimit(e.target.value)} />
                {settings?.weeklyLossLimit && (
                  <p className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">
                    Atual: {formatCurrency(settings.weeklyLossLimit)}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" variant="outline" size="sm" disabled={saving}>Salvar Limites</Button>
          </form>
        </div>
      </section>

      {/* Auto-exclusão */}
      <section className="bracket border border-[var(--danger)] bg-[var(--surface-2)]">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--danger)] to-transparent" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Ban size={13} className="text-[var(--danger)]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">Auto-Exclusão</span>
            {isExcluded && (
              <Badge variant="destructive" className="ml-auto">
                Ativa até {new Date(settings!.selfExcludedUntil!).toLocaleDateString("pt-BR")}
              </Badge>
            )}
          </div>

          {isExcluded ? (
            <div className="border border-[var(--danger)] bg-[var(--danger-dim)] p-4">
              <p className="font-ui text-sm text-[var(--danger)]">
                Sua conta está auto-excluída. Você não pode criar apostas durante este período.
                Se precisar de ajuda, entre em contato com o suporte.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-ui text-sm text-[var(--text-muted)]">
                A auto-exclusão bloqueia você de criar novas apostas pelo período selecionado. Esta ação não pode ser desfeita antecipadamente.
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {EXCLUSION_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button"
                    onClick={() => { setSelectedExclusion(opt.value); setConfirmExclusion(false); }}
                    className={`py-2 border font-display text-[11px] tracking-widest uppercase transition-all ${
                      selectedExclusion === opt.value
                        ? "border-[var(--danger)] bg-[var(--danger-dim)] text-[var(--danger)]"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--danger)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {selectedExclusion && (
                <div className="border border-[var(--danger)] bg-[var(--danger-dim)] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} className="text-[var(--danger)] shrink-0" />
                    <span className="font-display text-[10px] tracking-widest text-[var(--danger)] uppercase">
                      Confirme para se excluir por {EXCLUSION_OPTIONS.find(o => o.value === selectedExclusion)?.label}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={confirmExclusion}
                      onChange={(e) => setConfirmExclusion(e.target.checked)}
                      className="accent-red-500" />
                    <span className="font-ui text-[13px] text-[var(--text-muted)]">
                      Entendo que não poderei reverter esta ação antes do período terminar
                    </span>
                  </label>
                  <Button variant="destructive" size="sm" disabled={!confirmExclusion || saving}
                    onClick={handleExclusion}>
                    Confirmar Auto-Exclusão
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2">
            <Heart size={10} className="text-[var(--danger)]" />
            <span className="font-ui text-[12px] text-[var(--text-muted)] tracking-wide">
              Jogo compulsivo é uma doença · Ajuda: jogo-responsavel.org.br · CVJ 0800 722 4000
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
