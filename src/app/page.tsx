import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ParticlesBackground } from "@/components/ParticlesBackground";
import {
  Target, BarChart3, ShieldCheck, Gamepad2,
  TrendingUp, Trophy, Users, Clock,
} from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Target,
    title: "Conecte o Steam",
    desc: "Cole seu Steam ID e buscamos seu histórico real de partidas.",
  },
  {
    n: "02",
    icon: BarChart3,
    title: "Veja suas Odds",
    desc: "Calculadas do seu win rate e KDA reais, não de tabela genérica.",
  },
  {
    n: "03",
    icon: Gamepad2,
    title: "Jogue sua Partida",
    desc: "Escolha vitória, KDA, GPM ou last hits antes de começar.",
  },
  {
    n: "04",
    icon: ShieldCheck,
    title: "Liquidação Automática",
    desc: "O sistema busca o resultado sozinho e paga via PIX em segundos.",
  },
];

const benefits = [
  { icon: TrendingUp, title: "Odds sob medida", desc: "Nada de tabela fixa. Suas odds nascem do seu próprio desempenho." },
  { icon: Users, title: "Comunidade de jogadores reais", desc: "Sem bots, sem manipulação. Só gente que joga de verdade." },
  { icon: Clock, title: "Liquidação em segundos", desc: "Resultado sai, seu saldo já reflete. PIX instantâneo, sem fila." },
  { icon: Trophy, title: "Foco em performance real", desc: "Quanto melhor você joga, mais suas odds trabalham a seu favor." },
];

const stats = [
  { value: "2.4K+", label: "Jogadores ativos" },
  { value: "R$1.2M", label: "Apostado na plataforma" },
  { value: "1.80x", label: "Odds máximas" },
  { value: "<1s", label: "Tempo de liquidação" },
];

const testimonials = [
  {
    quote: "Finalmente uma plataforma que calcula odds a partir do meu histórico de verdade. Nada de número genérico.",
    name: "Lucas “Night”",
    rank: "Dota 2 — Immortal",
    avatar: "https://i.pravatar.cc/100?img=12",
  },
  {
    quote: "Apostei na minha própria vitória, ganhei, e o PIX caiu antes de eu sair do pós-jogo. Simples assim.",
    name: "Mariana “Mika”",
    rank: "Dota 2 — Ancient",
    avatar: "https://i.pravatar.cc/100?img=47",
  },
  {
    quote: "Já testei várias casas de aposta. Essa é a única que recompensa quem realmente joga bem.",
    name: "Rafael “Rafão”",
    rank: "Dota 2 — Legend",
    avatar: "https://i.pravatar.cc/100?img=33",
  },
];

const faqs = [
  {
    q: "Como as odds são calculadas?",
    a: "Usamos seu win rate e KDA médio das últimas 50 partidas via OpenDota API. As odds são atualizadas a cada sincronização do perfil e têm cap máximo de 1.80x para todos os jogadores.",
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

      {/* ── Particles + ambient glows ─────────────────────────────────── */}
      <ParticlesBackground />
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[var(--neon)] opacity-[0.05] blur-[140px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[#9d4edd] opacity-[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-[var(--neon)] opacity-[0.03] blur-[100px]" />
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="SkillMoney" className="w-full h-full object-contain" />
          </div>
          <span className="font-display text-sm font-black tracking-[0.2em] text-[var(--text-bright)] uppercase">
            Skill<span className="text-[var(--neon)]">Money</span>
          </span>
        </div>

        <div className="hidden xl:flex items-center gap-6">
          <a href="#como-funciona" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Como funciona</a>
          <a href="#beneficios" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Benefícios</a>
          <a href="#depoimentos" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Depoimentos</a>
          <a href="#faq" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Comece agora →</Link>
          </Button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-b border-[var(--border)] overflow-hidden">
        <div className="relative w-full min-h-[560px] md:min-h-0 md:aspect-[2/1]">
          <Image
            src="/hero-bg.jpg"
            alt="Jogador de Dota 2 competindo na SkillMoney"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />

          <div className="absolute inset-0 z-10 flex items-center py-14 md:py-0">
            <div className="w-full max-w-7xl mx-auto px-6 md:px-10">
              <div className="flex flex-col items-start max-w-xl">
            <div className="font-display text-[11px] tracking-[0.3em] text-[var(--neon)] uppercase mb-4 animate-glow-in">
              Dados reais · Odds justas · Resultados
            </div>

            <h1 className="font-display font-black uppercase leading-none mb-6 animate-glow-in anim-delay-1">
              <div className="text-4xl md:text-6xl text-[var(--text-bright)] tracking-tighter">
                Aposte em
              </div>
              <div
                className="text-5xl md:text-7xl tracking-tighter neon-text glitch-text"
                data-text="Você Mesmo"
                style={{ textShadow: "0 0 40px rgba(0,255,102,0.6), 0 0 80px rgba(0,255,102,0.25)" }}
              >
                Você Mesmo
              </div>
              <div className="text-2xl md:text-3xl text-[var(--text-muted)] tracking-tight mt-1">
                no Dota 2
              </div>
            </h1>

            <p className="font-ui text-lg text-[var(--text)] max-w-md mb-3 leading-relaxed animate-glow-in anim-delay-2">
              Conecte seu Steam ID. Suas odds são calculadas do seu <span className="text-[var(--text-bright)]">histórico real</span> de partidas.
              Aposte contra a casa e prove que você é bom.
            </p>
            <p className="font-ui text-xs text-[var(--text-muted)] mb-8 animate-glow-in anim-delay-2">
              Mais que apostas. Um sistema justo para quem joga de verdade.
            </p>

            <div className="flex items-center gap-3 mb-10 animate-glow-in anim-delay-3">
              <Button asChild size="lg">
                <Link href="/register">Comece agora →</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-4 flex-wrap animate-glow-in anim-delay-4">
              {[
                { icon: "◈", text: "PIX instantâneo" },
                { icon: "◎", text: "Odds algorítmicas" },
                { icon: "◇", text: "Anti-fraude ativo" },
              ].map((b, i) => (
                <div key={b.text} className="flex items-center gap-4">
                  {i > 0 && <div className="hidden sm:block w-px h-8 bg-[var(--border)]" />}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--neon)] text-xs">{b.icon}</span>
                    <span className="font-ui text-xs text-[var(--text-muted)]">{b.text}</span>
                  </div>
                </div>
              ))}
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Como Funciona ──────────────────────────────────────────────── */}
      <section id="como-funciona" className="relative z-10 border-b border-[var(--border)] overflow-hidden">
        <div className="relative w-full min-h-[720px] md:min-h-0 md:aspect-[1774/887]">
          <Image
            src="/como-funciona-bg.jpg"
            alt="Aplicativo SkillMoney com painel de desempenho, ao lado de cenário de batalha do Dota 2"
            fill
            className="object-cover object-top"
            sizes="100vw"
          />

          <div className="absolute inset-0 flex items-center py-10 md:py-0">
            <div className="w-full max-w-7xl mx-auto px-6 md:px-10">
              <div className="md:ml-auto w-full md:w-[62%] lg:w-[56%]">
                <div className="font-display text-[11px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ Como funciona</div>
                <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[var(--text-bright)] uppercase tracking-tight mb-3 leading-tight">
                  Ganhar nunca foi <span className="neon-text">tão direto</span>
                </h2>
                <p className="font-ui text-sm md:text-base text-[var(--text-muted)] mb-6 md:mb-8 max-w-lg">
                  Conecte seu Steam, veja suas odds calculadas do seu histórico real e ganhe com base na sua própria performance.
                </p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {steps.map((s) => (
                    <div
                      key={s.n}
                      className="border border-[var(--border-mid)] bg-[var(--bg)]/60 backdrop-blur-sm p-3 md:p-4"
                    >
                      <div className="w-8 h-8 flex items-center justify-center border border-[var(--neon)] bg-[var(--neon-dim)] mb-2 md:mb-3">
                        <s.icon size={14} className="text-[var(--neon)]" />
                      </div>
                      <div className="font-display text-[10px] font-black text-[var(--text-muted)] mb-1">{s.n}</div>
                      <div className="font-display text-xs font-bold uppercase tracking-wide text-[var(--text-bright)] mb-1">
                        {s.title}
                      </div>
                      <p className="font-ui text-[11px] text-[var(--text-muted)] leading-snug hidden sm:block">
                        {s.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefícios ────────────────────────────────────────────────── */}
      <section id="beneficios" className="relative z-10 border-b border-[var(--border)] overflow-hidden">
        <div className="relative w-full min-h-[720px] md:min-h-0 md:aspect-[1774/887]">
          <Image
            src="/beneficios-bg.jpg"
            alt="Guerreiro do Dota 2 em cenário de batalha"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/60 to-transparent" />

          <div className="absolute inset-0 flex items-center py-10 md:py-0">
            <div className="w-full max-w-7xl mx-auto px-6 md:px-10">
              <div className="w-full md:w-[58%] lg:w-[50%]">
                <div className="font-display text-[11px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ Mais que apostas</div>
                <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-bright)] uppercase tracking-tight mb-4">
                  Um sistema justo
                </h2>
                <p className="font-ui text-base text-[var(--text-muted)] mb-8 leading-relaxed max-w-md">
                  A SkillMoney nasceu para quem acredita que a verdadeira vantagem vem do próprio jogo.
                  Aqui, sua performance vira odds — e suas odds viram resultado.
                </p>
                <Button asChild size="lg" className="mb-10">
                  <Link href="/register">Comece agora →</Link>
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  {benefits.map((b) => (
                    <div key={b.title} className="border border-[var(--border-mid)] bg-[var(--bg)]/60 backdrop-blur-sm p-4">
                      <b.icon size={16} className="text-[var(--neon)] mb-2" />
                      <div className="font-ui text-sm font-semibold text-[var(--text-bright)] mb-1">{b.title}</div>
                      <p className="font-ui text-xs text-[var(--text-muted)] leading-relaxed">{b.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <div className="relative z-10 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-mono text-2xl font-bold text-[var(--neon)]" style={{ textShadow: "0 0 12px rgba(0,255,102,0.5)" }}>
                {s.value}
              </div>
              <div className="font-display text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Depoimentos ───────────────────────────────────────────────── */}
      <section id="depoimentos" className="relative z-10 px-6 md:px-10 py-20 border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="font-display text-[11px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ O que nossos jogadores dizem</div>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-bright)] uppercase tracking-tight">
              Histórias reais. Resultados reais.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-lg bg-[var(--surface-2)] p-6">
                <p className="font-ui text-sm text-[var(--text)] leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-ui text-xs font-semibold text-[var(--text-bright)]">{t.name}</div>
                    <div className="font-ui text-[11px] text-[var(--text-muted)]">{t.rank}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 px-6 md:px-10 py-20 border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="font-display text-[11px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ Perguntas frequentes</div>
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
      <section className="relative z-10 overflow-hidden">
        <div className="relative w-full min-h-[420px] md:min-h-0 md:aspect-[1774/887]">
          <Image
            src="/final-cta-bg.jpg"
            alt="Guerreiro diante de um dragão colossal em cenário de batalha do Dota 2"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/40 to-[var(--bg)]/40" />

          <div className="absolute inset-0 flex items-center justify-center py-14 md:py-0">
            <div className="max-w-2xl mx-auto px-6 text-center">
              <h2 className="font-display font-black text-3xl md:text-5xl text-[var(--text-bright)] uppercase tracking-tight mb-3 leading-tight">
                Pronto para evoluir?
              </h2>
              <p className="font-ui text-sm md:text-base text-[var(--text-muted)] mb-8">
                Seu desempenho, sua jornada, seu resultado.
              </p>
              <Button asChild size="lg">
                <Link href="/register">Comece agora →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[var(--border)] px-6 md:px-10 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="SkillMoney" className="w-full h-full object-contain" />
            </div>
            <span className="font-display text-xs font-black tracking-[0.2em] text-[var(--text-muted)] uppercase">
              Skill<span className="text-[var(--neon)]">Money</span>
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">© 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#como-funciona" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Como funciona</a>
            <a href="#beneficios" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Benefícios</a>
            <a href="#depoimentos" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Depoimentos</a>
            <a href="#faq" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">FAQ</a>
          </div>

          <span className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest uppercase">
            Jogue com responsabilidade · +18
          </span>
        </div>
      </footer>
    </div>
  );
}
