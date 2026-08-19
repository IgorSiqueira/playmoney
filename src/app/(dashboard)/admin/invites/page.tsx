"use client";

import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { formatDate } from "@/lib/utils";
import { Users, ChevronDown, ChevronRight, Gift } from "lucide-react";

interface InviteRow {
  id: string;
  code: string;
  createdAt: string;
  creator: { name: string | null; email: string };
  uses: {
    id: string;
    createdAt: string;
    user: { name: string | null; email: string; createdAt: string };
  }[];
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/invites").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites);
      }
      setLoading(false);
    });
  }, []);

  const totalUses = invites.reduce((s, i) => s + i.uses.length, 0);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-8 pb-8">
      <Breadcrumb
        pageTitle="Convites"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin", href: "/admin" }, { label: "Convites" }]}
      />

      <div>
        <div className="font-ui text-[11px] font-semibold tracking-[0.2em] text-[var(--danger)] uppercase mb-1">▸ Admin · Indicações</div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[var(--text-bright)]">Convites</h1>
        <p className="font-ui text-sm text-[var(--text-muted)] mt-1">Links ativos e usuários indicados</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Links Ativos",    value: String(invites.length), color: "var(--neon)" },
          { label: "Total Indicados", value: String(totalUses),      color: "var(--gold)" },
          { label: "Conversão",       value: invites.length > 0 ? `${(totalUses / invites.length).toFixed(1)}x` : "—", color: "var(--blue)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bracket border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-2">{label}</div>
            <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="font-display text-sm tracking-widest text-[var(--text-muted)] uppercase animate-pulse">Carregando...</div>
        </div>
      ) : invites.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface-2)] p-8 text-center">
          <Gift size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="font-display text-sm tracking-widest text-[var(--text-muted)] uppercase">Nenhum link ativo ainda</p>
          <p className="font-ui text-xs text-[var(--text-muted)] mt-1">Autorize usuários em Admin → Usuários → Gerenciar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => {
            const isExpanded = expanded === invite.id;
            return (
              <div key={invite.id} className="bracket border border-[var(--border)] bg-[var(--surface-2)]">
                {/* Row */}
                <button
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[var(--surface-hover)] transition-all duration-150 text-left"
                  onClick={() => setExpanded(isExpanded ? null : invite.id)}
                >
                  {/* Creator */}
                  <div className="flex-1 min-w-0">
                    <div className="font-ui text-sm font-semibold text-[var(--text-bright)] truncate">
                      {invite.creator.name ?? "—"}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--text-muted)] truncate">{invite.creator.email}</div>
                  </div>

                  {/* Code */}
                  <div className="font-mono text-sm text-[var(--neon)] tracking-widest shrink-0">{invite.code}</div>

                  {/* Uses count */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Users size={11} className="text-[var(--text-muted)]" />
                    <span className="font-mono text-sm font-bold" style={{ color: invite.uses.length > 0 ? "var(--gold)" : "var(--text-muted)" }}>
                      {invite.uses.length}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="font-mono text-[11px] text-[var(--text-muted)] shrink-0">{formatDate(invite.createdAt)}</div>

                  {/* Expand */}
                  {isExpanded ? (
                    <ChevronDown size={13} className="text-[var(--text-muted)] shrink-0" />
                  ) : (
                    <ChevronRight size={13} className="text-[var(--text-muted)] shrink-0" />
                  )}
                </button>

                {/* Link */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] px-4 py-3 space-y-3 bg-[var(--surface-1)]">
                    <div>
                      <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-1">Link</div>
                      <div className="font-mono text-xs text-[var(--neon)] break-all">
                        {origin}/register?ref={invite.code}
                      </div>
                    </div>

                    {invite.uses.length > 0 ? (
                      <div>
                        <div className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase mb-2">
                          Indicados ({invite.uses.length})
                        </div>
                        <div className="space-y-1">
                          {invite.uses.map((use) => (
                            <div key={use.id} className="flex items-center gap-3 px-3 py-2 border border-[var(--border)] bg-[var(--surface-2)]">
                              <div className="flex-1 min-w-0">
                                <div className="font-ui text-xs font-semibold text-[var(--text-bright)] truncate">{use.user.name ?? "—"}</div>
                                <div className="font-mono text-[11px] text-[var(--text-muted)] truncate">{use.user.email}</div>
                              </div>
                              <div className="font-mono text-[11px] text-[var(--text-muted)] shrink-0">{formatDate(use.createdAt)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="font-ui text-xs text-[var(--text-muted)]">Nenhum indicado ainda.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
