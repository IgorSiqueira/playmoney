import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Campeonato SkillMoney",
  description: "Cada jogador começa com R$ 2.100. 30 dias pra jogar. Quem acumular mais patrimônio leva o prêmio em dinheiro.",
};

const rules = [
  { title: "Saldo inicial", desc: "Todo participante começa o campeonato com R$ 2.100 na carteira." },
  { title: "Duração", desc: "O campeonato dura 30 dias corridos a partir da sua inscrição." },
  { title: "Critério de vitória", desc: "Vence quem terminar o período com o maior patrimônio total (saldo em carteira)." },
  { title: "Premiação", desc: "O grande campeão recebe um prêmio em dinheiro real. Valor anunciado em breve." },
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
                  Todo jogador começa com <strong className="text-[var(--text-bright)]">R$ 2.100</strong>. São <strong className="text-[var(--text-bright)]">30 dias</strong> pra jogar.
                  Quem acumular mais patrimônio no final é o grande campeão — e leva um <strong className="text-[var(--text-bright)]">prêmio em dinheiro real</strong>.
                </p>
                <Button asChild size="lg">
                  <Link href="/register">Quero participar →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
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
