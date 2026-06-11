"use client";

const entries = [
  { user: "inv0k3r777",   hero: "Invoker",           type: "Vitória",           amount: 150, payout: 255,  odds: "1.70x", won: true  },
  { user: "pa_carry",     hero: "Phantom Assassin",  type: "KDA Over 5.0",      amount: 200, payout: 360,  odds: "1.80x", won: true  },
  { user: "axe_mid",      hero: "Axe",               type: "Vitória",           amount: 100, payout: 155,  odds: "1.55x", won: false },
  { user: "crystal4lyfe", hero: "Crystal Maiden",    type: "GPM Over 580",      amount: 300, payout: 516,  odds: "1.72x", won: true  },
  { user: "pudge_hook",   hero: "Pudge",             type: "Vitória",           amount: 80,  payout: 112,  odds: "1.40x", won: true  },
  { user: "lion_mid",     hero: "Lion",              type: "Last Hits Over 200",amount: 250, payout: 420,  odds: "1.68x", won: true  },
  { user: "jugg_spin",    hero: "Juggernaut",        type: "Vitória",           amount: 500, payout: 790,  odds: "1.58x", won: false },
  { user: "storm_s",      hero: "Storm Spirit",      type: "KDA Over 4.0",     amount: 120, payout: 174,  odds: "1.45x", won: true  },
  { user: "sf_mid",       hero: "Shadow Fiend",      type: "Vitória",           amount: 400, payout: 672,  odds: "1.68x", won: true  },
  { user: "ember_w",      hero: "Ember Spirit",      type: "KDA Over 6.0",      amount: 180, payout: 324,  odds: "1.80x", won: true  },
];

// duplicate for seamless loop
const doubled = [...entries, ...entries];

export function BetTicker() {
  return (
    <div className="relative z-20 overflow-hidden border-b border-[var(--border)] bg-[var(--surface-1)] h-9 flex items-center">
      {/* left fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10"
           style={{ background: "linear-gradient(to right, var(--surface-1), transparent)" }} />
      {/* right fade */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10"
           style={{ background: "linear-gradient(to left, var(--surface-1), transparent)" }} />

      {/* label */}
      <div className="absolute left-0 z-20 flex items-center h-full px-3 border-r border-[var(--border)] bg-[var(--surface-1)]">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon)] pulse-neon" />
          <span className="font-display text-[11px] tracking-[0.2em] text-[var(--neon)] uppercase whitespace-nowrap">Ao Vivo</span>
        </div>
      </div>

      <div className="ticker-track pl-32">
        {doubled.map((e, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-6 whitespace-nowrap">
            <span className="font-display text-[11px] tracking-widest text-[var(--text-muted)] uppercase">
              @{e.user}
            </span>
            <span className="font-display text-[11px] text-[var(--text)] uppercase tracking-wide">
              {e.hero}
            </span>
            <span className="font-ui text-[10px] text-[var(--text-muted)]">·</span>
            <span className="font-ui text-[10px] text-[var(--text)]">{e.type}</span>
            <span className="font-ui text-[10px] text-[var(--text-muted)]">·</span>
            <span className="font-mono text-[10px] text-[var(--neon)]">R${e.amount}</span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">→</span>
            <span className={`font-mono text-[10px] font-bold ${e.won ? "text-[#00ff7f]" : "text-[var(--danger)]"}`}>
              {e.won ? `R$${e.payout}` : "PERDEU"}
            </span>
            <span className={`font-display text-[11px] tracking-widest px-1.5 py-0.5 border ${
              e.won
                ? "text-[#00ff7f] border-[rgba(0,255,127,0.3)] bg-[rgba(0,255,127,0.07)]"
                : "text-[var(--danger)] border-[rgba(255,58,110,0.3)] bg-[rgba(255,58,110,0.07)]"
            }`}>
              {e.won ? "GANHOU" : "PERDEU"}
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">{e.odds}</span>
            <span className="text-[var(--border-mid)] mx-2">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
