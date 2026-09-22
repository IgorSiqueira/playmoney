import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CountdownReveal } from "@/components/shared/countdown-reveal";

export const metadata = {
  title: "Campeonato SkillMoney",
  description: "Cada jogador começa com 2.100 fichas virtuais. 30 dias pra jogar. Quem terminar com o maior saldo leva o prêmio em dinheiro.",
};

const rules = [
  { title: "Saldo inicial", desc: "2.100 fichas virtuais por participante." },
  { title: "Início", desc: "01/11 às 14h." },
  { title: "Encerramento", desc: "30/11 às 14h." },
  { title: "Duração", desc: "30 dias." },
  { title: "Mínimo de partidas", desc: "30 partidas válidas." },
  { title: "Máximo de partidas contabilizadas", desc: "50 partidas válidas." },
  { title: "Partidas 1–15", desc: "Máximo de 40 fichas por aposta." },
  { title: "Partidas 16–30", desc: "Máximo de 70 fichas por aposta." },
  { title: "Partidas 31–50", desc: "Máximo de 100 fichas por aposta." },
  { title: "Aposta mínima", desc: "1 ficha." },
  { title: "Modalidade", desc: "Partidas ranqueadas individuais." },
  { title: "Apostas", desc: "Simples ou combinadas, conforme disponibilidade da plataforma." },
  { title: "Classificação", desc: "Maior saldo final de fichas." },
  { title: "Critério de empate", desc: "Soma dos prêmios das posições empatadas e divisão igual entre os participantes empatados." },
];

export default function CampeonatoPage() {
  return (
    <div className="relative min-h-screen bg-[var(--bg)]">
      <section className="relative border-b border-[var(--border)] overflow-hidden">
        <div className="relative w-full min-h-[420px] md:min-h-0 md:aspect-[1774/887]">
          <Image
            src="/campeonato-hero-bg.webp"
            alt="Campeonato SkillMoney — cenário de batalha do Dota 2"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/80 to-transparent" />

          <div className="absolute inset-0 flex items-center py-14 md:py-0">
            <div className="w-full max-w-7xl mx-auto px-6 md:px-10">
              <Link href="/" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-6 inline-block">
                ← Voltar para o início
              </Link>
              <div className="max-w-xl">
                <div className="font-display text-[11px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ Evento especial</div>
                <h1 className="font-display font-black text-3xl md:text-5xl text-[var(--text-bright)] uppercase tracking-tight mb-4 leading-tight">
                  Campeonato <span className="neon-text">SkillMoney</span>
                </h1>
                <p className="font-ui text-base md:text-lg text-[var(--text)] mb-8 leading-relaxed">
                  Todo jogador começa com <strong className="text-[var(--text-bright)]">2.100 fichas virtuais</strong>. São <strong className="text-[var(--text-bright)]">30 dias</strong> pra jogar.
                  Quem terminar com o maior saldo de fichas é o grande campeão — e leva um <strong className="text-[var(--text-bright)]">prêmio em dinheiro real</strong>.
                </p>
                <Button asChild size="lg">
                  <Link href="/register">Quero participar →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 md:px-10 pt-14 md:pt-16">
        <CountdownReveal />
      </section>

      <section className="max-w-3xl mx-auto px-6 md:px-10 py-16">
        <div className="font-display text-[11px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ Como funciona</div>
        <h2 className="font-display font-black text-2xl text-[var(--text-bright)] uppercase tracking-tight mb-8">
          Regras do campeonato
        </h2>

        <div className="space-y-4">
          {rules.map((r) => (
            <div key={r.title} className="border border-[var(--border)] bg-[var(--surface-2)] p-5">
              <div className="font-ui text-sm font-semibold text-[var(--text-bright)] mb-1">{r.title}</div>
              <p className="font-ui text-sm text-[var(--text-muted)] leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        <p className="font-ui text-xs text-[var(--text-muted)] mt-8">
          O campeonato segue os <Link href="/termos" className="underline hover:text-[var(--neon)]">Termos de Uso</Link> da plataforma.
          Regras detalhadas de elegibilidade e critérios de desempate serão publicadas antes do início.
        </p>
      </section>
    </div>
  );
}
