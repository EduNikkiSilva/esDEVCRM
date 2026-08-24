import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui-kit";
import {
  CHECKLIST_ENTREGA,
  FASES,
  PLANOS_PAGAMENTO,
  REGRAS_DE_OURO,
} from "@/lib/dominio";
import { eur } from "@/lib/format";
import { FAIXAS_MERCADO, FONTES_MERCADO, MERCADO_ATUALIZADO_EM } from "@/lib/mercado";
import {
  EXTRAS,
  PACOTES,
  PLANOS_MANUTENCAO,
  TARIFA_HORA_ADICIONAL,
  VALOR_HORA_INTERNO,
} from "@/lib/pricing";

const PROCESSO = [
  "Lead",
  "Contacto",
  "Reunião/Discovery",
  "Briefing",
  "Análise interna",
  "Estimativa",
  "Proposta",
  "Aceitação",
  "Contrato",
  "Pagamento inicial",
  "Kick-off",
  "Design",
  "Aprovação",
  "Desenvolvimento",
  "Testes",
  "Aprovação final",
  "Pagamento final",
  "Deploy",
  "Entrega",
  "Manutenção/Suporte",
];

const CONTRATO = [
  "Identificação das partes",
  "Objeto e âmbito do projeto",
  "Serviços incluídos e excluídos",
  "Preço, impostos e condições de pagamento",
  "Prazos e responsabilidades do cliente",
  "Alterações e funcionalidades adicionais",
  "Processo de aprovação",
  "Propriedade intelectual e confidencialidade",
  "Proteção de dados (RGPD)",
  "Manutenção e suporte",
  "Cancelamento, responsabilidade e aceitação",
  "Lei aplicável e foro",
];

export default function ReferenciasPage() {
  return (
    <>
      <PageHeader
        titulo="Referências internas"
        descricao="As tabelas e checklists do documento operacional, sempre à mão. Preços de referência V1 para Portugal — a rever com dados reais."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Mercado português vs. esDEV — {MERCADO_ATUALIZADO_EM}
            </CardTitle>
            <p className="text-sm text-slate-500">
              Faixas recolhidas em publicações portuguesas de preços. O posicionamento da esDEV é o
              do §2: acima do freelancer de entrada, abaixo da agência.
            </p>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>esDEV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FAIXAS_MERCADO.map((f) => (
                  <TableRow key={f.servico}>
                    <TableCell className="font-medium">{f.servico}</TableCell>
                    <TableCell className="text-slate-500">{f.freelancer ?? "—"}</TableCell>
                    <TableCell className="text-slate-500">{f.agencia ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{f.esdev}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-6 pt-4">
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Fontes
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {FONTES_MERCADO.map((f) => (
                  <li key={f.url}>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline decoration-slate-300 underline-offset-2 hover:decoration-slate-900"
                    >
                      {f.titulo}
                    </a>
                    <span className="text-slate-500"> — {f.nota}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                Rever anualmente, ou assim que houver 10 projetos fechados com horas reais medidas:
                dados próprios valem mais do que qualquer artigo.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tabela de preços esDEV V2</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pacote</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Recomendado</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PACOTES.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-slate-500">
                      {p.categoria}
                      <span className="block text-xs text-slate-400">{p.mercado}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{eur(p.minimo)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {eur(p.recomendado)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{eur(p.premium)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="px-6 pt-4 text-xs text-slate-500">
              O Website Business é o produto principal para PMEs. Valor/hora interno mínimo:{" "}
              {eur(VALOR_HORA_INTERNO)}/h — serve para validar rentabilidade, não para apresentar ao
              cliente. Trabalho avulso fora do âmbito: {eur(TARIFA_HORA_ADICIONAL.minimo)}–
              {eur(TARIFA_HORA_ADICIONAL.maximo)}/h.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extras e fatores (§9)</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extra</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Faixa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EXTRAS.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell className="text-slate-500">{e.grupo}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.minimo === e.premium ? eur(e.recomendado) : `${eur(e.minimo)} – ${eur(e.premium)}`}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Desenvolvimento prioritário</TableCell>
                  <TableCell className="text-slate-500">Fator</TableCell>
                  <TableCell className="text-right">+10%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Urgência</TableCell>
                  <TableCell className="text-slate-500">Fator</TableCell>
                  <TableCell className="text-right">+20% a +30%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Trabalho avulso à hora</TableCell>
                  <TableCell className="text-slate-500">Fora do âmbito</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {eur(TARIFA_HORA_ADICIONAL.minimo)}–{eur(TARIFA_HORA_ADICIONAL.maximo)}/h
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planos de manutenção (§19)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PLANOS_MANUTENCAO.map((p) => (
                <div key={p.id}>
                  <p className="text-sm font-semibold">
                    {p.nome}{" "}
                    <span className="font-normal text-slate-500 tabular-nums">
                      {eur(p.minimo)}–{eur(p.maximo)}/mês
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">{p.inclui}</p>
                  <p className="text-xs text-slate-400">Mercado: {p.mercado}</p>
                </div>
              ))}
              <p className="text-xs text-slate-500">
                Desenvolvimento adicional: {eur(TARIFA_HORA_ADICIONAL.minimo)}–
                {eur(TARIFA_HORA_ADICIONAL.maximo)}/h.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Condições de pagamento (§14)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PLANOS_PAGAMENTO.map((p) => (
                <div key={p.id}>
                  <p className="text-sm font-semibold">{p.nome}</p>
                  <p className="text-sm text-slate-600">{p.descricao}</p>
                </div>
              ))}
              <p className="text-xs text-slate-500">
                O preço inclui até duas rondas de alterações sobre o âmbito aprovado; fora do âmbito
                é orçamentado à parte (§13).
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processo completo (§3)</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-wrap gap-1.5">
              {PROCESSO.map((p, i) => (
                <li key={p}>
                  <Badge variant="outline" className="font-normal">
                    {i + 1}. {p}
                  </Badge>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-slate-500">
              Pipeline no CRM: {FASES.filter((f) => f !== "Perdido").join(" → ")}.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regras de ouro (§25)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                {REGRAS_DE_OURO.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-slate-300">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist de entrega (§17)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                {CHECKLIST_ENTREGA.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="text-slate-300">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cláusulas do contrato (§12)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                {CONTRATO.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="text-slate-300">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                O modelo de contrato deve ser revisto por advogado ou solicitador antes de ser usado
                como definitivo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
