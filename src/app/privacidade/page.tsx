import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade — SkillMoney",
  description: "Política de Privacidade da plataforma SkillMoney.",
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-[var(--bg)]">
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <Link
          href="/"
          className="font-ui text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          ← Voltar para o início
        </Link>

        <div className="mt-6 mb-10">
          <div className="font-display text-[11px] tracking-[0.3em] text-[var(--neon)] uppercase mb-3">
            ▸ Documento legal
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-[var(--text-bright)] uppercase tracking-tight">
            Política de Privacidade
          </h1>
          <p className="font-ui text-sm text-[var(--text-muted)] mt-3">Última atualização: setembro de 2026</p>
        </div>

        <div className="font-ui text-[15px] leading-relaxed text-[var(--text)] space-y-4">
          <p>
            Esta página está em elaboração. O SkillMoney trata dados pessoais (incluindo CPF, dados
            de contato, dados de pagamento e ID público do Dota 2) em conformidade com a Lei nº
            13.709/2018 (LGPD), exclusivamente para viabilizar a prestação dos serviços, cumprir
            obrigações legais e regulatórias, e prevenir fraude.
          </p>
          <p>
            A versão completa desta Política — com detalhamento de bases legais, prazos de retenção,
            compartilhamento com terceiros (processadores de pagamento, provedores de dados de
            partidas) e canal para exercício de direitos do titular — será publicada em breve.
          </p>
          <p>
            Dúvidas sobre tratamento de dados podem ser enviadas para{" "}
            <strong className="text-[var(--text-bright)]">[E-MAIL DE CONTATO/DPO A PREENCHER]</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
