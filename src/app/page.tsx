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
    title: "Conecte o Dota 2",
    desc: "Cole seu ID do Dota 2 e buscamos seu histórico real de partidas.",
  },
  {
    n: "02",
    icon: BarChart3,
    title: "Veja seu Índice de Performance",
    desc: "Seu Índice é construído a partir dos seus dados reais de performance.",
  },
  {
    n: "03",
    icon: Gamepad2,
    title: "Jogue sua Partida",
    desc: "Escolha vitória, abates, assistência, GPM e XPM antes de começar.",
  },
  {
    n: "04",
    icon: ShieldCheck,
    title: "Liquidação Automática",
    desc: "O sistema busca o resultado sozinho e paga via PIX.",
  },
];

const benefits = [
  { icon: TrendingUp, title: "Índice de Performance individual", desc: "Nada de tabela fixa. Seu índice é calculado a partir do seu próprio desempenho e dos seus dados reais." },
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
      <nav className="relative z-20 flex items-center justify-between gap-2 px-4 sm:px-6 md:px-10 py-3 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.png" alt="SkillMoney" width={192} height={192} className="w-full h-full object-contain" />
          </div>
          <div className="leading-none">
            <div className="font-display text-xs sm:text-sm font-black tracking-[0.15em] sm:tracking-[0.2em] text-[var(--text-bright)] uppercase whitespace-nowrap">
              Skill<span className="text-[var(--neon)]">Money</span>
            </div>
            <div className="hidden sm:block font-ui text-[9px] tracking-[0.2em] text-[var(--text-muted)] uppercase mt-0.5">
              Você contra você.
            </div>
          </div>
        </Link>

        <div className="hidden xl:flex items-center gap-6">
          <Link href="/" className="font-ui text-sm text-[var(--text-bright)] border-b-2 border-[var(--neon)] pb-1 transition-colors">Início</Link>
          <a href="#como-funciona" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Como funciona</a>
          <a href="#beneficios" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Benefícios</a>
          <a href="#depoimentos" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Depoimentos</a>
          <a href="#faq" className="font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link href="/login" className="hidden sm:inline-block font-ui text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mr-1">
            Entrar
          </Link>
          <Button asChild size="sm" className="text-xs sm:text-sm px-3 sm:px-4">
            <Link href="/register">Comece agora →</Link>
          </Button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-b border-[var(--border)] overflow-hidden">
        <div className="relative w-full min-h-[560px] md:min-h-0 md:aspect-[2/1]">
          <Image
            src="/hero-bg.webp"
            alt="Jogador de Dota 2 competindo na SkillMoney"
            fill
            className="object-cover"
            sizes="100vw"
            quality={85}
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
                Seu jogo.
              </div>
              <div
                className="text-5xl md:text-7xl tracking-tighter neon-text glitch-text"
                data-text="Seus dados."
                style={{ textShadow: "0 0 40px rgba(0,255,102,0.6), 0 0 80px rgba(0,255,102,0.25)" }}
              >
                Seus dados.
              </div>
              <div className="text-2xl md:text-3xl text-[var(--text-muted)] tracking-tight mt-1">
                Sua performance.
              </div>
            </h1>

            <p className="font-ui text-lg text-[var(--text)] max-w-md mb-3 leading-relaxed animate-glow-in anim-delay-2">
              Analisamos seu <span className="text-[var(--text-bright)]">histórico real</span> de partidas para calcular um Índice de Performance individual,
              desenvolvido a partir dos seus próprios dados e do seu desempenho no Dota 2.
            </p>
            <p className="font-ui text-xs text-[var(--text-muted)] mb-8 animate-glow-in anim-delay-2">
              Mais que apostas. Um sistema justo para quem joga de verdade.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10 w-full sm:w-auto animate-glow-in anim-delay-3">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/register">Comece agora →</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
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
            src="/como-funciona-bg.webp"
            alt="Aplicativo SkillMoney com painel de desempenho, ao lado de cenário de batalha do Dota 2"
            fill
            className="object-cover object-top"
            sizes="100vw"
            quality={85}
          />

          <div className="absolute inset-0 flex items-center py-10 md:py-0">
            <div className="w-full max-w-7xl mx-auto px-6 md:px-10">
              <div className="md:ml-auto w-full md:w-[62%] lg:w-[56%]">
                <div className="font-display text-[11px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">▸ Como funciona</div>
                <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[var(--text-bright)] uppercase tracking-tight mb-3 leading-tight">
                  Ganhar nunca foi <span className="neon-text">tão direto</span>
                </h2>
                <p className="font-ui text-sm md:text-base text-[var(--text-muted)] mb-6 md:mb-8 max-w-lg">
                  Informe seu ID do Dota 2. Tenha um Índice de Performance individual, calculado a partir do seu histórico real, e obtenha resultados com base na sua própria performance.
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
                      <p className="font-ui text-[11px] text-[var(--text-muted)] leading-snug">
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
            src="/beneficios-bg.webp"
            alt="Guerreiro do Dota 2 em cenário de batalha"
            fill
            className="object-cover object-right md:object-center"
            sizes="100vw"
            quality={85}
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
                  Aqui, sua performance se transforma em um Índice de Performance individual — e seu desempenho se transforma em resultado.
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
                    width={36}
                    height={36}
                    loading="lazy"
                    decoding="async"
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
            src="/final-cta-bg.webp"
            alt="Guerreiro diante de um dragão colossal em cenário de batalha do Dota 2"
            fill
            className="object-cover"
            sizes="100vw"
            quality={85}
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
              <p className="font-ui text-xs text-[var(--text-muted)] mt-5">
                Bônus de 50% no primeiro depósito · Mínimo R$ 20 · Máximo R$ 50
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[var(--border)] px-6 md:px-10 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6">
            <Link href="/" className="flex items-center">
              <img
                src="/logo-full.webp"
                alt="SkillMoney — Você contra você."
                width={459}
                height={320}
                loading="lazy"
                decoding="async"
                className="h-32 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-5 flex-wrap justify-center">
              <Link href="/" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Início</Link>
              <a href="#como-funciona" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Como funciona</a>
              <a href="#beneficios" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Benefícios</a>
              <a href="#depoimentos" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">Depoimentos</a>
              <a href="#faq" className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              {[
                { label: "Discord", path: "M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.074.035c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.075-.035 19.74 19.74 0 0 0-4.884 1.515.07.07 0 0 0-.032.027C.533 9.09-.32 13.68.099 18.21a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128q.189-.14.36-.287a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.01q.171.146.36.288a.077.077 0 0 1-.006.127q-.9.53-1.873.892a.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03Zm-12.288 10.98c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.955 2.42-2.157 2.42Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.42-2.157 2.42Z" },
                { label: "Instagram", path: "M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.9 4.9 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.048 1.066.06 1.405.06 4.122s-.01 3.056-.06 4.122c-.05 1.065-.218 1.79-.465 2.428a4.9 4.9 0 0 1-1.153 1.772 4.9 4.9 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.048-1.405.06-4.122.06s-3.056-.01-4.122-.06c-1.065-.05-1.79-.218-2.428-.465a4.9 4.9 0 0 1-1.772-1.153 4.9 4.9 0 0 1-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.01 15.056 2 14.717 2 12s.01-3.056.06-4.122c.05-1.065.217-1.79.465-2.428a4.9 4.9 0 0 1 1.153-1.772A4.9 4.9 0 0 1 5.45 2.525c.637-.248 1.363-.415 2.428-.465C8.944 2.01 9.283 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.25A3.25 3.25 0 1 1 12 8.75a3.25 3.25 0 0 1 0 6.5ZM17.4 6.1a1.17 1.17 0 1 0 0 2.34 1.17 1.17 0 0 0 0-2.34Z" },
                { label: "YouTube", path: "M21.6 7.2s-.21-1.49-.86-2.14c-.82-.86-1.74-.86-2.16-.91C15.6 4 12 4 12 4h-.01s-3.6 0-6.58.15c-.42.05-1.34.05-2.16.91-.65.65-.86 2.14-.86 2.14S2.18 8.94 2.18 10.68v1.63c0 1.74.21 3.48.21 3.48s.21 1.49.86 2.14c.82.86 1.9.83 2.38.92 1.72.17 7.31.22 7.31.22s3.6-.01 6.58-.16c.42-.05 1.34-.05 2.16-.91.65-.65.86-2.14.86-2.14s.21-1.74.21-3.48v-1.63c0-1.74-.21-3.48-.21-3.48ZM9.98 14.6V8.9l5.4 2.86-5.4 2.85Z" },
                { label: "X", path: "M13.68 10.62 20.86 2h-1.7l-6.23 7.48L8.06 2H2.5l7.53 10.9L2.5 22h1.7l6.6-7.9 5.16 7.9h5.55l-7.83-11.38Zm-2.34 2.8-.77-1.1L4.6 3.3h2.6l4.94 7.06.76 1.1 6.4 9.16h-2.6l-5.36-7.2Z" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-8 h-8 flex items-center justify-center border border-[var(--border)] hover:border-[var(--neon)] text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 border-t border-[var(--border)]">
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              © 2026 SkillMoney. Todos os direitos reservados.
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest uppercase">
              Jogue com responsabilidade · +18
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
