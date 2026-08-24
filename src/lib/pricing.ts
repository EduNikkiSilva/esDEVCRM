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
 * Os valores das tabelas foram recalibrados (V2) com preços praticados em Portugal
 * em 2026 — ver `src/lib/mercado.ts` para as fontes e faixas recolhidas. O
 * posicionamento é o do §2: acima do freelancer de entrada, abaixo da agência.
 */

/**
 * §7 — valor/hora interno mínimo, apenas para validar rentabilidade.
 * O mercado português paga 30–80 €/h a programadores freelance e 40–80 €/h em SEO;
 * abaixo de 45 €/h um projeto profissional não paga custos, impostos e tempo não faturável.
 */
export const VALOR_HORA_INTERNO = 45;

/** Tarifa a apresentar para trabalho avulso fora do âmbito (mercado: 40–80 €/h). */
export const TARIFA_HORA_ADICIONAL = { minimo: 50, maximo: 75 };

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
    mercado: "Freelancer 300–1.000 € · agência 500–2.000 €",
    minimo: 600,
    recomendado: 850,
    premium: 1200,
  },
  {
    id: "onepage",
    categoria: "Website",
    nome: "One Page",
    descricao: "Página única com todas as secções do negócio.",
    mercado: "300–1.200 € no mercado geral",
    minimo: 750,
    recomendado: 1000,
    premium: 1400,
  },
  {
    id: "web-start",
    categoria: "Website",
    nome: "Website Start",
    descricao: "Presença institucional essencial, até 5 páginas.",
    mercado: "Freelancer 1.000–3.500 €",
    minimo: 1200,
    recomendado: 1600,
    premium: 2100,
  },
  {
    id: "web-business",
    categoria: "Website",
    nome: "Website Business",
    descricao: "Produto principal para PMEs: 5–10 páginas, CMS e SEO técnico.",
    mercado: "Institucional 5–10 páginas: freelancer 1.000–5.000 €, agência 2.000–10.000 €",
    minimo: 1900,
    recomendado: 2600,
    premium: 3400,
  },
  {
    id: "web-pro",
    categoria: "Website",
    nome: "Website Pro",
    descricao: "10–15 páginas, blog/CMS, SEO e funcionalidades próprias.",
    mercado: "Site médio de empresa 3.500–7.000 € · com estratégia e SEO 1.500–6.000 €",
    minimo: 3000,
    recomendado: 4000,
    premium: 5500,
  },
  {
    id: "web-custom",
    categoria: "Website",
    nome: "Website Custom",
    descricao: "Design e desenvolvimento à medida, com integrações.",
    mercado: "Website personalizado com integrações 2.500–15.000 €",
    minimo: 5000,
    recomendado: 7000,
    premium: 10000,
  },
  {
    id: "eco-start",
    categoria: "E-commerce",
    nome: "E-commerce Start",
    descricao: "Loja essencial sobre template, catálogo reduzido.",
    mercado: "Template com adaptação de marca 2.000–3.500 €",
    minimo: 2400,
    recomendado: 3000,
    premium: 3800,
  },
  {
    id: "eco-business",
    categoria: "E-commerce",
    nome: "E-commerce Business",
    descricao: "Loja semi-custom com gestão de encomendas e pagamentos PT.",
    mercado: "Design semi-custom 3.500–7.000 €",
    minimo: 3500,
    recomendado: 4500,
    premium: 5800,
  },
  {
    id: "eco-pro",
    categoria: "E-commerce",
    nome: "E-commerce Pro",
    descricao: "Catálogo grande, variantes, stock e integrações.",
    mercado: "Loja totalmente custom 5.500–10.000 € · agência 3.000–15.000 €",
    minimo: 6000,
    recomendado: 7800,
    premium: 10000,
  },
  {
    id: "eco-custom",
    categoria: "E-commerce",
    nome: "E-commerce Custom",
    descricao: "Loja à medida ou headless, com ERP e regras próprias.",
    mercado: "Custom / headless 8.000–25.000 € · com ERP acima de 25.000 €",
    minimo: 10000,
    recomendado: 15000,
    premium: 22000,
  },
  {
    id: "crm-base",
    categoria: "Software / CRM",
    nome: "CRM Base",
    descricao: "Leads, clientes, tarefas e dashboards essenciais.",
    mercado: "Implementação em PME pequena (5–15 utilizadores) 3.000–8.000 €",
    minimo: 4500,
    recomendado: 6000,
    premium: 8000,
  },
  {
    id: "crm-business",
    categoria: "Software / CRM",
    nome: "CRM Business",
    descricao: "Módulos adicionais, permissões, integrações e migração.",
    mercado: "PME média (15–50 utilizadores) 8.000–25.000 € · CRM padrão 10.000–25.000 €",
    minimo: 9000,
    recomendado: 13000,
    premium: 18000,
  },
  {
    id: "crm-advanced",
    categoria: "Software / CRM",
    nome: "CRM Advanced",
    descricao: "Sistema crítico, multi-equipa, integrações profundas.",
    mercado: "CRM avançado 25.000–50.000 € · implementação complexa 25.000–80.000 €",
    minimo: 20000,
    recomendado: 28000,
    premium: 40000,
  },
  {
    id: "portal",
    categoria: "Software / CRM",
    nome: "Portal / Área de membros",
    descricao: "Reservas, membros ou área de cliente como produto principal.",
    mercado: "Plataforma com membros ou reservas 5.000–30.000 €",
    minimo: 5000,
    recomendado: 7500,
    premium: 12000,
  },
  {
    id: "plataforma",
    categoria: "Software / CRM",
    nome: "Plataforma / Web app à medida",
    descricao: "Produto web multi-utilizador, com regras de negócio próprias.",
    mercado: "Webapp por freelancer 8.000–30.000 € · agência 15.000–80.000 €",
    minimo: 9000,
    recomendado: 15000,
    premium: 25000,
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
  { id: "pagina-simples", nome: "Página simples adicional", grupo: "Estrutura", minimo: 120, recomendado: 150, premium: 200 },
  { id: "pagina-complexa", nome: "Página complexa", grupo: "Estrutura", minimo: 250, recomendado: 325, premium: 400 },
  { id: "landing-extra", nome: "Landing page adicional", grupo: "Estrutura", minimo: 350, recomendado: 450, premium: 600 },
  { id: "pagina-sistema", nome: "Página com sistema próprio", grupo: "Estrutura", minimo: 500, recomendado: 700, premium: 900 },
  { id: "newsletter", nome: "Newsletter", grupo: "Funcionalidades", minimo: 150, recomendado: 220, premium: 300 },
  { id: "blog-cms", nome: "Blog / CMS", grupo: "Funcionalidades", minimo: 300, recomendado: 450, premium: 600 },
  { id: "pesquisa", nome: "Pesquisa", grupo: "Funcionalidades", minimo: 200, recomendado: 300, premium: 400 },
  { id: "filtros", nome: "Filtros avançados", grupo: "Funcionalidades", minimo: 400, recomendado: 600, premium: 850 },
  { id: "reservas", nome: "Sistema de reservas", grupo: "Funcionalidades", minimo: 900, recomendado: 1400, premium: 2000 },
  { id: "area-cliente", nome: "Área de cliente", grupo: "Funcionalidades", minimo: 900, recomendado: 1400, premium: 2000 },
  { id: "login", nome: "Login / registo", grupo: "Funcionalidades", minimo: 400, recomendado: 600, premium: 850 },
  { id: "multilingue", nome: "Multilingue (por idioma)", grupo: "Funcionalidades", minimo: 400, recomendado: 650, premium: 900 },
  { id: "dashboard", nome: "Dashboard", grupo: "Funcionalidades", minimo: 700, recomendado: 1100, premium: 1600 },
  { id: "automacao", nome: "Automação", grupo: "Funcionalidades", minimo: 500, recomendado: 800, premium: 1200 },
  { id: "integracao-api", nome: "Integração API", grupo: "Integrações", minimo: 900, recomendado: 1500, premium: 2500 },
  { id: "gateway-pagamentos", nome: "Gateway de pagamentos (MB WAY, Multibanco, cartão)", grupo: "Integrações", minimo: 250, recomendado: 400, premium: 600 },
  { id: "faturacao-certificada", nome: "Faturação certificada (Moloni, InvoiceXpress…)", grupo: "Integrações", minimo: 350, recomendado: 550, premium: 800 },
  { id: "transportadoras", nome: "Transportadoras e envios (CTT, DPD…)", grupo: "Integrações", minimo: 250, recomendado: 400, premium: 600 },
  { id: "migracao-dados", nome: "Migração e limpeza de dados", grupo: "Integrações", minimo: 500, recomendado: 900, premium: 1500 },
  { id: "formacao", nome: "Formação da equipa do cliente", grupo: "Integrações", minimo: 200, recomendado: 350, premium: 500 },
  { id: "copywriting", nome: "Copywriting", grupo: "Conteúdo", minimo: 350, recomendado: 550, premium: 800 },
  { id: "copywriting-full", nome: "Copywriting completo", grupo: "Conteúdo", minimo: 800, recomendado: 1200, premium: 1800 },
  { id: "fotografia-produto", nome: "Fotografia de produto (até 25 produtos)", grupo: "Conteúdo", minimo: 400, recomendado: 650, premium: 1000 },
  { id: "seo-local", nome: "SEO Local", grupo: "SEO", minimo: 300, recomendado: 450, premium: 600 },
  { id: "seo-avancado", nome: "SEO avançado (setup e auditoria)", grupo: "SEO", minimo: 700, recomendado: 1100, premium: 1600 },
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
    minimo: 45,
    maximo: 95,
    inclui:
      "Alojamento, atualizações de segurança, SSL, backups testados, monitorização e pequenas correções.",
    mercado: "Manutenção técnica: 40–150 €/mês",
  },
  {
    id: "business",
    nome: "Manutenção Business",
    minimo: 130,
    maximo: 280,
    inclui:
      "Basic + 2h/mês de alterações de conteúdo, suporte prioritário em 1 dia útil e relatório trimestral.",
    mercado: "Manutenção com conteúdos: 150–400 €/mês",
  },
  {
    id: "pro",
    nome: "Manutenção Pro",
    minimo: 320,
    maximo: 650,
    inclui:
      "Business + 5h/mês de evolução, SEO contínuo, relatório mensal, SLA de 4h úteis e reunião mensal.",
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
