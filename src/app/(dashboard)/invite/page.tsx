"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { formatDate } from "@/lib/utils";
import { Copy, Check, Users, Gift, Link2 } from "lucide-react";

interface InviteUse {
  id: string;
  createdAt: string;
  user: { name: string | null; createdAt: string };
}

interface InviteData {
  invite: { code: string; createdAt: string };
  uses: InviteUse[];
  total: number;
}

export default function InvitePage() {
  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/invite").then(async (res) => {
      if (res.status === 403) { setForbidden(true); setLoading(false); return; }
      if (res.ok) setData(await res.json());
      setLoading(false);
    });
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = data ? `${origin}/register?ref=${data.invite.code}` : "";

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-display text-sm tracking-widest text-[var(--text-muted)] uppercase animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Gift size={40} className="text-[var(--text-muted)]" />
        <div className="text-center">
          <div className="font-display text-lg font-black uppercase tracking-widest text-[var(--text-bright)]">Sem acesso</div>
          <p className="font-ui text-sm text-[var(--text-muted)] mt-1">Você ainda não tem permissão para gerar convites. Solicite ao admin.</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 pb-8">
      <Breadcrumb
        pageTitle="Meus Convites"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Convites" }]}
      />

      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--neon)] uppercase mb-1">▸ Link de Indicação</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Convites</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">Compartilhe seu link e acompanhe quem entrou pela sua indicação</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">Total convidados</span>
            <Users size={12} className="text-[var(--neon)]" />
          </div>
          <div className="font-mono text-3xl font-bold text-[var(--neon)]" style={{ textShadow: "0 0 20px rgba(0,128,255,0.5)" }}>
            {data.total}
          </div>
        </div>
        <div className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">Código</span>
            <Link2 size={12} className="text-[var(--neon)]" />
          </div>
          <div className="font-mono text-3xl font-bold text-[var(--text-bright)]">{data.invite.code}</div>
        </div>
      </div>

      {/* Link box */}
      <div className="bracket border border-[var(--neon)] bg-[var(--neon-dim)] p-5 space-y-3">
        <div className="font-display text-xs font-bold uppercase tracking-widest text-[var(--neon)]">Seu Link de Convite</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 font-mono text-sm text-[var(--text)] bg-[var(--surface-1)] border border-[var(--border)] px-3 py-2.5 truncate">
            {link}
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-2 px-4 py-2.5 border font-display text-[11px] tracking-widest uppercase transition-all shrink-0"
            style={{
              borderColor: copied ? "var(--neon)" : "var(--border)",
              color: copied ? "var(--neon)" : "var(--text-muted)",
              background: copied ? "var(--neon-dim)" : "transparent",
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <p className="font-ui text-xs text-[var(--text-muted)]">
          Qualquer pessoa que se cadastrar por esse link ficará vinculada à sua indicação.
        </p>
      </div>

      {/* Invited users */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-[var(--neon)]" />
          <span className="font-display text-xs font-bold uppercase tracking-widest text-[var(--text-bright)]">
            Quem entrou pelo seu convite
          </span>
        </div>

        {data.uses.length === 0 ? (
          <div className="border border-[var(--border)] bg-[var(--surface-2)] p-8 text-center">
            <Users size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="font-display text-sm tracking-widest text-[var(--text-muted)] uppercase">
              Ninguém ainda — compartilhe seu link!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.uses.map((use, i) => (
              <div key={use.id} className="flex items-center gap-4 border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 hover:bg-[var(--surface-hover)] transition-all duration-150">
                <div
                  className="w-7 h-7 border flex items-center justify-center shrink-0 font-display text-[11px] font-black"
                  style={{ borderColor: "rgba(0,128,255,0.3)", color: "var(--neon)" }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-ui text-sm font-semibold text-[var(--text-bright)] truncate">
                    {use.user.name ?? "Usuário"}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text-muted)]">
                    Entrou em {formatDate(use.createdAt)}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[var(--neon)]">+1</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
