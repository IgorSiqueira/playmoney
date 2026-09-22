import Link from "next/link";

export const metadata = {
  title: "Termos e Condições de Uso — SkillMoney",
  description: "Termos e Condições de Uso da plataforma SkillMoney.",
};

const sections = [
  {
    id: "identificacao",
    title: "0. Identificação da Plataforma",
    body: (
      <>
        <p>
          O SkillMoney é operado por <strong>[RAZÃO SOCIAL A PREENCHER]</strong>, inscrita no CNPJ sob o
          nº <strong>[XX.XXX.XXX/XXXX-XX]</strong>, com sede em <strong>[ENDEREÇO A PREENCHER]</strong>
          (&ldquo;SkillMoney&rdquo;, &ldquo;plataforma&rdquo; ou &ldquo;nós&rdquo;).
        </p>
        <p>
          Estes Termos e Condições de Uso (&ldquo;Termos&rdquo;) regulam a utilização da plataforma
          SkillMoney por qualquer pessoa que crie uma conta ou utilize os serviços disponibilizados
          (&ldquo;usuário&rdquo; ou &ldquo;jogador&rdquo;).
        </p>
      </>
    ),
  },
  {
    id: "objeto",
    title: "1. Objeto",
    body: (
      <p>
        O SkillMoney é uma plataforma voltada à análise de performance individual de jogadores de
        Dota 2, utilizando dados estatísticos de partidas para calcular um <em>Índice de Performance</em>{" "}
        e disponibilizar operações de performance conforme as regras da plataforma.
      </p>
    ),
  },
  {
    id: "cadastro",
    title: "2. Cadastro",
    body: (
      <>
        <p>
          Para utilizar o SkillMoney, o usuário deverá criar uma conta e fornecer informações
          verdadeiras, completas e atualizadas.
        </p>
        <p>
          Durante o cadastro, o jogador deverá informar seu <em>ID público do Dota 2</em>, utilizado
          para identificação e consulta de seu histórico de partidas.
        </p>
        <p>O usuário é responsável pela exatidão das informações fornecidas.</p>

        <h3>2.1 Uma conta por CPF</h3>
        <p>
          Cada <em>CPF poderá estar vinculado a apenas uma conta SkillMoney</em>.
        </p>
        <p>
          Não será permitida a criação, manutenção ou utilização de múltiplas contas vinculadas ao
          mesmo CPF.
        </p>
        <p>
          A tentativa de criar ou utilizar contas adicionais poderá resultar na suspensão ou
          encerramento das contas envolvidas.
        </p>

        <h3>2.2 Uma conta por ID do Dota 2</h3>
        <p>
          Cada <em>ID de Dota 2 poderá estar vinculado a apenas uma conta SkillMoney</em>.
        </p>
        <p>Não será permitida a utilização do mesmo ID de Dota 2 em múltiplas contas SkillMoney.</p>
        <p>
          Caso seja identificada duplicidade, o SkillMoney poderá suspender as contas envolvidas e
          realizar procedimentos adicionais de verificação.
        </p>

        <h3>2.3 Idade mínima</h3>
        <p>
          O uso do SkillMoney é restrito a maiores de <strong>18 (dezoito) anos</strong>. Ao criar
          uma conta, o usuário declara e confirma possuir idade igual ou superior a 18 anos.
        </p>
        <p>
          O SkillMoney poderá solicitar documentos ou procedimentos adicionais para verificação de
          idade e identidade, podendo suspender contas em caso de dúvida razoável ou indício de uso
          por menor de idade.
        </p>
      </>
    ),
  },
  {
    id: "steam",
    title: "3. Relação com a Steam e o Dota 2",
    body: (
      <>
        <p>
          O SkillMoney <em>não possui vínculo, parceria, associação ou integração com a Steam ou com
          a Valve Corporation</em>, salvo se expressamente informado pela plataforma.
        </p>
        <p>O SkillMoney não exige que o usuário conecte sua conta Steam à plataforma.</p>
        <p>
          Para identificação e análise da performance, o SkillMoney utiliza o <em>ID público do Dota 2</em>{" "}
          informado pelo jogador e os dados estatísticos disponíveis por meio de fontes de dados
          utilizadas pela plataforma.
        </p>
        <p>
          O fornecimento do ID do Dota 2 não representa autorização para acesso à conta Steam do
          usuário.
        </p>
        <p>O SkillMoney não solicita, armazena ou utiliza a senha da conta Steam do usuário.</p>
      </>
    ),
  },
  {
    id: "perfil-publico",
    title: "4. Perfil Público do Dota 2",
    body: (
      <>
        <p>
          Para participar das operações do SkillMoney, o jogador deverá manter seu <em>perfil do
          Dota 2 público</em>, permitindo a consulta de seu histórico de partidas e respectivas
          estatísticas.
        </p>
        <p>
          Perfis privados, indisponíveis ou que não forneçam os dados necessários para análise
          poderão ficar impossibilitados de participar até que os dados estejam novamente
          disponíveis.
        </p>
        <p>
          O SkillMoney poderá utilizar fontes externas especializadas em dados de partidas e
          estatísticas de Dota 2 para obter as informações necessárias.
        </p>
      </>
    ),
  },
  {
    id: "analise-performance",
    title: "5. Análise de Performance",
    body: (
      <>
        <p>
          Após a identificação do jogador, o SkillMoney poderá analisar suas <em>últimas 50 partidas
          elegíveis</em> disponíveis nas fontes de dados utilizadas pela plataforma.
        </p>
        <p>As estatísticas analisadas poderão incluir, entre outras:</p>
        <ul>
          <li>vitórias e derrotas;</li>
          <li>kills;</li>
          <li>assists;</li>
          <li>mortes;</li>
          <li>KDA;</li>
          <li>desempenho por partida;</li>
          <li>consistência;</li>
          <li>desempenho recente;</li>
          <li>outros indicadores estatísticos relevantes.</li>
        </ul>
        <p>
          Com base nesses dados, o sistema calculará um <em>Índice de Performance individual</em>.
        </p>
        <p>
          Cada jogador poderá apresentar um Índice de Performance diferente, de acordo com suas
          próprias estatísticas e histórico.
        </p>
      </>
    ),
  },
  {
    id: "cotacoes",
    title: "6. Cotações e Operações de Performance",
    body: (
      <>
        <p>
          O Índice de Performance será utilizado como um dos elementos para determinar as{" "}
          <em>cotações</em> disponibilizadas para cada jogador.
        </p>
        <p>
          As cotações poderão variar de acordo com as características estatísticas e o desempenho
          histórico de cada jogador.
        </p>
        <p>
          As cotações apresentadas no momento da realização da operação serão aquelas aplicáveis à
          respectiva operação, observadas as regras da plataforma.
        </p>
      </>
    ),
  },
  {
    id: "modalidades",
    title: "7. Modalidades de Operação",
    body: (
      <>
        <p>
          As operações relacionadas à performance individual deverão obrigatoriamente possuir a{" "}
          <em>vitória do próprio jogador</em> como condição principal.
        </p>

        <h3>7.1 Operação simples</h3>
        <p>
          A operação simples consiste na previsão de <em>vitória do próprio jogador em uma partida
          individual</em>.
        </p>

        <h3>7.2 Operação combinada</h3>
        <p>A operação combinada deverá obrigatoriamente conter:</p>
        <p>
          <em>Vitória do próprio jogador + um ou mais critérios estatísticos.</em>
        </p>
        <p>Exemplos:</p>
        <ul>
          <li>Vitória + 9 ou mais kills;</li>
          <li>Vitória + 10 ou mais assists;</li>
          <li>Vitória + 9 ou mais kills + 10 ou mais assists.</li>
        </ul>
        <p>Não serão disponibilizadas operações compostas exclusivamente por estatísticas.</p>
        <p>Exemplo:</p>
        <p>
          <em>9 kills sem condição de vitória = não permitido.</em>
        </p>
      </>
    ),
  },
  {
    id: "depositos",
    title: "8. Depósitos, Saldo e Saques",
    body: (
      <>
        <p>
          Para realizar operações na plataforma, o usuário deverá possuir saldo disponível em sua
          conta SkillMoney, observados os limites, condições e procedimentos estabelecidos pela
          plataforma.
        </p>

        <h3>8.1 Depósitos</h3>
        <p>
          Os depósitos deverão ser realizados exclusivamente por meio dos métodos de pagamento
          disponibilizados pelo SkillMoney.
        </p>
        <p>
          O valor depositado somente será disponibilizado para utilização após a confirmação da
          respectiva transação pelo sistema de pagamento utilizado.
        </p>
        <p>
          O SkillMoney poderá estabelecer limites mínimos e máximos para depósitos, conforme as
          regras e condições vigentes na plataforma.
        </p>
        <p>
          O usuário declara que os recursos utilizados para depósitos são de sua titularidade ou
          estão sob sua legítima disponibilidade, sendo vedada a utilização de meios de pagamento
          pertencentes a terceiros, quando não autorizada pela plataforma.
        </p>

        <h3>8.2 Saldo da conta</h3>
        <p>
          Os valores disponíveis na conta do usuário poderão ser utilizados exclusivamente para as
          operações permitidas pela plataforma, observadas as regras vigentes.
        </p>
        <p>
          O saldo poderá ser atualizado após a confirmação dos resultados das operações e demais
          procedimentos de validação aplicáveis.
        </p>
        <p>
          Em caso de inconsistência, fraude, duplicidade de cadastro, manipulação de resultados ou
          outra irregularidade, o SkillMoney poderá realizar verificações adicionais antes de
          liberar ou movimentar determinados valores.
        </p>

        <h3>8.3 Solicitação de saque</h3>
        <p>
          O usuário poderá solicitar o saque de valores disponíveis em seu saldo, observadas as
          condições e procedimentos estabelecidos pelo SkillMoney.
        </p>
        <p>
          As solicitações de saque deverão ser realizadas pelo próprio titular da conta e, quando
          aplicável, para uma conta ou chave de pagamento de sua titularidade.
        </p>
        <p>
          O SkillMoney poderá solicitar informações ou procedimentos adicionais de verificação de
          identidade e titularidade antes da conclusão do saque.
        </p>

        <h3>8.4 Prazo para saque</h3>
        <p>
          Após a validação da solicitação, o pagamento será processado e enviado pelo meio de
          pagamento disponibilizado pela plataforma.
        </p>
        <p>
          O prazo para conclusão do saque poderá ser de <em>até 24 horas</em>, contadas a partir da
          validação da solicitação, ressalvadas situações de indisponibilidade, instabilidade ou
          atraso decorrentes de instituições financeiras, instituições de pagamento, sistemas de
          pagamento ou outros terceiros envolvidos na operação.
        </p>

        <h3>8.5 Cancelamento ou recusa de saque</h3>
        <p>
          O SkillMoney poderá suspender temporariamente ou recusar uma solicitação de saque quando
          forem identificadas inconsistências cadastrais, ausência de confirmação de titularidade,
          suspeita de fraude, violação destes Termos ou outras situações que exijam verificação
          adicional.
        </p>
        <p>
          Quando aplicável, o usuário será informado sobre a necessidade de regularização ou
          verificação antes da conclusão da solicitação.
        </p>

        <h3>8.6 Taxas</h3>
        <p>
          Eventuais taxas relacionadas a depósitos, saques ou serviços de pagamento serão informadas
          ao usuário antes da confirmação da respectiva operação.
        </p>

        <h3>8.7 Responsabilidade pelas informações</h3>
        <p>
          O usuário é responsável por fornecer corretamente seus dados cadastrais e as informações
          necessárias para a realização de depósitos e saques.
        </p>
        <p>
          O SkillMoney não será responsável por atrasos ou falhas decorrentes de informações
          incorretas fornecidas pelo usuário ou de indisponibilidade dos sistemas de terceiros
          responsáveis pelo processamento do pagamento.
        </p>
      </>
    ),
  },
  {
    id: "resultado",
    title: "9. Resultado das Operações",
    body: (
      <>
        <p>
          O resultado será determinado de acordo com os dados da partida e os critérios
          estabelecidos para a respectiva operação.
        </p>
        <p>Em operações simples, será considerada a vitória ou derrota do jogador.</p>
        <p>
          Em operações combinadas, <em>todos os critérios estabelecidos deverão ser cumpridos</em>{" "}
          para que a operação seja considerada vencedora.
        </p>
      </>
    ),
  },
  {
    id: "partidas-elegiveis",
    title: "10. Partidas Elegíveis",
    body: (
      <>
        <p>
          Somente partidas que atendam aos critérios técnicos e de validação estabelecidos pelo
          SkillMoney poderão ser utilizadas para fins de cálculo de performance ou liquidação de
          operações.
        </p>
        <p>O SkillMoney poderá desconsiderar partidas que apresentem:</p>
        <ul>
          <li>dados incompletos;</li>
          <li>falhas de transmissão ou coleta de dados;</li>
          <li>resultados inconsistentes;</li>
          <li>partidas anuladas;</li>
          <li>suspeita de manipulação;</li>
          <li>uso de smurf;</li>
          <li>trapaça;</li>
          <li>comportamento fraudulento;</li>
          <li>outras irregularidades que comprometam a confiabilidade dos dados.</li>
        </ul>
      </>
    ),
  },
  {
    id: "smurf",
    title: "11. Smurf, Trapaça e Manipulação",
    body: (
      <>
        <p>
          É proibida qualquer tentativa de manipular resultados, estatísticas ou informações
          utilizadas pelo SkillMoney.
        </p>
        <p>
          Também é proibida a utilização de contas falsas, contas de terceiros, smurf, cheats ou
          qualquer mecanismo destinado a alterar artificialmente a performance apresentada pelo
          jogador.
        </p>
        <p>
          Em caso de irregularidade, o SkillMoney poderá suspender a conta, cancelar operações
          afetadas, bloquear valores relacionados à irregularidade e/ou aplicar outras medidas
          previstas nas regras da plataforma.
        </p>
      </>
    ),
  },
  {
    id: "cancelamento",
    title: "12. Cancelamento",
    body: (
      <>
        <p>
          Após a realização de uma operação, o cancelamento estará sujeito às regras específicas da
          plataforma e ao estado da partida relacionada.
        </p>
        <p>Operações vinculadas a partidas já iniciadas ou concluídas poderão não ser canceláveis.</p>
      </>
    ),
  },
  {
    id: "fonte-dados",
    title: "13. Fonte dos Dados",
    body: (
      <>
        <p>
          O SkillMoney poderá utilizar dados provenientes de fontes públicas e/ou fornecedores
          especializados em estatísticas de Dota 2.
        </p>
        <p>
          A plataforma poderá alterar, substituir ou adicionar fontes de dados sempre que necessário
          para melhorar a qualidade, disponibilidade ou confiabilidade das informações utilizadas.
        </p>
      </>
    ),
  },
  {
    id: "atualizacao-cotacoes",
    title: "14. Atualização das Cotações",
    body: (
      <>
        <p>
          As cotações e informações de performance poderão ser atualizadas conforme a
          disponibilidade de novos dados e os critérios matemáticos utilizados pelo sistema.
        </p>
        <p>O usuário deverá verificar as informações apresentadas antes de confirmar qualquer operação.</p>
      </>
    ),
  },
  {
    id: "responsabilidade-usuario",
    title: "15. Responsabilidade do Usuário",
    body: (
      <>
        <p>O usuário declara que:</p>
        <ul>
          <li>possui capacidade legal para utilizar a plataforma;</li>
          <li>fornecerá informações verdadeiras;</li>
          <li>utilizará seu próprio CPF;</li>
          <li>utilizará seu próprio ID do Dota 2;</li>
          <li>manterá seu perfil público quando necessário;</li>
          <li>não tentará manipular resultados ou estatísticas;</li>
          <li>não utilizará meios fraudulentos para obter vantagem;</li>
          <li>não criará múltiplas contas.</li>
        </ul>
      </>
    ),
  },
  {
    id: "dados-externos",
    title: "16. Responsabilidade sobre Dados Externos",
    body: (
      <>
        <p>O SkillMoney depende, em parte, de dados obtidos de fontes externas.</p>
        <p>
          Eventuais atrasos, indisponibilidades, erros ou inconsistências provenientes dessas fontes
          poderão afetar a disponibilidade ou atualização das informações da plataforma.
        </p>
        <p>
          O SkillMoney poderá estabelecer procedimentos específicos para correção, validação ou
          desconsideração de dados inconsistentes.
        </p>
      </>
    ),
  },
  {
    id: "suspensao",
    title: "17. Suspensão ou Encerramento da Conta",
    body: (
      <p>
        O SkillMoney poderá suspender ou encerrar contas que violem estes Termos, as regras da
        plataforma ou apresentem indícios de fraude, manipulação, utilização indevida, duplicidade
        de cadastro ou outras irregularidades.
      </p>
    ),
  },
  {
    id: "tributacao",
    title: "18. Tributação",
    body: (
      <>
        <p>
          Os ganhos líquidos obtidos pelo usuário na plataforma podem estar sujeitos à incidência de
          Imposto de Renda, nos termos da legislação tributária aplicável a prêmios e ganhos
          decorrentes de apostas de quota fixa (Lei nº 14.790/2023 e regulamentação
          correlata), incluindo retenção na fonte sobre o saldo líquido positivo apurado por
          período, quando aplicável, observada a faixa de isenção vigente.
        </p>
        <p>
          O SkillMoney poderá reter e recolher os valores devidos a título de tributos, informando
          ao usuário conforme exigido pela legislação, sem prejuízo da responsabilidade do próprio
          usuário por eventuais obrigações acessórias perante a Receita Federal do Brasil.
        </p>
        <p>
          Recomenda-se ao usuário consultar um contador ou profissional habilitado para orientação
          sobre suas obrigações fiscais individuais.
        </p>
      </>
    ),
  },
  {
    id: "jogo-responsavel",
    title: "19. Jogo Responsável",
    body: (
      <>
        <p>
          O SkillMoney incentiva o uso consciente e responsável da plataforma. Operar com dinheiro
          real envolve risco de perda financeira, e o desempenho passado de um jogador não garante
          resultados futuros.
        </p>
        <p>
          O usuário pode, a qualquer momento, solicitar limites de depósito, pausa temporária ou
          encerramento voluntário da conta pelos canais de atendimento do SkillMoney.
        </p>
        <p>
          O acesso à plataforma é restrito a maiores de 18 anos. Caso identifique sinais de uso
          problemático, o SkillMoney poderá suspender preventivamente a conta e orientar o usuário
          a buscar apoio especializado.
        </p>
      </>
    ),
  },
  {
    id: "lgpd",
    title: "20. Proteção de Dados Pessoais",
    body: (
      <>
        <p>
          O tratamento de dados pessoais pelo SkillMoney observa a Lei nº 13.709/2018 (Lei Geral de
          Proteção de Dados Pessoais — LGPD).
        </p>
        <p>
          Os dados coletados no cadastro (incluindo CPF, dados de contato, dados de pagamento e o ID
          público do Dota 2) são utilizados exclusivamente para viabilizar a prestação dos serviços,
          cumprir obrigações legais e regulatórias, e prevenir fraude.
        </p>
        <p>
          Detalhes sobre a coleta, uso, compartilhamento e retenção de dados pessoais estão descritos
          na <Link href="/privacidade" className="underline hover:text-[var(--neon)]">Política de Privacidade</Link>{" "}
          do SkillMoney, parte integrante destes Termos.
        </p>
      </>
    ),
  },
  {
    id: "propriedade-intelectual",
    title: "21. Propriedade Intelectual",
    body: (
      <>
        <p>
          Todos os elementos da plataforma SkillMoney — incluindo marca, logotipo, layout, textos,
          algoritmos de cálculo do Índice de Performance e software — são de propriedade do
          SkillMoney ou de seus licenciantes, sendo vedada a reprodução, cópia ou uso não autorizado.
        </p>
        <p>
          &ldquo;Dota 2&rdquo; e demais marcas de terceiros mencionadas nestes Termos pertencem aos
          respectivos titulares e são citadas apenas para fins de identificação do jogo analisado
          pela plataforma, sem qualquer relação de afiliação, conforme já esclarecido na
          Seção 3.
        </p>
      </>
    ),
  },
  {
    id: "limitacao-responsabilidade",
    title: "22. Limitação de Responsabilidade",
    body: (
      <>
        <p>
          O SkillMoney envida seus melhores esforços para manter a plataforma disponível, segura e
          com informações precisas, mas não garante disponibilidade ininterrupta nem a ausência
          total de erros, falhas técnicas ou inconsistências, inclusive as decorrentes de fontes de
          dados de terceiros.
        </p>
        <p>
          Na máxima extensão permitida pela legislação aplicável, o SkillMoney não será responsável
          por perdas indiretas, lucros cessantes ou danos decorrentes de uso indevido da plataforma
          pelo usuário, de indisponibilidade de terceiros ou de decisões de operação tomadas pelo
          usuário com base nas informações apresentadas.
        </p>
      </>
    ),
  },
  {
    id: "lei-aplicavel",
    title: "23. Lei Aplicável e Foro",
    body: (
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da
        comarca de <strong>[CIDADE/UF A PREENCHER]</strong> para dirimir quaisquer controvérsias
        decorrentes destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja,
        ressalvado o foro do domicílio do consumidor, quando aplicável por lei.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "24. Alterações dos Termos",
    body: (
      <>
        <p>O SkillMoney poderá atualizar estes Termos e Condições sempre que necessário.</p>
        <p>
          As alterações serão disponibilizadas na plataforma, cabendo ao usuário consultar a versão
          vigente antes de utilizar os serviços.
        </p>
      </>
    ),
  },
  {
    id: "aceite",
    title: "25. Aceite",
    body: (
      <p>
        Ao criar uma conta e utilizar o SkillMoney, o usuário declara que leu, compreendeu e
        concorda com estes Termos e Condições de Uso.
      </p>
    ),
  },
];

export default function TermsPage() {
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
            Termos e Condições de Uso
          </h1>
          <p className="font-ui text-sm text-[var(--text-muted)] mt-3">Última atualização: setembro de 2026</p>
        </div>

        <div className="space-y-10 font-ui text-[15px] leading-relaxed text-[var(--text)]
          [&_h3]:font-display [&_h3]:text-sm [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-wide
          [&_h3]:text-[var(--text-bright)] [&_h3]:mt-6 [&_h3]:mb-2
          [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
          [&_em]:text-[var(--text-bright)] [&_em]:not-italic [&_em]:font-semibold
          [&_strong]:text-[var(--text-bright)]">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-[var(--border)] pb-8 last:border-0">
              <h2 className="font-display font-bold text-lg text-[var(--text-bright)] uppercase tracking-tight mb-4">
                {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
