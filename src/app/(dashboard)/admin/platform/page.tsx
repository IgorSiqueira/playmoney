"use client";

import { useEffect, useState, useTransition } from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { AlertTriangle, CheckCircle2, Lock, Unlock, Wrench } from "lucide-react";

interface Settings {
  depositsBlocked: boolean;
  globalDepositLimit: number | null;
  maintenanceMode: boolean;
  maintenanceBanner: string | null;
}

export default function AdminPlatformPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isPending, startTransition] = useTransition();
  const [limitInput, setLimitInput] = useState("");
  const [bannerInput, setBannerInput] = useState("");
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/platform");
    if (res.ok) {
      const data: Settings = await res.json();
      setSettings(data);
      setLimitInput(data.globalDepositLimit !== null ? String(data.globalDepositLimit) : "");
      setBannerInput(data.maintenanceBanner ?? "");
    }
  }

  useEffect(() => { void load(); }, []);

  function flash(msg: string, ok: boolean) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function patch(body: Partial<Settings & { globalDepositLimit: number | null }>) {
    const res = await fetch("/api/admin/platform", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { flash("Configuração salva", true); void load(); }
    else { const e = await res.json(); flash(e.error ?? "Erro", false); }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-display text-sm tracking-widest text-[var(--text-muted)] uppercase animate-pulse">Carregando...</div>
      </div>
    );
  }

  function Toggle({ active, onEnable, onDisable, label, description, icon: Icon, dangerOn }: {
    active: boolean;
    onEnable: () => void;
    onDisable: () => void;
    label: string;
    description: string;
    icon: React.ElementType;
    dangerOn?: boolean;
  }) {
    return (
      <div className="border border-[var(--border)] bg-[var(--surface-2)] p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} style={{ color: active && dangerOn ? "var(--danger)" : active ? "var(--neon)" : "var(--text-muted)" }} />
              <span className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-bright)]">{label}</span>
            </div>
            <p className="font-ui text-xs text-[var(--text-muted)]">{description}</p>
          </div>
          <div
            className="shrink-0 px-3 py-1 border font-display text-[11px] tracking-widest uppercase"
            style={{
              borderColor: active ? (dangerOn ? "var(--danger)" : "var(--neon)") : "var(--border)",
              color: active ? (dangerOn ? "var(--danger)" : "var(--neon)") : "var(--text-muted)",
              background: active ? (dangerOn ? "var(--danger-dim)" : "var(--neon-dim)") : "transparent",
            }}
          >
            {active ? "Ativo" : "Inativo"}
          </div>
        </div>
        <div className="flex gap-2">
          {!active ? (
            <button
              onClick={onEnable}
              disabled={isPending}
              className="font-display text-[11px] tracking-widest uppercase px-3 py-2 border transition-all disabled:opacity-40"
              style={{ borderColor: dangerOn ? "var(--danger)" : "var(--neon)", color: dangerOn ? "var(--danger)" : "var(--neon)" }}
            >
              Ativar
            </button>
          ) : (
            <button
              onClick={onDisable}
              disabled={isPending}
              className="font-display text-[11px] tracking-widest uppercase px-3 py-2 border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--neon)] hover:text-[var(--neon)] transition-all disabled:opacity-40"
            >
              Desativar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <Breadcrumb
        pageTitle="Plataforma"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin", href: "/admin" }, { label: "Plataforma" }]}
      />

      {feedback && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 border font-ui text-sm font-semibold"
          style={{
            borderColor: feedback.ok ? "var(--neon)" : "var(--danger)",
            color: feedback.ok ? "var(--neon)" : "var(--danger)",
            background: "var(--surface-2)",
          }}
        >
          {feedback.msg}
        </div>
      )}

      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--danger)] uppercase mb-1">▸ Admin · Restrito</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Plataforma</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">Configurações globais que afetam todos os usuários</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-0.5 h-4 bg-[var(--danger)]" />
          <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">Controles Globais</span>
        </div>

        <Toggle
          active={settings.maintenanceMode}
          label="Modo Manutenção"
          description="Exibe um aviso de manutenção no topo da plataforma para todos os usuários."
          icon={Wrench}
          dangerOn
          onEnable={() => startTransition(() => patch({ maintenanceMode: true }))}
          onDisable={() => startTransition(() => patch({ maintenanceMode: false }))}
        />

        {settings.maintenanceMode && (
          <div className="border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
            <div className="font-display text-xs tracking-widest text-[var(--text-bright)] uppercase">Texto do Banner</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={bannerInput}
                onChange={(e) => setBannerInput(e.target.value)}
                placeholder="Ex: Sistema em manutenção programada — previsão de retorno em 2h"
                className="font-ui text-sm bg-[var(--surface-1)] border border-[var(--border)] px-3 py-2 text-[var(--text)] flex-1 focus:outline-none focus:border-[var(--neon)]"
              />
              <button
                onClick={() => startTransition(() => patch({ maintenanceBanner: bannerInput || null }))}
                disabled={isPending}
                className="font-display text-[11px] tracking-widest uppercase px-3 py-2 border border-[var(--neon)] text-[var(--neon)] transition-all disabled:opacity-40"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        <Toggle
          active={settings.depositsBlocked}
          label="Bloquear Todos os Depósitos"
          description="Nenhum usuário conseguirá realizar depósitos enquanto esta opção estiver ativa."
          icon={Lock}
          dangerOn
          onEnable={() => startTransition(() => patch({ depositsBlocked: true }))}
          onDisable={() => startTransition(() => patch({ depositsBlocked: false }))}
        />

        {/* Global deposit limit */}
        <div className="border border-[var(--border)] bg-[var(--surface-2)] p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-[var(--gold)]" />
              <span className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-bright)]">Limite Global de Depósito</span>
            </div>
            <p className="font-ui text-xs text-[var(--text-muted)]">
              Limite diário para todos os usuários. Padrão: R$ 2.000. Limites individuais por usuário sobrepõem este valor.
            </p>
            {settings.globalDepositLimit !== null && (
              <div className="mt-1 font-mono text-xs text-[var(--gold)]">
                Atual: R$ {settings.globalDepositLimit.toFixed(2)}
              </div>
            )}
            {settings.globalDepositLimit === null && (
              <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">Usando padrão: R$ 2.000,00</div>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-mono text-xs text-[var(--text-muted)]">R$</span>
            <input
              type="number"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              placeholder="2000"
              className="font-mono text-sm bg-[var(--surface-1)] border border-[var(--border)] px-3 py-2 text-[var(--text)] w-36 focus:outline-none focus:border-[var(--neon)]"
            />
            <button
              onClick={() => startTransition(() => patch({ globalDepositLimit: limitInput ? parseFloat(limitInput) : null }))}
              disabled={isPending}
              className="font-display text-[11px] tracking-widest uppercase px-3 py-2 border border-[var(--neon)] text-[var(--neon)] transition-all disabled:opacity-40"
            >
              Salvar
            </button>
            {settings.globalDepositLimit !== null && (
              <button
                onClick={() => startTransition(() => { setLimitInput(""); patch({ globalDepositLimit: null }); })}
                disabled={isPending}
                className="font-display text-[11px] tracking-widest uppercase px-3 py-2 border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--neon)] transition-all disabled:opacity-40"
              >
                Restaurar padrão
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
