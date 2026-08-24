import {
  BookOpen,
  CircleQuestionMark,
  Calculator,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Link = {
  href: string;
  label: string;
  icon: LucideIcon;
  descricao: string;
};

export type GrupoNav = { titulo: string; links: Link[] };

export const NAVEGACAO: GrupoNav[] = [
  {
    titulo: "Comercial",
    links: [
      {
        href: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
        descricao: "Pipeline, receita e rentabilidade",
      },
      {
        href: "/leads",
        label: "Pipeline",
        icon: FolderKanban,
        descricao: "Leads por fase, de contacto a manutenção",
      },
      {
        href: "/calculadora",
        label: "Calculadora",
        icon: Calculator,
        descricao: "Preço mínimo, recomendado e premium",
      },
      {
        href: "/propostas",
        label: "Propostas",
        icon: FileText,
        descricao: "Essential, Business e Premium",
      },
    ],
  },
  {
    titulo: "Entrega",
    links: [
      {
        href: "/projetos",
        label: "Projetos",
        icon: FolderKanban,
        descricao: "Fases, horas reais e checklist de entrega",
      },
      {
        href: "/clientes",
        label: "Clientes",
        icon: Users,
        descricao: "Dados de faturação e histórico",
      },
    ],
  },
  {
    titulo: "Financeiro",
    links: [
      {
        href: "/faturas",
        label: "Faturação",
        icon: Receipt,
        descricao: "Marcos de pagamento e valores em falta",
      },
      {
        href: "/manutencao",
        label: "Manutenção",
        icon: LifeBuoy,
        descricao: "Contratos e receita recorrente",
      },
    ],
  },
  {
    titulo: "Sistema",
    links: [
      {
        href: "/referencias",
        label: "Referências",
        icon: BookOpen,
        descricao: "Tabelas de preços, mercado e checklists",
      },
      {
        href: "/ajuda",
        label: "Como usar",
        icon: CircleQuestionMark,
        descricao: "O fluxo de trabalho e as rotinas do sistema",
      },
    ],
  },
];

export const TODOS_LINKS = NAVEGACAO.flatMap((g) => g.links);

const TITULOS: Record<string, string> = {
  "/": "Dashboard",
  "/leads": "Pipeline",
  "/leads/nova": "Nova lead",
  "/calculadora": "Calculadora de preços",
  "/propostas": "Propostas",
  "/projetos": "Projetos",
  "/clientes": "Clientes",
  "/faturas": "Faturação",
  "/manutencao": "Manutenção",
  "/referencias": "Referências",
  "/ajuda": "Como usar",
};

export function tituloDaRota(pathname: string) {
  if (TITULOS[pathname]) return TITULOS[pathname];
  const base = `/${pathname.split("/")[1] ?? ""}`;
  return TITULOS[base] ?? "esDEV CRM";
}
