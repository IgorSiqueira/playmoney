"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "campeonato-modal-dismissed";
const YOUTUBE_VIDEO_ID = "4lRZ4Z6o-6U";

export function ChampionshipModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(DISMISS_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* sessionStorage indisponível — só fecha, sem persistir */
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] animate-glow-in" role="dialog" aria-modal="true">
      <Image
        src="/campeonato-hero-bg.webp"
        alt="Campeonato SkillMoney — cenário de batalha do Dota 2"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/80 to-transparent" />

      <button
        type="button"
        onClick={close}
        aria-label="Fechar"
        className="absolute top-5 right-5 md:top-8 md:right-8 z-20 w-10 h-10 flex items-center justify-center border border-[var(--border-mid)] bg-[var(--bg)]/70 text-[var(--text-muted)] hover:text-[var(--text-bright)] hover:border-[var(--neon)] transition-colors"
      >
        <X size={18} />
      </button>

      <div className="relative z-10 h-full flex flex-col lg:flex-row items-center gap-8 lg:gap-6 px-6 md:px-16 py-20 lg:py-0 overflow-y-auto">
        {/* Coluna esquerda — texto (50%) */}
        <div className="w-full lg:w-1/2 max-w-xl">
          <div className="font-display text-[11px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ Evento especial</div>
          <h2 className="font-display font-black text-4xl md:text-6xl text-[var(--text-bright)] uppercase tracking-tight mb-4 leading-tight">
            Campeonato <span className="neon-text">SkillMoney</span>
          </h2>
          <p className="font-ui text-base md:text-lg text-[var(--text)] mb-6 leading-relaxed">
            Todo jogador começa com <strong className="text-[var(--text-bright)]">R$ 2.100</strong>. São <strong className="text-[var(--text-bright)]">30 dias</strong> pra jogar.
            Quem acumular mais patrimônio no final leva o <strong className="text-[var(--text-bright)]">prêmio em dinheiro real</strong>.
          </p>

          <div className="flex items-center gap-6 mb-8 flex-wrap">
            {[
              { label: "Saldo inicial", value: "R$ 2.100" },
              { label: "Duração", value: "30 dias" },
              { label: "Premiação", value: "Em breve" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                {i > 0 && <div className="hidden sm:block w-px h-10 bg-[var(--border)]" />}
                <div>
                  <div className="font-mono text-xl font-bold text-[var(--neon)]" style={{ textShadow: "0 0 12px rgba(0,255,102,0.5)" }}>
                    {s.value}
                  </div>
                  <div className="font-display text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase mt-0.5">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-5 flex-wrap">
            <Button asChild size="lg">
              <Link href="/campeonato">Quero participar →</Link>
            </Button>
            <button
              type="button"
              onClick={close}
              className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>

        {/* Coluna direita — vídeo (50%) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="relative w-full max-w-3xl aspect-video border border-[var(--border-mid)] shadow-[0_0_50px_rgba(0,255,102,0.15)] overflow-hidden">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=1&rel=0`}
              title="Vídeo do Campeonato SkillMoney"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}
