/**
 * Motor de preços da esDEV.
 *
 * Implementa o modelo do documento interno "esDEV — Sistema Operacional e Comercial":
 *   §7  fórmula do preço técnico
 *   §8  preços de referência internos V1 (Portugal)
 *   §9  extras e fatores de preço
 *   §19 planos de manutenção
 *   §28 calculadora V1
 *   §29 regra de rentabilidade (valor/hora efetivo)
 *
 * Todos os valores são referências internas de partida e devem ser revistos com
 * dados reais de projetos fechados.
 */

/** §7 — valor/hora interno de referência, apenas para validar rentabilidade. */
export const VALOR_HORA_INTERNO = 35;

/** Arredondamento comercial do preço final. */
const ARREDONDAMENTO = 10;

export type Escalao = { minimo: number; recomendado: number; premium: number };
export type CategoriaPacote = "Website" | "E-commerce" | "Software / CRM";

export type Pacote = {
  id: string;
  categoria: CategoriaPacote;
  nome: string;
  descricao: string;
} & Escalao;

/** §8 — tabelas de referência interna V1. */
export const PACOTES: Pacote[] = [
  {
    id: "landing",
    categoria: "Website",
    nome: "Landing Page",
    descricao: "Uma página de captação, foco em conversão.",
    minimo: 450,
    recomendado: 600,
    premium: 800,
  },
  {
    id: "onepage",
    categoria: "Website",
    nome: "One Page",
    descricao: "Página única com todas as secções do negócio.",
    minimo: 500,
    recomendado: 700,
    premium: 900,
  },
  {
    id: "web-start",
    categoria: "Website",
    nome: "Website Start",
    descricao: "Presença institucional essencial, até ~5 páginas.",
    minimo: 750,
    recomendado: 950,
    premium: 1200,
  },
  {
    id: "web-business",
    categoria: "Website",
    nome: "Website Business",
    descricao: "Produto principal para PMEs. Institucional completo.",
    minimo: 1000,
    recomendado: 1400,
    premium: 1800,
  },
  {
    id: "web-pro",
    categoria: "Website",
    nome: "Website Pro",
    descricao: "Estrutura maior, CMS, SEO e funcionalidades próprias.",
    minimo: 1500,
    recomendado: 2000,
    premium: 2750,
  },
  {
    id: "web-custom",
    categoria: "Website",
    nome: "Website Custom",
    descricao: "Design e desenvolvimento totalmente à medida.",
    minimo: 2500,
    recomendado: 3500,
    premium: 5000,
  },
  {
    id: "eco-start",
    categoria: "E-commerce",
    nome: "E-commerce Start",
    descricao: "Loja essencial, catálogo reduzido.",
    minimo: 1500,
    recomendado: 1800,
    premium: 2200,
  },
  {
    id: "eco-business",
    categoria: "E-commerce",
    nome: "E-commerce Business",
    descricao: "Loja completa com gestão de encomendas.",
    minimo: 2000,
    recomendado: 2750,
    premium: 3500,
  },
  {
    id: "eco-pro",
    categoria: "E-commerce",
    nome: "E-commerce Pro",
    descricao: "Catálogo grande, variantes, stock e integrações.",
    minimo: 3000,
    recomendado: 4000,
    premium: 5500,
  },
  {
    id: "eco-custom",
    categoria: "E-commerce",
    nome: "E-commerce Custom",
    descricao: "Loja à medida com regras de negócio próprias.",
    minimo: 5000,
    recomendado: 7500,
    premium: 10000,
  },
  {
    id: "crm-base",
    categoria: "Software / CRM",
    nome: "CRM Base",
    descricao: "Gestão de leads, clientes e tarefas.",
    minimo: 3000,
    recomendado: 4000,
    premium: 5000,
  },
  {
    id: "crm-business",
    categoria: "Software / CRM",
    nome: "CRM Business",
    descricao: "Módulos adicionais, permissões e dashboards.",
    minimo: 5000,
    recomendado: 7500,
    premium: 10000,
  },
  {
    id: "crm-advanced",
    categoria: "Software / CRM",
    nome: "CRM Advanced",
    descricao: "Sistema crítico, integrações e migração de dados.",
    minimo: 10000,
    recomendado: 13000,
    premium: 16000,
  },
  {
    id: "plataforma",
    categoria: "Software / CRM",
    nome: "Plataforma personalizada",
    descricao: "Produto web à medida, multi-utilizador.",
    minimo: 5000,
    recomendado: 7500,
    premium: 10000,
  },
];

export type Extra = {
  id: string;
  nome: string;
  grupo: "Estrutura" | "Funcionalidades" | "Conteúdo" | "SEO";
} & Escalao;

/** §9 — extras e complexidade. */
export const EXTRAS: Extra[] = [
  { id: "pagina-simples", nome: "Página simples adicional", grupo: "Estrutura", minimo: 75, recomendado: 75, premium: 75 },
  { id: "pagina-complexa", nome: "Página complexa", grupo: "Estrutura", minimo: 125, recomendado: 160, premium: 200 },
  { id: "landing-extra", nome: "Landing page adicional", grupo: "Estrutura", minimo: 150, recomendado: 200, premium: 250 },
  { id: "pagina-sistema", nome: "Página com sistema próprio", grupo: "Estrutura", minimo: 250, recomendado: 325, premium: 400 },
  { id: "newsletter", nome: "Newsletter", grupo: "Funcionalidades", minimo: 75, recomendado: 110, premium: 150 },
  { id: "blog-cms", nome: "Blog / CMS", grupo: "Funcionalidades", minimo: 150, recomendado: 225, premium: 300 },
  { id: "pesquisa", nome: "Pesquisa", grupo: "Funcionalidades", minimo: 100, recomendado: 150, premium: 200 },
  { id: "filtros", nome: "Filtros avançados", grupo: "Funcionalidades", minimo: 200, recomendado: 350, premium: 500 },
  { id: "reservas", nome: "Sistema de reservas", grupo: "Funcionalidades", minimo: 300, recomendado: 500, premium: 700 },
  { id: "area-cliente", nome: "Área de cliente", grupo: "Funcionalidades", minimo: 400, recomendado: 600, premium: 800 },
  { id: "login", nome: "Login / registo", grupo: "Funcionalidades", minimo: 250, recomendado: 375, premium: 500 },
  { id: "multilingue", nome: "Multilingue", grupo: "Funcionalidades", minimo: 200, recomendado: 350, premium: 500 },
  { id: "dashboard", nome: "Dashboard", grupo: "Funcionalidades", minimo: 400, recomendado: 700, premium: 1000 },
  { id: "automacao", nome: "Automação", grupo: "Funcionalidades", minimo: 300, recomendado: 450, premium: 600 },
  { id: "integracao-api", nome: "Integração API", grupo: "Funcionalidades", minimo: 300, recomendado: 650, premium: 1000 },
  { id: "copywriting", nome: "Copywriting", grupo: "Conteúdo", minimo: 250, recomendado: 425, premium: 600 },
  { id: "copywriting-full", nome: "Copywriting completo", grupo: "Conteúdo", minimo: 600, recomendado: 800, premium: 1000 },
  { id: "seo-local", nome: "SEO Local", grupo: "SEO", minimo: 150, recomendado: 225, premium: 300 },
  { id: "seo-avancado", nome: "SEO avançado", grupo: "SEO", minimo: 400, recomendado: 700, premium: 1000 },
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

/** §19 — planos de manutenção e respetivas faixas internas. */
export const PLANOS_MANUTENCAO = [
  {
    id: "basic",
    nome: "Manutenção Basic",
    minimo: 29,
    maximo: 39,
    inclui: "Atualizações, monitorização, backups e pequenas correções.",
  },
  {
    id: "business",
    nome: "Manutenção Business",
    minimo: 49,
    maximo: 79,
    inclui: "Basic + pequenas alterações e suporte prioritário.",
  },
  {
    id: "pro",
    nome: "Manutenção Pro",
    minimo: 89,
    maximo: 149,
    inclui: "Suporte prioritário + horas mensais de desenvolvimento e melhorias contínuas.",
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
    precoRecomendado <= 1000 && categoria === "Website"
      ? "basic"
      : precoRecomendado <= 5000 && categoria !== "Software / CRM"
        ? "business"
        : "pro";

  const def = PLANOS_MANUTENCAO.find((p) => p.id === plano)!;
  // Dentro da faixa do plano, posiciona pelo peso do projeto.
  const peso = limita(precoRecomendado / 8000, 0, 1);
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
