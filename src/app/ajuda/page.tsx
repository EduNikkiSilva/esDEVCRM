import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CalendarCheck,
  Database,
  FileText,
  FolderKanban,
  Keyboard,
  Receipt,
  Repeat,
  UserPlus,
} from "lucide-react";
import { LogoEsdev } from "@/components/logotipo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-kit";

export const metadata = { title: "Como usar" };

const PASSOS = [
  {
    icone: UserPlus,
    titulo: "1. Entra um contacto",
    href: "/leads/nova",
    accao: "Nova lead",
    texto:
      "Registas empresa, contacto e origem. Não precisas de mais nada nesta fase — a lead nasce em «Novo Lead» e o resto preenche-se pelo caminho.",
  },
  {
    icone: FolderKanban,
    titulo: "2. Reunião de descoberta",
    href: "/leads",
    accao: "Pipeline",
    texto:
      "Arrasta a lead para «Reunião marcada» e, no separador Briefing da lead, preenche o que souberes durante a conversa. A barra mostra quantos campos faltam.",
  },
  {
    icone: Calculator,
    titulo: "3. Análise interna e preço",
    href: "/calculadora",
    accao: "Calculadora",
    texto:
      "No separador «Análise & preço» escolhes o pacote, somas os extras e avalias complexidade, urgência e risco de 1 a 5. Guardar fixa os três escalões na lead. Nunca dês preço antes deste passo.",
  },
  {
    icone: FileText,
    titulo: "4. Proposta em três níveis",
    href: "/propostas",
    accao: "Propostas",
    texto:
      "Essential, Business e Premium saem dos escalões da análise. Escreves o âmbito, o que não está incluído e as rondas de alterações. Marcar como «Enviada» move a lead no pipeline.",
  },
  {
    icone: CalendarCheck,
    titulo: "5. Aceite → projeto",
    href: "/projetos",
    accao: "Projetos",
    texto:
      "No separador «Converter em projeto» escolhes o plano de pagamento (50/50 ou 40/30/30). Numa ação, cria o cliente, o projeto, as faturas dos marcos e o contrato de manutenção.",
  },
  {
    icone: Receipt,
    titulo: "6. Durante o projeto",
    href: "/faturas",
    accao: "Faturação",
    texto:
      "Avanças a fase de desenvolvimento, registas as horas reais, marcas faturas como pagas e fechas a checklist de entrega. As horas reais são o que faz o €/h efetivo aparecer.",
  },
  {
    icone: Repeat,
    titulo: "7. Entregue → manutenção",
    href: "/manutencao",
    accao: "Manutenção",
    texto:
      "Com a entrega feita, o contrato passa a contar na receita recorrente. É a diferença entre vender projetos e ter uma base de receita previsível.",
  },
];

const ROTINAS = [
  {
    quando: "Todos os dias",
    itens: [
      "Abrir o Dashboard e ver «Em falta» — o que já devia estar pago.",
      "Passar os olhos pelo pipeline: alguma lead parada há mais de uma semana?",
      "Registar as horas que trabalhaste em cada projeto, ainda com a memória fresca.",
    ],
  },
  {
    quando: "Todas as semanas",
    itens: [
      "Fazer seguimento das propostas em «Enviada» — sem seguimento, morrem.",
      "Atualizar a fase dos projetos e a checklist de entrega.",
      "Marcar como «Perdido» o que já não vai acontecer, com o motivo nas notas.",
    ],
  },
  {
    quando: "Todos os meses",
    itens: [
      "Comparar o €/h efetivo de cada projeto fechado com o mínimo de 45 €/h.",
      "Emitir as faturas de manutenção do mês.",
      "Se um tipo de projeto der sempre menos de 45 €/h, corrigir a tabela em Referências.",
    ],
  },
];

export default function AjudaPage() {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <LogoEsdev tagline className="h-16 text-[#0a1b4d] dark:text-white" />
        <Badge variant="outline" className="self-start sm:self-end">
          Sistema operacional e comercial v1
        </Badge>
      </div>

      <PageHeader
        titulo="Como usar o CRM"
        descricao="O caminho de um contacto até receita recorrente, com as rotinas que mantêm o sistema vivo. Cada passo tem uma página correspondente na aplicação."
      />

      <section className="grid gap-3 lg:grid-cols-2">
        {PASSOS.map(({ icone: Icone, titulo, texto, href, accao }) => (
          <Card key={titulo}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icone className="size-4" />
                </span>
                <div>
                  <CardTitle className="text-sm">{titulo}</CardTitle>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{texto}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant="outline">
                <Link href={href}>
                  {accao} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-3 lg:grid-cols-3">
        {ROTINAS.map((r) => (
          <Card key={r.quando}>
            <CardHeader>
              <CardTitle className="text-sm">{r.quando}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {r.itens.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted-foreground/40">•</span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Keyboard className="size-4" /> Para andar mais depressa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <kbd className="rounded border px-1.5 py-0.5 font-mono text-[11px]">Ctrl</kbd>{" "}
                <kbd className="rounded border px-1.5 py-0.5 font-mono text-[11px]">K</kbd> abre a
                pesquisa: escreve o nome de uma lead, cliente ou projeto e salta logo para lá.
              </li>
              <li>No pipeline, arrasta os cartões entre colunas para mudar de fase.</li>
              <li>
                A tabela de preços e as faixas de mercado estão em{" "}
                <Link href="/referencias" className="underline underline-offset-2">
                  Referências
                </Link>
                , para justificares um valor a meio de uma chamada.
              </li>
              <li>O tema claro/escuro muda no fundo da barra lateral.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="size-4" /> Os teus dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Tudo o que escreves aqui vive num único ficheiro no teu computador:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">data/esdev.db</code>. Não há
              nuvem, não há conta, não há ninguém a ver.
            </p>
            <p>
              Copiar esse ficheiro é copiar o sistema todo — é a tua cópia de segurança. O guia de
              instalação explica como automatizar isso e como abrir o CRM no telemóvel na rede de
              casa.
            </p>
            <p className="text-foreground">
              Não começar projetos sem contrato, não dar preço antes de perceber o projeto, e medir
              sempre o tempo real. O resto é seguir o pipeline.
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
