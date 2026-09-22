"use client";

import { useEffect, useState } from "react";

const TARGET_DATE = new Date("2026-11-01T14:00:00-03:00").getTime();

function getTimeLeft() {
  const diff = TARGET_DATE - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownReveal() {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft());
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const revealed = mounted && timeLeft === null;
  const units = [
    { label: "Dias", value: timeLeft?.days ?? 0 },
    { label: "Horas", value: timeLeft?.hours ?? 0 },
    { label: "Min", value: timeLeft?.minutes ?? 0 },
    { label: "Seg", value: timeLeft?.seconds ?? 0 },
  ];

  return (
    <div className="bracket relative border-2 border-[var(--neon)] bg-[var(--surface-2)] overflow-hidden pulse-neon">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon)]/10 via-transparent to-transparent" aria-hidden />

      <div className="relative p-6 md:p-12 text-center">
        <div className="font-display text-[11px] md:text-xs font-bold tracking-[0.3em] text-[var(--neon)] uppercase mb-4">
          ▸ {revealed ? "🎉 Premiação revelada" : "A premiação em R$ será revelada em"}
        </div>

        {revealed ? (
          <div className="font-display font-black text-4xl md:text-6xl neon-text uppercase tracking-tight animate-glow-in">
            Em breve
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-8 flex-nowrap">
            {units.map((u, i) => (
              <div key={u.label} className="flex items-center gap-2 sm:gap-4 md:gap-8">
                <div className="flex flex-col items-center min-w-[54px] sm:min-w-[72px] md:min-w-[96px]">
                  <div
                    className="font-mono font-black text-3xl sm:text-5xl md:text-7xl text-[var(--text-bright)] tabular-nums"
                    style={{ textShadow: "0 0 24px rgba(0,255,102,0.65)" }}
                  >
                    {mounted ? String(u.value).padStart(2, "0") : "--"}
                  </div>
                  <div className="font-display text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] text-[var(--text-muted)] uppercase mt-1">
                    {u.label}
                  </div>
                </div>
                {i < units.length - 1 && (
                  <div className="font-mono font-black text-2xl sm:text-4xl md:text-6xl text-[var(--neon)] opacity-40 -mt-4">:</div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="font-ui text-xs md:text-sm text-[var(--text-muted)] mt-6">
          01/11 às 14h — o valor do prêmio em dinheiro real é anunciado neste exato momento.
        </p>
      </div>
    </div>
  );
}
