/**
 * Motor de preços da esDEV.
 *
 * Implementa o modelo do documento interno "esDEV — Sistema Operacional e Comercial":
 *   §7  fórmula do preço técnico
 *   §9  extras e fatores de preço
 *   §19 planos de manutenção
 *   §28 calculadora V1
 *   §29 regra de rentabilidade (valor/hora efetivo)
 *
 * Os valores das tabelas foram calibrados (V3) com preços praticados em Portugal
 * em 2026 — ver `src/lib/mercado.ts` para as fontes e faixas recolhidas.
 *
 * Posicionamento: a esDEV é uma marca pessoal, um freelancer a trabalhar sozinho.
 * Os preços situam-se na metade superior da faixa dos freelancers portugueses —
 * acima de quem compete por preço, longe dos valores de agência — e a capacidade
 * de entrega de uma pessoa é tratada como um limite real, não como detalhe.
 */

/**
 * §7 — piso de rentabilidade. Abaixo disto o projeto não paga IRS, Segurança
 * Social (cerca de 15% da faturação bruta a partir do 2.º ano), contabilidade,
 * ferramentas e o tempo não faturável de prospeção e propostas.
 * Mercado: freelancers de web 20–60 €/h, programadores 30–80 €/h.
 */
export const VALOR_HORA_INTERNO = 40;

/** Valor/hora a que um projeto bem orçamentado deve chegar. */
export const VALOR_HORA_ALVO = 55;

/** Tarifa a apresentar para trabalho avulso fora do âmbito (mercado: 20–80 €/h). */
export const TARIFA_HORA_ADICIONAL = { minimo: 45, maximo: 65 };

/** Arredondamento comercial do preço final. */
const ARREDONDAMENTO = 10;

export type Escalao = { minimo: number; recomendado: number; premium: number };
export type CategoriaPacote = "Website" | "E-commerce" | "Software / CRM";

export type Pacote = {
  id: string;
  categoria: CategoriaPacote;
  nome: string;
  descricao: string;
  /** Faixa observada no mercado português, para justificar o preço. */
  mercado: string;
} & Escalao;

/**
 * Tabela de pacotes V2 — calibrada com o mercado português de 2026.
 * `mercado` documenta a faixa observada para o mesmo tipo de projeto, para se
 * poder justificar o preço numa negociação.
 */
export const PACOTES: Pacote[] = [
  {
    id: "landing",
    categoria: "Website",
    nome: "Landing Page",
    descricao: "Uma página de captação, foco em conversão.",
    mercado: "Freelancer 300–1.000 €",
    minimo: 450,
    recomendado: 650,
    premium: 900,
  },
  {
    id: "onepage",
    categoria: "Website",
    nome: "One Page",
    descricao: "Página única com todas as secções do negócio.",
    mercado: "Freelancer 300–1.200 €",
    minimo: 550,
    recomendado: 750,
    premium: 1000,
  },
  {
    id: "web-start",
    categoria: "Website",
    nome: "Website Start",
    descricao: "Presença institucional essencial, até 5 páginas.",
    mercado: "Freelancer 500–1.500 € · portais tipo Zaask 800–1.200 €",
    minimo: 900,
    recomendado: 1200,
    premium: 1600,
  },
  {
    id: "web-business",
    categoria: "Website",
    nome: "Website Business",
    descricao: "Produto principal para PMEs: 5–10 páginas, CMS e SEO técnico.",
    mercado: "Freelancer 1.500–3.500 € para 5–8 páginas",
    minimo: 1400,
    recomendado: 1900,
    premium: 2500,
  },
  {
    id: "web-pro",
    categoria: "Website",
    nome: "Website Pro",
    descricao: "10–15 páginas, blog/CMS, SEO e funcionalidades próprias.",
    mercado: "Freelancer 3.500–7.000 € para 10–15 páginas",
    minimo: 2200,
    recomendado: 3000,
    premium: 4000,
  },
  {
    id: "web-custom",
    categoria: "Website",
    nome: "Website Custom",
    descricao: "Design e desenvolvimento à medida, com integrações.",
    mercado: "Website personalizado com integrações 2.500–15.000 €",
    minimo: 3500,
    recomendado: 5000,
    premium: 7000,
  },
  {
    id: "eco-start",
    categoria: "E-commerce",
    nome: "E-commerce Start",
    descricao: "Loja essencial sobre template, catálogo reduzido.",
    mercado: "Template com adaptação de marca 2.000–3.500 €",
    minimo: 1800,
    recomendado: 2300,
    premium: 2900,
  },
  {
    id: "eco-business",
    categoria: "E-commerce",
    nome: "E-commerce Business",
    descricao: "Loja semi-custom com gestão de encomendas e pagamentos PT.",
    mercado: "Freelancer 2.000–8.000 € · semi-custom 3.500–5.500 €",
    minimo: 2600,
    recomendado: 3400,
    premium: 4300,
  },
  {
    id: "eco-pro",
    categoria: "E-commerce",
    nome: "E-commerce Pro",
    descricao: "Catálogo grande, variantes, stock e integrações.",
    mercado: "Topo da faixa freelancer: 5.500–8.000 €",
    minimo: 4200,
    recomendado: 5500,
    premium: 7000,
  },
  {
    id: "eco-custom",
    categoria: "E-commerce",
    nome: "E-commerce Custom",
    descricao: "Loja à medida, com ERP e regras próprias. Projeto longo para uma pessoa.",
    mercado: "Custom / headless 8.000–25.000 €",
    minimo: 7000,
    recomendado: 9500,
    premium: 13000,
  },
  {
    id: "crm-base",
    categoria: "Software / CRM",
    nome: "CRM Base",
    descricao: "Leads, clientes, tarefas e dashboards essenciais.",
    mercado: "Implementação em PME pequena 3.000–8.000 €",
    minimo: 3500,
    recomendado: 4500,
    premium: 6000,
  },
  {
    id: "crm-business",
    categoria: "Software / CRM",
    nome: "CRM Business",
    descricao: "Módulos adicionais, permissões, integrações e migração.",
    mercado: "PME média 8.000–25.000 €",
    minimo: 6500,
    recomendado: 9000,
    premium: 12000,
  },
  {
    id: "crm-advanced",
    categoria: "Software / CRM",
    nome: "CRM Advanced",
    descricao:
      "Sistema crítico e multi-equipa. Acima da capacidade de uma pessoa: prever parceria ou subcontratação.",
    mercado: "CRM avançado 25.000–50.000 € (tipicamente equipas)",
    minimo: 13000,
    recomendado: 18000,
    premium: 25000,
  },
  {
    id: "portal",
    categoria: "Software / CRM",
    nome: "Portal / Área de membros",
    descricao: "Reservas, membros ou área de cliente como produto principal.",
    mercado: "Plataforma com membros ou reservas 5.000–30.000 €",
    minimo: 3500,
    recomendado: 5000,
    premium: 7500,
  },
  {
    id: "plataforma",
    categoria: "Software / CRM",
    nome: "Plataforma / Web app à medida",
    descricao: "Produto web multi-utilizador, com regras de negócio próprias.",
    mercado: "Webapp por freelancer 8.000–30.000 €",
    minimo: 6500,
    recomendado: 9500,
    premium: 14000,
  },
];

export const GRUPOS_EXTRAS = [
  "Estrutura",
  "Funcionalidades",
  "Integrações",
  "Conteúdo",
  "SEO",
] as const;

export type GrupoExtra = (typeof GRUPOS_EXTRAS)[number];

export type Extra = {
  id: string;
  nome: string;
  grupo: GrupoExtra;
} & Escalao;

/** §9 — extras, recalibrados com os valores praticados em Portugal em 2026. */
export const EXTRAS: Extra[] = [
  { id: "pagina-simples", nome: "Página simples adicional", grupo: "Estrutura", minimo: 90, recomendado: 120, premium: 160 },
  { id: "pagina-complexa", nome: "Página complexa", grupo: "Estrutura", minimo: 180, recomendado: 250, premium: 320 },
  { id: "landing-extra", nome: "Landing page adicional", grupo: "Estrutura", minimo: 250, recomendado: 350, premium: 450 },
  { id: "pagina-sistema", nome: "Página com sistema próprio", grupo: "Estrutura", minimo: 400, recomendado: 550, premium: 750 },
  { id: "newsletter", nome: "Newsletter", grupo: "Funcionalidades", minimo: 120, recomendado: 170, premium: 240 },
  { id: "blog-cms", nome: "Blog / CMS", grupo: "Funcionalidades", minimo: 250, recomendado: 350, premium: 480 },
  { id: "pesquisa", nome: "Pesquisa", grupo: "Funcionalidades", minimo: 150, recomendado: 220, premium: 300 },
  { id: "filtros", nome: "Filtros avançados", grupo: "Funcionalidades", minimo: 300, recomendado: 450, premium: 650 },
  { id: "reservas", nome: "Sistema de reservas", grupo: "Funcionalidades", minimo: 700, recomendado: 1000, premium: 1500 },
  { id: "area-cliente", nome: "Área de cliente", grupo: "Funcionalidades", minimo: 700, recomendado: 1000, premium: 1500 },
  { id: "login", nome: "Login / registo", grupo: "Funcionalidades", minimo: 300, recomendado: 450, premium: 650 },
  { id: "multilingue", nome: "Multilingue (por idioma)", grupo: "Funcionalidades", minimo: 300, recomendado: 475, premium: 700 },
  { id: "dashboard", nome: "Dashboard", grupo: "Funcionalidades", minimo: 500, recomendado: 800, premium: 1200 },
  { id: "automacao", nome: "Automação", grupo: "Funcionalidades", minimo: 400, recomendado: 600, premium: 900 },
  { id: "integracao-api", nome: "Integração API", grupo: "Integrações", minimo: 700, recomendado: 1100, premium: 1800 },
  { id: "gateway-pagamentos", nome: "Gateway de pagamentos (MB WAY, Multibanco, cartão)", grupo: "Integrações", minimo: 200, recomendado: 320, premium: 480 },
  { id: "faturacao-certificada", nome: "Faturação certificada (Moloni, InvoiceXpress…)", grupo: "Integrações", minimo: 280, recomendado: 420, premium: 620 },
  { id: "transportadoras", nome: "Transportadoras e envios (CTT, DPD…)", grupo: "Integrações", minimo: 200, recomendado: 320, premium: 480 },
  { id: "migracao-dados", nome: "Migração e limpeza de dados", grupo: "Integrações", minimo: 400, recomendado: 700, premium: 1200 },
  { id: "formacao", nome: "Formação da equipa do cliente", grupo: "Integrações", minimo: 150, recomendado: 250, premium: 400 },
  { id: "copywriting", nome: "Copywriting", grupo: "Conteúdo", minimo: 280, recomendado: 420, premium: 600 },
  { id: "copywriting-full", nome: "Copywriting completo", grupo: "Conteúdo", minimo: 600, recomendado: 900, premium: 1300 },
  { id: "fotografia-produto", nome: "Fotografia de produto (até 25 produtos)", grupo: "Conteúdo", minimo: 300, recomendado: 500, premium: 800 },
  { id: "seo-local", nome: "SEO Local", grupo: "SEO", minimo: 250, recomendado: 380, premium: 520 },
  { id: "seo-avancado", nome: "SEO avançado (setup e auditoria)", grupo: "SEO", minimo: 550, recomendado: 850, premium: 1250 },
];


/** §6 — eixos de análise interna, todos avaliados de 1 a 5. */
export const EIXOS_COMPLEXIDADE = [
  { id: "geral", nome: "Complexidade geral" },
  { id: "design", nome: "Complexidade de design" },
  { id: "desenvolvimento", nome: "Complexidade de desenvolvimento" },
  { id: "conteudo", nome: "Conteúdo" },
  { id: "integracoes", nome: "Integrações" },
  { id: "dados", nome: "Dados / backoffice" },
  { id: "seo", nome: "SEO" },
] as const;

export type EixoComplexidade = (typeof EIXOS_COMPLEXIDADE)[number]["id"];

/**
 * §19 — planos de manutenção, recalibrados. O mercado português cobra 40–150 €/mês
 * por manutenção técnica, 150–400 €/mês quando inclui conteúdos e banco de horas,
 * e 400–750 €/mês em gestão completa com SEO.
 */
export const PLANOS_MANUTENCAO = [
  {
    id: "basic",
    nome: "Manutenção Basic",
    minimo: 39,
    maximo: 79,
    inclui:
      "Alojamento, atualizações de segurança, SSL, backups testados, monitorização e pequenas correções.",
    mercado: "Manutenção técnica: 40–150 €/mês",
  },
  {
    id: "business",
    nome: "Manutenção Business",
    minimo: 99,
    maximo: 199,
    inclui:
      "Basic + 1,5h/mês de alterações de conteúdo, suporte prioritário em 1 dia útil e relatório trimestral.",
    mercado: "Manutenção com conteúdos: 150–400 €/mês",
  },
  {
    id: "pro",
    nome: "Manutenção Pro",
    minimo: 249,
    maximo: 450,
    inclui:
      "Business + 4h/mês de evolução, SEO contínuo, relatório mensal, SLA de 4h úteis e reunião mensal.",
    mercado: "Gestão completa com SEO: 400–750 €/mês",
  },
] as const;

export type PlanoManutencao = (typeof PLANOS_MANUTENCAO)[number]["id"];

export type InputsCalculadora = {
  pacoteId: string;
  extras: Record<string, number>;
  complexidade: Record<EixoComplexidade, number>;
  urgencia: number;
  risco: number;
  prioritario: boolean;
  horasEstimadas: number;
  custosExternos: number;
  ajusteComercial: number;
};

export const INPUTS_INICIAIS: InputsCalculadora = {
  pacoteId: "web-business",
  extras: {},
  complexidade: {
    geral: 3,
    design: 3,
    desenvolvimento: 3,
    conteudo: 3,
    integracoes: 3,
    dados: 3,
    seo: 3,
  },
  urgencia: 1,
  risco: 2,
  prioritario: false,
  horasEstimadas: 40,
  custosExternos: 0,
  ajusteComercial: 0,
};

export type LinhaExtra = { extra: Extra; quantidade: number; escalao: Escalao };

export type ResultadoPreco = {
  pacote: Pacote;
  base: Escalao;
  extras: Escalao;
  linhasExtras: LinhaExtra[];
  mediaComplexidade: number;
  fatorComplexidade: number;
  acrescimoUrgencia: number;
  acrescimoPrioritario: number;
  margemRisco: number;
  precoTecnico: Escalao;
  precoFinal: Escalao;
  custosExternos: number;
  valorHora: number;
  rentabilidadeOk: boolean;
  /** abaixo do piso, entre piso e alvo, ou no alvo. */
  nivelRentabilidade: "abaixo" | "aceitavel" | "bom";
  manutencao: {
    plano: PlanoManutencao;
    nome: string;
    valor: number;
    minimo: number;
    maximo: number;
    inclui: string;
  };
};

/** §9 — urgência acresce 20–30%; níveis intermédios interpolados. */
const ACRESCIMO_URGENCIA: Record<number, number> = { 1: 0, 2: 0.05, 3: 0.1, 4: 0.2, 5: 0.3 };

const vazio = (): Escalao => ({ minimo: 0, recomendado: 0, premium: 0 });

const mapEscalao = (e: Escalao, fn: (v: number) => number): Escalao => ({
  minimo: fn(e.minimo),
  recomendado: fn(e.recomendado),
  premium: fn(e.premium),
});

const somaEscalao = (a: Escalao, b: Escalao): Escalao => ({
  minimo: a.minimo + b.minimo,
  recomendado: a.recomendado + b.recomendado,
  premium: a.premium + b.premium,
});

const arredonda = (v: number) => Math.round(v / ARREDONDAMENTO) * ARREDONDAMENTO;

const limita = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function pacotePorId(id: string): Pacote {
  return PACOTES.find((p) => p.id === id) ?? PACOTES[3];
}

function sugereManutencao(precoRecomendado: number, categoria: CategoriaPacote) {
  const plano: PlanoManutencao =
    categoria === "Software / CRM" || precoRecomendado > 8000
      ? "pro"
      : precoRecomendado <= 2000 && categoria === "Website"
        ? "basic"
        : "business";

  const def = PLANOS_MANUTENCAO.find((p) => p.id === plano)!;
  // Dentro da faixa do plano, posiciona pelo peso do projeto.
  const peso = limita(precoRecomendado / 15000, 0, 1);
  const valor = arredonda(def.minimo + (def.maximo - def.minimo) * peso);
  return {
    plano,
    nome: def.nome,
    valor: limita(valor, def.minimo, def.maximo),
    minimo: def.minimo,
    maximo: def.maximo,
    inclui: def.inclui,
  };
}

/** §7 + §28 — calcula preço mínimo / recomendado / premium e a mensalidade sugerida. */
export function calcularPreco(inputs: InputsCalculadora): ResultadoPreco {
  const pacote = pacotePorId(inputs.pacoteId);
  const base: Escalao = {
    minimo: pacote.minimo,
    recomendado: pacote.recomendado,
    premium: pacote.premium,
  };

  const linhasExtras: LinhaExtra[] = [];
  let extras = vazio();
  for (const extra of EXTRAS) {
    const quantidade = Math.max(0, Math.trunc(inputs.extras[extra.id] ?? 0));
    if (!quantidade) continue;
    const escalao = mapEscalao(extra, (v) => v * quantidade);
    linhasExtras.push({ extra, quantidade, escalao });
    extras = somaEscalao(extras, escalao);
  }

  const notas = EIXOS_COMPLEXIDADE.map(({ id }) => limita(inputs.complexidade[id] ?? 3, 1, 5));
  const mediaComplexidade = notas.reduce((a, b) => a + b, 0) / notas.length;
  const fatorComplexidade = 1 + (mediaComplexidade - 3) * 0.1;

  const acrescimoUrgencia = ACRESCIMO_URGENCIA[limita(Math.round(inputs.urgencia), 1, 5)] ?? 0;
  const acrescimoPrioritario = inputs.prioritario ? 0.1 : 0;
  const margemRisco = (limita(Math.round(inputs.risco), 1, 5) - 1) * 0.05;

  const multiplicador =
    fatorComplexidade * (1 + acrescimoUrgencia) * (1 + acrescimoPrioritario) * (1 + margemRisco);

  const custosExternos = Math.max(0, inputs.custosExternos || 0);
  const precoTecnico = mapEscalao(
    somaEscalao(base, extras),
    (v) => arredonda(v * multiplicador) + custosExternos,
  );
  const precoFinal = mapEscalao(precoTecnico, (v) =>
    arredonda(v * (1 + (inputs.ajusteComercial || 0) / 100)),
  );

  const horas = Math.max(0, inputs.horasEstimadas || 0);
  const valorHora = horas > 0 ? (precoFinal.recomendado - custosExternos) / horas : 0;

  return {
    pacote,
    base,
    extras,
    linhasExtras,
    mediaComplexidade,
    fatorComplexidade,
    acrescimoUrgencia,
    acrescimoPrioritario,
    margemRisco,
    precoTecnico,
    precoFinal,
    custosExternos,
    valorHora,
    rentabilidadeOk: horas === 0 || valorHora >= VALOR_HORA_INTERNO,
    nivelRentabilidade:
      horas === 0 || valorHora >= VALOR_HORA_ALVO
        ? "bom"
        : valorHora >= VALOR_HORA_INTERNO
          ? "aceitavel"
          : "abaixo",
    manutencao: sugereManutencao(precoFinal.recomendado, pacote.categoria),
  };
}

/** §10 — os três níveis de proposta mapeiam diretamente nos escalões. */
export const NIVEIS_PROPOSTA = [
  {
    id: "ESSENTIAL",
    nome: "Essential",
    escalao: "minimo" as const,
    descricao: "Solução de entrada, com o essencial para o negócio.",
  },
  {
    id: "BUSINESS",
    nome: "Business",
    escalao: "recomendado" as const,
    descricao: "Solução recomendada, equilibrando preço, qualidade e funcionalidades.",
  },
  {
    id: "PREMIUM",
    nome: "Premium",
    escalao: "premium" as const,
    descricao: "Solução mais completa, com funcionalidades, integrações ou suporte adicionais.",
  },
] as const;
