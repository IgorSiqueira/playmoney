import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DOTA = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes";

const betCards = [
  {
    hero: "invoker",
    name: "Invoker",
    type: "Vitória",
    stake: "R$ 150",
    payout: "R$ 315",
    odds: "2.10x",
    kda: "4.8",
    wr: "52%",
    color: "#0080ff",
    shadow: "rgba(0,128,255,0.4)",
    status: "ATIVA",
    floatClass: "animate-float-1",
  },
  {
    hero: "phantom_assassin",
    name: "Phantom Assassin",
    type: "KDA Over 5.0",
    stake: "R$ 200",
    payout: "R$ 360",
    odds: "1.80x",
    kda: "6.2",
    wr: "48%",
    color: "#9d4edd",
    shadow: "rgba(157,78,221,0.4)",
    status: "ATIVA",
    floatClass: "animate-float-2",
  },
  {
    hero: "axe",
    name: "Axe",
    type: "Vitória",
    stake: "R$ 100",
    payout: "R$ 155",
    odds: "1.55x",
    kda: "3.4",
    wr: "58%",
    color: "#ff3a6e",
    shadow: "rgba(255,58,110,0.4)",
    status: "PAGA",
    floatClass: "animate-float-3",
  },
];

const steps = [
  {
    n: "01",
    title: "Conecte o Steam",
    desc: "Cole seu Steam ID. Buscamos seu histórico real das últimas 20 partidas via OpenDota.",
    color: "var(--neon)",
  },
  {
    n: "02",
    title: "Veja suas Odds",
    desc: "Calculadas do seu win rate + KDA reais. Cada jogador tem odds únicas. Cap de 1.80x.",
    color: "var(--gold)",
  },
  {
    n: "03",
    title: "Aposte & Liquide",
    desc: "Jogue sua partida. Informe o Match ID. PIX disponível em segundos.",
    color: "var(--blue)",
  },
];

const betTypes = [
  { icon: "⚔", label: "Vitória", desc: "Você vence a próxima partida?", color: "var(--neon)" },
  { icon: "◎", label: "KDA", desc: "Mata + assists / mortes — acima ou abaixo da sua média", color: "var(--gold)" },
  { icon: "◈", label: "GPM", desc: "Ouro por minuto — meça sua eficiência econômica", color: "var(--blue)" },
  { icon: "◇", label: "Last Hits", desc: "Creeps abatidos no final da partida", color: "var(--purple)" },
];

const stats = [
  { value: "2.4K+", label: "Jogadores" },
  { value: "R$1.2M", label: "Apostado" },
  { value: "1.80x", label: "Odds máximas" },
  { value: "< 1s", label: "Liquidação" },
];

const faqs = [
  {
    q: "Como as odds são calculadas?",
    a: "Usamos seu win rate e KDA médio das últimas 20 partidas via OpenDota API. As odds são atualizadas a cada sincronização do perfil e têm cap máximo de 1.80x para todos os jogadores.",
  },
  {
    q: "Posso apostar jogando em group (party)?",
    a: "A plataforma é projetada para apostas solo. Se detectarmos algum jogador do seu histórico no seu time na partida submetida, a aposta é automaticamente cancelada e o valor integralmente devolvido.",
  },
  {
    q: "Como funciona o saque?",
    a: "Saques via PIX a partir de R$ 20. Processado em até 5 minutos após solicitação, sem taxas.",
  },
  {
    q: "O sistema é justo?",
    a: "Odds 100% algorítmicas, baseadas nos seus dados públicos do Dota 2. Nenhuma manipulação manual. O mesmo algoritmo se aplica a todos os jogadores.",
  },
  {
    q: "Meu perfil Steam precisa ser público?",
    a: "Sim. O perfil precisa estar público para que o OpenDota consiga acessar o histórico de partidas.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-[var(--bg)]">

      {/* ── Ambient glows ─────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[var(--neon)] opacity-[0.05] blur-[140px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[#9d4edd] opacity-[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-[var(--neon)] opacity-[0.03] blur-[100px]" />
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-[var(--neon)] bg-[var(--neon-dim)] flex items-center justify-center">
            <span className="font-display text-sm font-black text-[var(--neon)]">P</span>
          </div>
          <span className="font-display text-sm font-black tracking-[0.2em] text-[var(--text-bright)] uppercase">
            Play<span className="text-[var(--neon)]">Money</span>
          </span>
          <div className="hidden md:flex items-center gap-1 ml-2 px-2 py-0.5 border border-[var(--border)] bg-[var(--neon-dim)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon)] pulse-neon" />
            <span className="font-display text-[9px] tracking-[0.2em] text-[var(--neon)] uppercase">Dota 2</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a href="#como-funciona" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Como funciona</a>
          <a href="#modalidades" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Modalidades</a>
          <a href="#faq" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Criar Conta</Link>
          </Button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex-1 flex items-center min-h-[calc(100vh-65px)]">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — text */}
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-2 border border-[var(--border-mid)] bg-[var(--neon-dim)] px-4 py-1.5 mb-8 animate-glow-in">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon)] pulse-neon" />
              <span className="font-display text-[10px] tracking-[0.25em] text-[var(--neon)] uppercase">
                Plataforma Ativa · Beta Aberto
              </span>
            </div>

            <h1 className="font-display font-black uppercase leading-none mb-6 animate-glow-in anim-delay-1">
              <div className="text-4xl md:text-6xl text-[var(--text-bright)] tracking-tighter">
                Aposte em
              </div>
              <div
                className="text-5xl md:text-7xl tracking-tighter neon-text"
                style={{ textShadow: "0 0 40px rgba(0,128,255,0.6), 0 0 80px rgba(0,128,255,0.25)" }}
              >
                Você Mesmo
              </div>
              <div className="text-2xl md:text-3xl text-[var(--text-muted)] tracking-tight mt-1">
                no Dota 2
              </div>
            </h1>

            <p className="font-ui text-lg text-[var(--text)] max-w-md mb-8 leading-relaxed animate-glow-in anim-delay-2">
              Conecte seu Steam ID. Suas odds são calculadas do seu <span className="text-[var(--text-bright)]">histórico real</span> de partidas.
              Aposte contra a casa e prove que você é bom.
            </p>

            <div className="flex items-center gap-3 mb-10 animate-glow-in anim-delay-3">
              <Button asChild size="lg">
                <Link href="/register">Começar Agora</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-4 animate-glow-in anim-delay-4">
              {[
                { icon: "◈", text: "PIX instantâneo" },
                { icon: "◎", text: "Odds algorítmicas" },
                { icon: "◇", text: "Anti-fraude ativo" },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-1.5">
                  <span className="text-[var(--neon)] text-xs">{b.icon}</span>
                  <span className="font-ui text-xs text-[var(--text-muted)]">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating bet cards */}
          <div className="hidden lg:block relative h-[460px]">
            {betCards.map((card, i) => (
              <div
                key={card.hero}
                className={`absolute w-[272px] ${card.floatClass}`}
                style={{
                  top: `${i * 90}px`,
                  left: `${i * 36}px`,
                  zIndex: 3 - i,
                  animationDelay: `${i * 0.8}s`,
                }}
              >
                <div
                  className="border bg-[var(--surface-2)] overflow-hidden"
                  style={{
                    borderColor: card.color,
                    boxShadow: `0 0 20px ${card.shadow}, 0 0 60px ${card.shadow.replace("0.4", "0.1")}`,
                  }}
                >
                  {/* Hero image */}
                  <div className="relative h-[110px] overflow-hidden">
                    <Image
                      src={`${DOTA}/${card.hero}.png`}
                      alt={card.name}
                      fill
                      className="object-cover object-top"
                      sizes="272px"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to bottom, transparent 40%, ${card.color}22 100%)`,
                      }}
                    />
                    {/* Status badge */}
                    <div
                      className="absolute top-2 right-2 px-2 py-0.5"
                      style={{
                        background: card.status === "PAGA" ? "rgba(0,255,100,0.15)" : `${card.color}22`,
                        border: `1px solid ${card.status === "PAGA" ? "rgba(0,255,100,0.4)" : card.color}`,
                      }}
                    >
                      <span
                        className="font-display text-[9px] tracking-widest font-bold"
                        style={{ color: card.status === "PAGA" ? "#00ff64" : card.color }}
                      >
                        {card.status}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-display text-[10px] tracking-widest text-[var(--text-muted)] uppercase">{card.name}</div>
                        <div className="font-display text-xs font-bold text-[var(--text-bright)] uppercase tracking-wide">{card.type}</div>
                      </div>
                      <div
                        className="font-mono text-lg font-bold"
                        style={{ color: card.color, textShadow: `0 0 12px ${card.shadow}` }}
                      >
                        {card.odds}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                      <div className="text-center">
                        <div className="font-display text-[9px] tracking-widest text-[var(--text-muted)] uppercase">Aposta</div>
                        <div className="font-mono text-sm text-[var(--text)]">{card.stake}</div>
                      </div>
                      <div style={{ color: card.color }} className="text-sm font-mono">→</div>
                      <div className="text-center">
                        <div className="font-display text-[9px] tracking-widest text-[var(--text-muted)] uppercase">Retorno</div>
                        <div className="font-mono text-sm font-bold" style={{ color: card.color }}>{card.payout}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-display text-[9px] tracking-widest text-[var(--text-muted)] uppercase">Win Rate</div>
                        <div className="font-mono text-sm text-[var(--text)]">{card.wr}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <div className="relative z-10 border-y border-[var(--border)] bg-[var(--surface-2)]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--border)]">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="py-5 text-center animate-glow-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className="font-mono text-2xl font-bold text-[var(--neon)]"
                style={{ textShadow: "0 0 12px rgba(0,128,255,0.5)" }}
              >
                {s.value}
              </div>
              <div className="font-display text-[9px] tracking-[0.25em] text-[var(--text-muted)] uppercase mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Como Funciona ──────────────────────────────────────────────── */}
      <section id="como-funciona" className="relative z-10 px-6 md:px-10 py-20 border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="font-display text-[10px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ Como funciona</div>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-bright)] uppercase tracking-tight">
              Três passos para apostar
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[52px] left-[calc(16.66%+1px)] right-[calc(16.66%+1px)] h-px bg-[var(--border-mid)]" />

            {steps.map((s, i) => (
              <div key={s.n} className="bracket relative p-8 text-center group" style={{ "--bracket-color": s.color } as React.CSSProperties}>
                {/* Number circle */}
                <div
                  className="relative z-10 w-[52px] h-[52px] mx-auto mb-6 flex items-center justify-center border-2"
                  style={{
                    borderColor: s.color,
                    background: `${s.color}18`,
                    boxShadow: `0 0 16px ${s.color}40`,
                  }}
                >
                  <span
                    className="font-display font-black text-sm"
                    style={{ color: s.color }}
                  >
                    {s.n}
                  </span>
                </div>
                <h3
                  className="font-display font-bold text-sm uppercase tracking-widest mb-3"
                  style={{ color: s.color }}
                >
                  {s.title}
                </h3>
                <p className="font-ui text-sm text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modalidades de aposta ───────────────────────────────────────── */}
      <section id="modalidades" className="relative z-10 px-6 md:px-10 py-20 border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="font-display text-[10px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ Modalidades</div>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-bright)] uppercase tracking-tight">
              O que você pode apostar
            </h2>
            <p className="font-ui text-base text-[var(--text-muted)] mt-4 max-w-lg mx-auto">
              Todas as apostas são baseadas no seu histórico real. Odds únicas para cada jogador.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {betTypes.map((b) => (
              <div
                key={b.label}
                className="bracket relative border border-[var(--border)] bg-[var(--surface-2)] p-6 hover:border-[var(--border-mid)] transition-all duration-200 group cursor-default"
                style={{ "--bracket-color": b.color } as React.CSSProperties}
              >
                <div
                  className="text-3xl mb-4 font-display font-black"
                  style={{ color: b.color, textShadow: `0 0 16px ${b.color}` }}
                >
                  {b.icon}
                </div>
                <div className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-bright)] mb-2">
                  {b.label}
                </div>
                <p className="font-ui text-sm text-[var(--text-muted)] leading-relaxed">{b.desc}</p>
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${b.color}, transparent)` }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dota 2 hero showcase strip ─────────────────────────────────── */}
      <section className="relative z-10 py-16 border-b border-[var(--border)] overflow-hidden">
        <div className="font-display text-[10px] tracking-[0.3em] text-[var(--text-muted)] uppercase text-center mb-8">
          ▸ Conecte seu herói favorito
        </div>
        <div className="flex items-center justify-center gap-4 px-6 flex-wrap">
          {["invoker", "pudge", "crystal_maiden", "phantom_assassin", "axe", "juggernaut", "lion", "anti_mage"].map((hero) => (
            <div
              key={hero}
              className="relative w-[72px] h-[72px] border border-[var(--border)] overflow-hidden hover:border-[var(--neon)] transition-colors duration-200 group"
            >
              <Image
                src={`${DOTA}/${hero}.png`}
                alt={hero}
                fill
                className="object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-300"
                sizes="72px"
              />
              <div className="absolute inset-0 bg-[var(--neon)] opacity-0 group-hover:opacity-[0.06] transition-opacity duration-200" />
            </div>
          ))}
          <div className="w-[72px] h-[72px] border border-dashed border-[var(--border)] flex items-center justify-center">
            <span className="font-display text-xs text-[var(--text-muted)]">+100</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 px-6 md:px-10 py-20 border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="font-display text-[10px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ Perguntas frequentes</div>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-bright)] uppercase tracking-tight">
              FAQ
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-mid)] transition-colors duration-150"
              >
                <summary className="flex items-center justify-between px-6 py-4 gap-4">
                  <span className="font-display text-sm font-bold uppercase tracking-wide text-[var(--text-bright)]">
                    {faq.q}
                  </span>
                  <span className="faq-chevron font-mono text-[var(--neon)] text-sm shrink-0">▾</span>
                </summary>
                <div className="px-6 pb-5 border-t border-[var(--border)]">
                  <p className="font-ui text-sm text-[var(--text-muted)] leading-relaxed pt-4">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[300px] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,128,255,0.08) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10">
            <div className="font-display text-[10px] tracking-[0.3em] text-[var(--neon)] uppercase mb-4">▸ Comece agora</div>
            <h2 className="font-display font-black text-4xl md:text-5xl text-[var(--text-bright)] uppercase tracking-tight mb-6 leading-tight">
              Você está pronto<br />
              <span className="neon-text">para apostar em si mesmo?</span>
            </h2>
            <p className="font-ui text-lg text-[var(--text-muted)] mb-10 max-w-lg mx-auto leading-relaxed">
              Crie sua conta, conecte o Steam e veja suas odds em menos de 2 minutos.
              Primeiro depósito com bônus de 50%.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button asChild size="lg">
                <Link href="/register">Criar Conta Grátis</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Já tenho conta →</Link>
              </Button>
            </div>
            <p className="font-ui text-xs text-[var(--text-muted)] mt-6">
              Bônus de 50% no primeiro depósito · Mínimo R$ 20 · Máximo R$ 50
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[var(--border)] px-6 md:px-10 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border border-[var(--neon)] bg-[var(--neon-dim)] flex items-center justify-center">
              <span className="font-display text-[10px] font-black text-[var(--neon)]">P</span>
            </div>
            <span className="font-display text-xs font-black tracking-[0.2em] text-[var(--text-muted)] uppercase">
              Play<span className="text-[var(--neon)]">Money</span>
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">© 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Entrar</Link>
            <Link href="/register" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Cadastrar</Link>
            <a href="#faq" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">FAQ</a>
          </div>

          <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
            Jogue com responsabilidade · +18
          </span>
        </div>
      </footer>
    </div>
  );
}
