/**
 * Vocabulário do sistema operacional da esDEV — pipeline, tipos de solução,
 * briefing e checklists, tal como definidos no documento interno.
 */

/** §24 — pipeline recomendado. */
export const FASES = [
  "Novo Lead",
  "Contactado",
  "Reunião marcada",
  "Discovery/Briefing",
  "Proposta enviada",
  "Negociação",
  "Aceite",
  "Contrato assinado",
  "Pagamento inicial",
  "Projeto ativo",
  "Entregue",
  "Manutenção",
  "Perdido",
] as const;

export type Fase = (typeof FASES)[number];

/** Fases que ainda contam para o valor do pipeline. */
export const FASES_ABERTAS: readonly Fase[] = FASES.filter(
  (f) => f !== "Entregue" && f !== "Manutenção" && f !== "Perdido",
);

export const COR_FASE: Record<Fase, string> = {
  "Novo Lead": "bg-slate-100 text-slate-700 border-slate-200",
  Contactado: "bg-sky-50 text-sky-700 border-sky-200",
  "Reunião marcada": "bg-sky-100 text-sky-800 border-sky-200",
  "Discovery/Briefing": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Proposta enviada": "bg-violet-50 text-violet-700 border-violet-200",
  Negociação: "bg-amber-50 text-amber-800 border-amber-200",
  Aceite: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Contrato assinado": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Pagamento inicial": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Projeto ativo": "bg-teal-50 text-teal-700 border-teal-200",
  Entregue: "bg-blue-50 text-blue-700 border-blue-200",
  Manutenção: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Perdido: "bg-rose-50 text-rose-700 border-rose-200",
};

/** §16 — fases de desenvolvimento do projeto. */
export const ESTADOS_PROJETO = [
  "Kick-off",
  "Estrutura",
  "Design",
  "Aprovação do design",
  "Desenvolvimento",
  "Integrações",
  "Testes",
  "Aprovação final",
  "Deploy",
  "Entregue",
  "Em manutenção",
] as const;

export type EstadoProjeto = (typeof ESTADOS_PROJETO)[number];

/** §5.4 — tipo de solução. */
export const TIPOS_SOLUCAO = [
  "Website institucional",
  "Landing page / One-page",
  "E-commerce",
  "Redesign",
  "CRM",
  "Plataforma personalizada",
  "Sistema de reservas",
  "Área de cliente",
  "Outro",
] as const;

/** §5.12 — intervalo de investimento indicado pelo cliente. */
export const FAIXAS_ORCAMENTO = [
  "Menos de 500 €",
  "500–1.000 €",
  "1.000–2.000 €",
  "2.000–5.000 €",
  "5.000 €+",
  "Ainda não definido",
] as const;

export const ORIGENS_LEAD = [
  "Recomendação",
  "Contacto direto",
  "Website esDEV",
  "Redes sociais",
  "Prospeção",
  "Outro",
] as const;

export const TIPOS_FATURA = [
  "Adjudicação",
  "Marco intermédio",
  "Entrega final",
  "Manutenção",
  "Trabalho adicional",
  "Custos de terceiros",
] as const;

export const ESTADOS_FATURA = ["Pendente", "Paga", "Anulada"] as const;

/** §14 — planos de pagamento recomendados. */
export const PLANOS_PAGAMENTO = [
  {
    id: "50-50",
    nome: "50 / 50",
    descricao: "Projetos comuns: 50% na adjudicação, 50% antes da entrega.",
    marcos: [
      { tipo: "Adjudicação" as const, descricao: "Adjudicação (50%)", peso: 0.5 },
      { tipo: "Entrega final" as const, descricao: "Antes da entrega (50%)", peso: 0.5 },
    ],
  },
  {
    id: "40-30-30",
    nome: "40 / 30 / 30",
    descricao: "Projetos maiores, por marcos.",
    marcos: [
      { tipo: "Adjudicação" as const, descricao: "Início (40%)", peso: 0.4 },
      { tipo: "Marco intermédio" as const, descricao: "Durante o desenvolvimento (30%)", peso: 0.3 },
      { tipo: "Entrega final" as const, descricao: "Antes da entrega final (30%)", peso: 0.3 },
    ],
  },
] as const;

/** §17 — checklist de aprovação e entrega. */
export const CHECKLIST_ENTREGA = [
  "Website publicado",
  "Domínio configurado",
  "SSL ativo",
  "Formulários testados",
  "Mobile e desktop testados",
  "SEO técnico configurado, se contratado",
  "Analytics configurado, se contratado",
  "Backups configurados, quando aplicável",
  "Acessos entregues",
  "Documentação entregue",
  "Fatura final emitida",
  "Aceitação final arquivada",
] as const;

/** §25 — regras de ouro, mostradas no dashboard como lembrete operacional. */
export const REGRAS_DE_OURO = [
  "Não começar projetos relevantes sem condições escritas e contrato.",
  "Não dar preço definitivo antes de perceber o projeto.",
  "Definir claramente o âmbito e o que não está incluído.",
  "Limitar alterações incluídas.",
  "Cobrar trabalho adicional.",
  "Não financiar integralmente os projetos do cliente.",
  "Separar desenvolvimento de custos de terceiros.",
  "Registar aprovações.",
  "Definir responsabilidades do cliente.",
  "Não prometer resultados de SEO que não possam ser garantidos.",
  "Não vender tecnologia; vender solução e resultado.",
  "Não competir apenas pelo preço.",
  "Medir o tempo real gasto e ajustar preços com dados.",
  "Criar receita recorrente através de manutenção e suporte.",
] as const;

export type CampoBriefing = {
  id: string;
  label: string;
  tipo: "texto" | "area" | "numero" | "opcoes" | "multi";
  opcoes?: readonly string[];
};

export type SecaoBriefing = { id: string; titulo: string; campos: CampoBriefing[] };

/** §5 — briefing do cliente. */
export const BRIEFING: SecaoBriefing[] = [
  {
    id: "negocio",
    titulo: "5.2 Sobre o negócio",
    campos: [
      { id: "atividade", label: "O que faz a empresa?", tipo: "area" },
      { id: "produtos", label: "Principais produtos / serviços", tipo: "area" },
      { id: "clientes", label: "Quem são os principais clientes?", tipo: "area" },
      { id: "geografia", label: "Área geográfica de atuação", tipo: "texto" },
      { id: "diferenciacao", label: "O que diferencia a empresa da concorrência?", tipo: "area" },
    ],
  },
  {
    id: "objetivo",
    titulo: "5.3 Objetivo do projeto",
    campos: [
      { id: "pretende", label: "O que pretende desenvolver?", tipo: "area" },
      { id: "porque_agora", label: "Porque pretende desenvolver agora?", tipo: "area" },
      { id: "problema", label: "Qual é o problema atual?", tipo: "area" },
      { id: "objetivo", label: "Qual é o principal objetivo?", tipo: "area" },
      { id: "sucesso", label: "Como será avaliado o sucesso?", tipo: "area" },
    ],
  },
  {
    id: "solucao",
    titulo: "5.4 / 5.5 Solução e funcionalidades",
    campos: [
      { id: "tipo_solucao", label: "Tipo de solução", tipo: "opcoes", opcoes: TIPOS_SOLUCAO },
      {
        id: "funcionalidades",
        label: "Funcionalidades pretendidas",
        tipo: "multi",
        opcoes: [
          "Formulário de contacto",
          "WhatsApp",
          "Google Maps",
          "Newsletter",
          "Blog/CMS",
          "Pesquisa e filtros",
          "Reservas",
          "Área de cliente",
          "Login/registo",
          "Pagamentos",
          "Gestão de produtos/encomendas",
          "Multilingue",
          "Integrações com CRM/ERP/API",
          "Dashboards",
          "Automações",
        ],
      },
      { id: "paginas", label: "Nº de páginas / ecrãs previstos", tipo: "numero" },
    ],
  },
  {
    id: "ecommerce",
    titulo: "5.6 E-commerce (se aplicável)",
    campos: [
      { id: "produtos_num", label: "Número estimado de produtos", tipo: "numero" },
      { id: "variantes", label: "Variantes e categorias", tipo: "area" },
      { id: "stock", label: "Gestão de stock e cupões", tipo: "area" },
      {
        id: "pagamentos",
        label: "Pagamentos",
        tipo: "multi",
        opcoes: ["Cartão", "MB WAY", "Multibanco", "PayPal", "Transferência", "Outro"],
      },
      { id: "entregas", label: "Métodos de entrega e transportadoras", tipo: "area" },
    ],
  },
  {
    id: "plataforma",
    titulo: "5.7 CRM / Plataforma (se aplicável)",
    campos: [
      {
        id: "modulos",
        label: "Módulos necessários",
        tipo: "multi",
        opcoes: [
          "Leads",
          "Clientes e contactos",
          "Oportunidades",
          "Tarefas",
          "Projetos",
          "Documentos",
          "Imóveis/produtos/reservas",
          "Utilizadores e permissões",
          "Dashboards",
          "Integrações",
          "Migração de dados",
        ],
      },
      { id: "utilizadores", label: "Nº de utilizadores e perfis", tipo: "texto" },
      { id: "migracao", label: "Dados a migrar", tipo: "area" },
    ],
  },
  {
    id: "design",
    titulo: "5.8 Design e branding",
    campos: [
      {
        id: "ativos",
        label: "Ativos existentes",
        tipo: "multi",
        opcoes: [
          "Logótipo",
          "Cores",
          "Tipografia",
          "Manual de identidade",
          "Fotografias",
          "Vídeos",
        ],
      },
      { id: "referencias", label: "Referências visuais", tipo: "area" },
      {
        id: "percecao",
        label: "Perceção pretendida",
        tipo: "opcoes",
        opcoes: ["Moderna", "Premium", "Minimalista", "Tecnológica", "Profissional", "Outra"],
      },
    ],
  },
  {
    id: "conteudos",
    titulo: "5.9 Conteúdos",
    campos: [
      { id: "textos", label: "Quem fornece os textos?", tipo: "opcoes", opcoes: ["Cliente", "esDEV", "Misto"] },
      { id: "fotos", label: "Quem fornece as fotografias?", tipo: "opcoes", opcoes: ["Cliente", "esDEV", "Banco de imagens"] },
      { id: "dados", label: "Quem fornece produtos / dados?", tipo: "texto" },
      {
        id: "papel_esdev",
        label: "A esDEV estrutura ou também cria conteúdos?",
        tipo: "opcoes",
        opcoes: ["Apenas insere/estrutura", "Reformula", "Cria de origem"],
      },
    ],
  },
  {
    id: "seo",
    titulo: "5.10 SEO e presença digital",
    campos: [
      {
        id: "seo_itens",
        label: "Âmbito pretendido",
        tipo: "multi",
        opcoes: [
          "SEO técnico básico",
          "Google Search Console",
          "Google Analytics",
          "SEO local",
          "Otimização de páginas",
          "Google Business Profile",
          "Estratégia de conteúdo",
        ],
      },
    ],
  },
  {
    id: "prazo",
    titulo: "5.11 / 5.12 Prazo e orçamento",
    campos: [
      { id: "data_lancamento", label: "Data pretendida de lançamento", tipo: "texto" },
      { id: "motivo_data", label: "Motivo dessa data", tipo: "area" },
      { id: "urgente", label: "O projeto é urgente?", tipo: "opcoes", opcoes: ["Não", "Sim"] },
      { id: "orcamento", label: "Intervalo de investimento previsto", tipo: "opcoes", opcoes: FAIXAS_ORCAMENTO },
    ],
  },
  {
    id: "pos",
    titulo: "5.13 Pós-projeto",
    campos: [
      {
        id: "recorrentes",
        label: "Serviços recorrentes de interesse",
        tipo: "multi",
        opcoes: [
          "Manutenção técnica",
          "Alojamento",
          "Gestão de domínio",
          "Suporte contínuo",
          "Desenvolvimento contínuo",
          "SEO contínuo",
          "Formação",
        ],
      },
      { id: "notas", label: "Notas internas", tipo: "area" },
    ],
  },
];
