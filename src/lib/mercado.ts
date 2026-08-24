/**
 * Referências de mercado recolhidas em agosto de 2026 para calibrar as tabelas de
 * preços da esDEV. Servem de justificação interna: quando um cliente disser que o
 * preço é alto, é aqui que estão os números do mercado português.
 *
 * Rever pelo menos uma vez por ano, ou quando a esDEV tiver 10 projetos fechados
 * com horas reais medidas — dados próprios valem mais do que qualquer artigo.
 */

export const MERCADO_ATUALIZADO_EM = "Agosto de 2026";

/**
 * A esDEV é uma marca pessoal, não uma empresa com equipa. O posicionamento é o
 * de freelancer típico em Portugal: meio da faixa (Zaask / PME), sem valores de agência.
 */
export const POSICIONAMENTO =
  "Freelancer — meio da faixa dos freelancers portugueses (Zaask / PME), sem valores de agência.";

export type FaixaMercado = {
  servico: string;
  freelancer?: string;
  agencia?: string;
  esdev: string;
};

/** Faixas por tipo de projeto. */
export const FAIXAS_MERCADO: FaixaMercado[] = [
  {
    servico: "Landing page (1 página)",
    freelancer: "300–1.000 €",
    agencia: "500–2.000 €",
    esdev: "350–750 €",
  },
  {
    servico: "Site institucional (5–10 páginas)",
    freelancer: "1.000–5.000 €",
    agencia: "2.000–10.000 €",
    esdev: "1.200–2.100 €",
  },
  {
    servico: "Site médio de empresa (10–15 páginas)",
    freelancer: "3.500–7.000 €",
    agencia: "3.000–6.000 € típico",
    esdev: "2.000–3.800 €",
  },
  {
    servico: "E-commerce (até 100 produtos)",
    freelancer: "2.000–8.000 €",
    agencia: "3.000–15.000 €",
    esdev: "1.500–5.800 €",
  },
  {
    servico: "E-commerce à medida / com ERP",
    agencia: "10.000–50.000 €",
    esdev: "5.500–10.000 €",
  },
  {
    servico: "Plataforma com membros ou reservas",
    freelancer: "5.000–30.000 €",
    esdev: "2.800–6.000 €",
  },
  {
    servico: "Webapp / plataforma à medida",
    freelancer: "8.000–30.000 €",
    agencia: "15.000–80.000 €",
    esdev: "5.000–11.000 €",
  },
  {
    servico: "CRM — PME pequena (5–15 utilizadores)",
    agencia: "3.000–8.000 €",
    esdev: "2.800–5.000 €",
  },
  {
    servico: "CRM — PME média (15–50 utilizadores)",
    agencia: "8.000–25.000 €",
    esdev: "5.000–9.500 €",
  },
  {
    servico: "CRM complexo com integrações",
    agencia: "25.000–80.000 €",
    esdev: "10.000–20.000 € (exige parceria)",
  },
  {
    servico: "Manutenção técnica",
    agencia: "40–150 €/mês",
    esdev: "29–59 €/mês (Basic)",
  },
  {
    servico: "Manutenção com conteúdos e banco de horas",
    agencia: "150–400 €/mês",
    esdev: "79–149 €/mês (Business)",
  },
  {
    servico: "Gestão completa com SEO contínuo",
    agencia: "400–750 €/mês",
    esdev: "179–349 €/mês (Pro)",
  },
  {
    servico: "Trabalho avulso à hora",
    freelancer: "20–60 €/h (web) · 40–80 €/h (SEO e correções)",
    esdev: "30–50 €/h",
  },
  {
    servico: "Valor/hora de programação freelance",
    freelancer: "30–80 €/h (júnior 25–35, sénior 60–75)",
    esdev: "piso 32 €/h · alvo 45 €/h",
  },
];

export type FonteMercado = { titulo: string; url: string; nota: string };

export const FONTES_MERCADO: FonteMercado[] = [
  {
    titulo: "Modular Digital — Quanto custa criar um site (Portugal, 2026)",
    url: "https://modulardigital.pt/artigos/quanto-custa-criar-site-portugal-2026",
    nota: "Tabela agência / freelancer / DIY por tipo de projeto, incluindo webapp e e-commerce com ERP.",
  },
  {
    titulo: "Modular Digital — Quanto custa a manutenção de um site (2026)",
    url: "https://modulardigital.pt/artigos/quanto-custa-manutencao-site-portugal-2026",
    nota: "Manutenção técnica 40–150 €/mês, com conteúdos 150–400 €/mês, gestão completa 400–750 €/mês, avulso 40–80 €/h.",
  },
  {
    titulo: "PortugalSEO — Quanto custa criar um site em Portugal",
    url: "https://portugalseo.pt/quanto-custa-criar-site-portugal-precos/",
    nota: "Freelancers a 20–60 €/h; institucional básico 800–1.200 € no Zaask/Fixando; PME típica 1.000–5.000 €.",
  },
  {
    titulo: "DEMARCA — Quanto custa fazer um site",
    url: "https://www.designdemarca.pt/fazer-um-site-quanto-custa/",
    nota: "Freelancer 25–75 €/h; site de 5–8 páginas 1.500–3.500 €; 10–15 páginas 3.500–7.000 €.",
  },
  {
    titulo: "digitalXperience — Custo de criar um site profissional em Portugal",
    url: "https://digitalxperience.pt/custo-criar-um-site-profissional-em-portugal/",
    nota: "Landing 300–1.200 €; institucional 800–4.000 €; loja 2.500–15.000 €; plataforma com reservas 5.000–30.000 €.",
  },
  {
    titulo: "Netwods — Quanto custa criar um site em Portugal em 2026",
    url: "https://netwods.com/quanto-custa-criar-um-site-em-portugal/",
    nota: "Integrações por API 900–2.000 €; CMS headless 1.200–2.500 €; manutenção desde 80 €/mês.",
  },
  {
    titulo: "TrueNebula — Quanto custa uma loja online em Portugal em 2026",
    url: "https://www.truenebula.com/blog/quanto-custa-loja-online-ecommerce-portugal",
    nota: "Shopify 2.000–8.000 €, WooCommerce 3.000–10.000 €, custom/headless 8.000–25.000 €, por nível de personalização.",
  },
  {
    titulo: "Avessas — Quanto custa implementar um CRM em Portugal (2026)",
    url: "https://avessas.com/blog/quanto-custa-implementar-crm-portugal",
    nota: "Implementação 3.000–8.000 € (PME pequena), 8.000–25.000 € (média), 25.000–80.000 € (complexa); integrações 500–5.000 € cada.",
  },
  {
    titulo: "The2410 — Desenvolvimento de CRM personalizado",
    url: "https://2410.pt/pt/service/b2b-crm",
    nota: "CRM padrão 10.000–25.000 €, avançado 25.000–50.000 €, com garantia estendida de 250–450 €/mês.",
  },
  {
    titulo: "Modular Digital — Quanto custa SEO em Portugal (2026)",
    url: "https://modulardigital.pt/artigos/quanto-custa-seo-portugal-2026",
    nota: "Mandato mensal 600–2.500 €/mês; auditoria 800–2.500 €; freelancers 40–80 €/h.",
  },
  {
    titulo: "SimuladorNeto — Calculadora de tarifa hora freelancer 2026",
    url: "https://simuladorneto.pt/calculadora-tarifa-freelancer-2026",
    nota: "Programadores freelance 30–80 €/h. Segurança Social equivale a ~15% da faturação bruta a partir do 2.º ano.",
  },
];
