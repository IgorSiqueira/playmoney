"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CreditCard, Gamepad2, Target,
  LogOut, ChevronRight, Zap, Settings, ShieldAlert,
  User, Trophy, Users, Flag,
} from "lucide-react";

interface SidebarProps {
  user: { name?: string | null; email?: string | null; role?: string | null };
}

const navItems = [
  { href: "/dashboard",   label: "Dashboard",       icon: LayoutDashboard },
  { href: "/wallet",      label: "Carteira",         icon: CreditCard },
  { href: "/games/dota2", label: "Dota 2",           icon: Gamepad2 },
  { href: "/bets",        label: "Apostas",          icon: Target },
  { href: "/leaderboard", label: "Leaderboard",      icon: Trophy },
  { href: "/profile",     label: "Perfil",           icon: User },
  { href: "/settings",    label: "Configurações",    icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="relative flex flex-col w-56 shrink-0 bg-[var(--surface-1)] border-r border-[var(--border)] h-full z-10">
      {/* Vertical accent line */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--neon)] to-transparent opacity-30 pointer-events-none" />

      {/* Logo */}
      <div className="p-5 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex items-center justify-center border border-[var(--neon)] bg-[var(--neon-dim)]">
            <span className="font-display text-sm font-black text-[var(--neon)]">P</span>
            <div className="absolute inset-0 bg-[var(--neon)] opacity-0 group-hover:opacity-10 transition-opacity" />
          </div>
          <div>
            <div className="font-display text-xs font-black tracking-[0.2em] text-[var(--text-bright)] uppercase">
              Play<span className="text-[var(--neon)]">Money</span>
            </div>
            <div className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest">v1.0 · BETA</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        <div className="font-display text-[11px] tracking-[0.25em] text-[var(--text-muted)] px-3 mb-3 uppercase">
          Navegação
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          // exact match para / e /dashboard, prefix match para sub-rotas
          const active = href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 transition-all duration-150 relative",
                active
                  ? "bg-[var(--neon-dim)] text-[var(--neon)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              )}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--neon)] shadow-[0_0_8px_var(--neon)]" />
              )}
              <Icon
                size={15}
                className={cn(
                  "shrink-0 transition-all",
                  active ? "text-[var(--neon)] drop-shadow-[0_0_4px_var(--neon)]" : ""
                )}
              />
              <span className="font-ui text-sm font-semibold tracking-wide">{label}</span>
              {active && (
                <ChevronRight size={12} className="ml-auto text-[var(--neon)] opacity-60" />
              )}
            </Link>
          );
        })}

        {/* Admin section */}
        {user.role === "ADMIN" && (
          <>
            <div className="mx-3 my-3 border-t border-[var(--border)]" />
            <div className="font-display text-[11px] tracking-[0.25em] text-[var(--danger)] px-3 mb-2 uppercase flex items-center gap-1.5">
              <ShieldAlert size={9} />
              Admin
            </div>
            {[
              { href: "/admin",             label: "Painel",       icon: ShieldAlert },
              { href: "/admin/users",       label: "Usuários",     icon: Users },
              { href: "/admin/settlements", label: "Liquidações",  icon: Trophy },
              { href: "/admin/risk",        label: "Risk Flags",   icon: Flag },
            ].map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 transition-all duration-150 relative",
                    active
                      ? "bg-[var(--danger-dim)] text-[var(--danger)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--danger)]" />
                  )}
                  <Icon size={14} className="shrink-0" style={{ color: active ? "var(--danger)" : undefined }} />
                  <span className="font-ui text-sm font-semibold tracking-wide">{label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Status bar */}
      <div className="mx-3 mb-3 border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Zap size={10} className="text-[var(--neon)]" />
          <span className="font-display text-[11px] tracking-widest text-[var(--neon)] uppercase">Sistema Online</span>
        </div>
        <div className="h-1 bg-[var(--surface-1)] rounded-full overflow-hidden">
          <div className="h-full w-full bg-[var(--neon)] shadow-[0_0_6px_var(--neon)]" style={{ width: "92%" }} />
        </div>
      </div>

      {/* User */}
      <div className="border-t border-[var(--border)] p-3 space-y-2">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 border border-[var(--border-mid)] bg-[var(--neon-dim)] flex items-center justify-center shrink-0">
            <span className="font-display text-xs font-black text-[var(--neon)]">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-ui text-xs font-semibold text-[var(--text-bright)] truncate">{user.name}</div>
            <div className="font-mono text-[11px] text-[var(--text-muted)] truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="group w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-dim)] transition-all duration-150"
        >
          <LogOut size={12} />
          <span className="font-display text-[11px] uppercase tracking-widest">Sair</span>
        </button>
      </div>
    </aside>
  );
}
