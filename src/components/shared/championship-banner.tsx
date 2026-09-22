import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ChampionshipBanner() {
  return (
    <section className="relative border border-[var(--border)] overflow-hidden">
      <div className="relative w-full min-h-[220px] md:min-h-0 md:aspect-[2000/667]">
        <Image
          src="/campeonato-dashboard-bg.webp"
          alt="Campeonato SkillMoney — cenário de batalha do Dota 2"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/75 to-transparent" />

        <div className="absolute inset-0 flex items-center py-6 px-6 md:px-10">
          <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="max-w-md">
              <div className="font-display text-[10px] tracking-[0.3em] text-[var(--neon)] uppercase mb-1.5">▸ Evento especial</div>
              <h2 className="font-display font-black text-xl md:text-2xl text-[var(--text-bright)] uppercase tracking-tight mb-1.5">
                Campeonato <span className="neon-text">SkillMoney</span>
              </h2>
              <p className="font-ui text-xs md:text-sm text-[var(--text-muted)] leading-relaxed">
                R$ 2.100 pra cada jogador · 30 dias · quem acumular mais patrimônio leva o prêmio em dinheiro.
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0 w-fit">
              <Link href="/campeonato">Saiba mais →</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
