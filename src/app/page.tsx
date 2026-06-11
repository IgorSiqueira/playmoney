import Link from "next/link";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "2.4K+",  label: "Jogadores" },
  { value: "R$1.2M", label: "Apostado" },
  { value: "98.3%",  label: "Uptime" },
  { value: "< 1s",   label: "Liquidação" },
];

const features = [
  {
    icon: "◈",
    title: "Dota 2",
    desc: "Conecte seu Steam ID. Apostas baseadas no seu MMR e histórico real de partidas.",
    color: "var(--neon)",
  },
  {
    icon: "◎",
    title: "Odds Reais",
    desc: "Calculadas via win rate + KDA das últimas 20 partidas. Sem achismo, só dados.",
    color: "var(--blue)",
  },
  {
    icon: "◇",
    title: "PIX Instantâneo",
    desc: "Depósito e saque via PIX. Saldo disponível em segundos para apostar.",
    color: "var(--gold)",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[var(--neon)] opacity-[0.04] blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[var(--blue)] opacity-[0.03] blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-[var(--neon)] bg-[var(--neon-dim)] flex items-center justify-center">
            <span className="font-display text-sm font-black text-[var(--neon)]">P</span>
          </div>
          <span className="font-display text-sm font-black tracking-[0.2em] text-[var(--text-bright)] uppercase">
            Play<span className="text-[var(--neon)]">Money</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Criar Conta</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 border border-[var(--border-mid)] bg-[var(--neon-dim)] px-4 py-1.5 mb-8 animate-glow-in">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon)] pulse-neon" />
          <span className="font-display text-[10px] tracking-[0.25em] text-[var(--neon)] uppercase">
            Plataforma Ativa · Beta
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-black uppercase leading-none mb-6 animate-glow-in anim-delay-1">
          <div className="text-5xl md:text-7xl text-[var(--text-bright)] tracking-tighter">
            Aposte em
          </div>
          <div
            className="text-6xl md:text-8xl tracking-tighter neon-text"
            style={{ textShadow: "0 0 40px rgba(0,255,157,0.5), 0 0 80px rgba(0,255,157,0.2)" }}
          >
            Você Mesmo
          </div>
        </h1>

        <p className="font-ui text-lg text-[var(--text-muted)] max-w-lg mb-10 tracking-wide animate-glow-in anim-delay-2">
          Conecte seu perfil de jogo. Veja suas odds baseadas no seu desempenho real.
          Aposte contra a casa — e prove que você é bom.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-4 mb-16 animate-glow-in anim-delay-3">
          <Button asChild size="lg">
            <Link href="/register">Entrar na Arena</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Já tenho conta</Link>
          </Button>
        </div>

        {/* Stats bar */}
        <div className="w-full max-w-2xl border border-[var(--border)] bg-[var(--surface-2)] grid grid-cols-4 divide-x divide-[var(--border)] animate-glow-in anim-delay-4">
          {stats.map((s) => (
            <div key={s.label} className="py-4 text-center">
              <div className="font-mono text-lg font-bold text-[var(--neon)]" style={{ textShadow: "0 0 10px rgba(0,255,157,0.4)" }}>
                {s.value}
              </div>
              <div className="font-display text-[9px] tracking-widest text-[var(--text-muted)] uppercase mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Features */}
      <section className="relative z-10 px-6 py-16 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <div className="font-display text-[10px] tracking-[0.3em] text-[var(--text-muted)] text-center uppercase mb-10">
            ▸ Como Funciona
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] p-6 hover:border-[var(--border-mid)] transition-all duration-200 group"
                style={{ "--bracket-color": f.color } as React.CSSProperties}
              >
                <div
                  className="text-3xl mb-4 font-display font-black"
                  style={{ color: f.color, textShadow: `0 0 15px ${f.color}` }}
                >
                  {f.icon}
                </div>
                <div className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-bright)] mb-2">
                  {f.title}
                </div>
                <p className="font-ui text-sm text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)] px-8 py-4 flex items-center justify-between">
        <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest">
          © 2026 PLAYMONEY
        </span>
        <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest">
          APOSTE COM RESPONSABILIDADE
        </span>
      </footer>
    </div>
  );
}
