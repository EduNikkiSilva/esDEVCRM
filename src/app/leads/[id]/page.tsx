import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BriefingForm } from "@/components/briefing-form";
import { CalculadoraPrecos } from "@/components/calculadora-precos";
import { FormularioAcao } from "@/components/formulario-acao";
import { TimelineAtividades } from "@/components/timeline-atividades";
import { Campo, CampoSelect, PageHeader, Vazio } from "@/components/ui-kit";
import {
  apagarLead,
  atualizarLead,
  converterEmProjeto,
  criarProposta,
  mudarEstadoProposta,
  registarPerda,
} from "@/lib/actions";
import { diasAte } from "@/lib/datas";
import {
  COR_FASE,
  COR_PROPOSTA,
  ESTADOS_PROPOSTA,
  FAIXAS_ORCAMENTO,
  FASES,
  MOTIVOS_PERDA,
  ORIGENS_LEAD,
  PLANOS_PAGAMENTO,
  TIPOS_SOLUCAO,
  type EstadoProposta,
  type Fase,
} from "@/lib/dominio";
import { data, eur, eur2 } from "@/lib/format";
import { NIVEIS_PROPOSTA, type InputsCalculadora } from "@/lib/pricing";
import {
  listarAnalises,
  listarAtividades,
  listarPropostas,
  obterBriefing,
  obterLead,
} from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await obterLead(Number(id));
  if (!lead) notFound();

  const briefing = await obterBriefing(lead.id);
  const analises = await listarAnalises(lead.id);
  const ultima = analises[0];
  const propostas = await listarPropostas(lead.id);
  const atividades = await listarAtividades({ leadId: lead.id });
  const inputsIniciais = ultima
    ? (JSON.parse(ultima.inputs) as InputsCalculadora)
    : undefined;

  const proxima = atividades.find((a) => !a.concluida);
  const ultimoContacto = atividades.find((a) => a.concluida);
  const diasProxima = diasAte(proxima?.data);

  return (
    <>
      <PageHeader titulo={lead.empresa} descricao={lead.notas ?? undefined}>
        <Badge variant="outline" className={`self-center ${COR_FASE[lead.fase as Fase]}`}>
          {lead.fase}
        </Badge>
        <Button asChild variant="outline">
          <Link href="/leads">Voltar ao pipeline</Link>
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Info rotulo="Contacto" valor={lead.contacto_nome ?? "—"} />
        <Info rotulo="Email" valor={lead.email ?? "—"} />
        <Info rotulo="Telefone" valor={lead.telefone ?? "—"} />
        <Info rotulo="Valor estimado" valor={eur(lead.valor_estimado)} />
        <Info rotulo="Último contacto" valor={ultimoContacto ? data(ultimoContacto.data) : "—"} />
        <Info
          rotulo="Próxima ação"
          valor={proxima ? `${proxima.titulo} · ${data(proxima.data)}` : "Sem follow-up"}
          tom={!proxima ? "alerta" : diasProxima !== null && diasProxima < 0 ? "mau" : "normal"}
        />
      </div>

      <Tabs defaultValue="dados">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="atividade">
            Atividade ({atividades.length})
          </TabsTrigger>
          <TabsTrigger value="briefing">Briefing</TabsTrigger>
          <TabsTrigger value="preco">Análise &amp; preço</TabsTrigger>
          <TabsTrigger value="propostas">Propostas ({propostas.length})</TabsTrigger>
          <TabsTrigger value="projeto">Converter em projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card className="max-w-3xl">
            <CardContent>
              <form action={atualizarLead} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="id" value={lead.id} />
                <Campo nome="empresa" label="Empresa / Nome" valor={lead.empresa} obrigatorio />
                <Campo nome="contacto_nome" label="Pessoa de contacto" valor={lead.contacto_nome} />
                <Campo nome="email" label="Email" tipo="email" valor={lead.email} />
                <Campo nome="telefone" label="Telefone" valor={lead.telefone} />
                <CampoSelect nome="fase" label="Fase" opcoes={FASES} valor={lead.fase} />
                <CampoSelect
                  nome="origem"
                  label="Origem"
                  opcoes={ORIGENS_LEAD}
                  valor={lead.origem}
                  vazioLabel="—"
                />
                <CampoSelect
                  nome="tipo_solucao"
                  label="Tipo de solução"
                  opcoes={TIPOS_SOLUCAO}
                  valor={lead.tipo_solucao}
                  vazioLabel="A definir"
                />
                <CampoSelect
                  nome="orcamento_indicado"
                  label="Investimento indicado"
                  opcoes={FAIXAS_ORCAMENTO}
                  valor={lead.orcamento_indicado}
                />
                <Campo
                  nome="valor_estimado"
                  label="Valor estimado (€)"
                  tipo="number"
                  step="10"
                  valor={lead.valor_estimado}
                />
                <Campo nome="responsavel" label="Responsável" valor={lead.responsavel} />
                <CampoSelect
                  nome="motivo_perda"
                  label="Motivo de perda"
                  opcoes={MOTIVOS_PERDA}
                  valor={lead.motivo_perda}
                  vazioLabel="—"
                />
                <div className="sm:col-span-2">
                  <Campo nome="notas" label="Notas" area valor={lead.notas} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">Guardar</Button>
                </div>
              </form>

              {lead.fase !== "Perdido" ? (
                <>
                  <Separator className="my-6" />
                  <form action={registarPerda} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={lead.id} />
                    <CampoSelect
                      nome="motivo_perda"
                      label="Marcar como perdida — motivo"
                      opcoes={MOTIVOS_PERDA}
                      className="min-w-56"
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Registar perda
                    </Button>
                  </form>
                </>
              ) : null}

              <Separator className="my-6" />
              <form action={apagarLead}>
                <input type="hidden" name="id" value={lead.id} />
                <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="size-4" /> Apagar lead
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atividade">
          <TimelineAtividades
            atividades={atividades}
            alvo={{ leadId: lead.id, clienteId: lead.cliente_id ?? undefined }}
            titulo="Histórico e próximas ações"
          />
        </TabsContent>

        <TabsContent value="briefing">
          <BriefingForm
            leadId={lead.id}
            dadosIniciais={briefing ? JSON.parse(briefing.dados) : {}}
          />
        </TabsContent>

        <TabsContent value="preco">
          {analises.length > 0 ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Análises guardadas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border/60 text-sm">
                  {analises.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                      <span className="font-medium">{a.titulo}</span>
                      <span className="text-muted-foreground">{data(a.criado_em)}</span>
                      <span className="tabular-nums">
                        {eur(a.preco_minimo)} · <strong>{eur(a.preco_recomendado)}</strong> ·{" "}
                        {eur(a.preco_premium)}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {eur(a.mensalidade)}/mês · {eur2(a.valor_hora ?? 0)}/h
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
          <CalculadoraPrecos
            leadId={lead.id}
            inputsIniciais={inputsIniciais}
            titulo={lead.empresa}
          />
        </TabsContent>

        <TabsContent value="propostas">
          {!ultima ? (
            <Vazio titulo="Calcule o preço primeiro.">
              As propostas usam os escalões da última análise interna guardada.
            </Vazio>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {NIVEIS_PROPOSTA.map((nivel) => {
                const valor =
                  nivel.escalao === "minimo"
                    ? ultima.preco_minimo
                    : nivel.escalao === "recomendado"
                      ? ultima.preco_recomendado
                      : ultima.preco_premium;
                return (
                  <Card key={nivel.id} className={nivel.id === "BUSINESS" ? "border-primary" : ""}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        {nivel.nome}
                        {nivel.id === "BUSINESS" ? <Badge>Recomendada</Badge> : null}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{nivel.descricao}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold tabular-nums">{eur(valor)}</p>
                      <p className="mb-4 text-xs text-muted-foreground">
                        + {eur(ultima.mensalidade)}/mês de manutenção
                      </p>
                      <FormularioAcao action={criarProposta} className="space-y-3" sucesso="Proposta criada">
                        <input type="hidden" name="lead_id" value={lead.id} />
                        <input type="hidden" name="analise_id" value={ultima.id} />
                        <input type="hidden" name="nivel" value={nivel.id} />
                        <input type="hidden" name="valor" value={valor} />
                        <input type="hidden" name="mensalidade" value={ultima.mensalidade} />
                        <Campo
                          nome="ambito"
                          label="Âmbito incluído"
                          area
                          placeholder="Funcionalidades e páginas incluídas…"
                        />
                        <Campo
                          nome="exclusoes"
                          label="O que não está incluído"
                          area
                          placeholder="Conteúdos, fotografia, licenças…"
                        />
                        <Campo
                          nome="condicoes"
                          label="Condições"
                          area
                          placeholder="Pagamento, prazos, responsabilidades do cliente…"
                        />
                        <Campo
                          nome="observacoes"
                          label="Observações internas"
                          area
                          placeholder="Notas que não vão para o cliente."
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Campo
                            nome="rondas_alteracoes"
                            label="Rondas de alterações"
                            tipo="number"
                            valor={2}
                          />
                          <Campo
                            nome="validade_dias"
                            label="Validade (dias)"
                            tipo="number"
                            valor={30}
                          />
                        </div>
                        <Button type="submit" variant={nivel.id === "BUSINESS" ? "default" : "outline"} className="w-full">
                          Criar proposta {nivel.nome}
                        </Button>
                      </FormularioAcao>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {propostas.length > 0 ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Propostas desta lead</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border/60">
                  {propostas.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                      {p.numero ? (
                        <span className="text-xs font-medium tabular-nums text-muted-foreground">
                          {p.numero}
                        </span>
                      ) : null}
                      <Badge variant="outline">{p.nivel}</Badge>
                      <Badge variant="outline" className={COR_PROPOSTA[p.estado as EstadoProposta]}>
                        {p.estado}
                      </Badge>
                      <span className="font-semibold tabular-nums">{eur(p.valor)}</span>
                      <span className="text-xs text-muted-foreground">
                        {eur(p.mensalidade)}/mês · {p.rondas_alteracoes} rondas
                        {p.enviada_em ? ` · enviada ${data(p.enviada_em)}` : ""}
                        {p.expira_em ? ` · expira ${data(p.expira_em)}` : ` · válida ${p.validade_dias} dias`}
                        {p.respondida_em ? ` · resposta ${data(p.respondida_em)}` : ""}
                      </span>
                      <form action={mudarEstadoProposta} className="ml-auto flex items-center gap-2">
                        <input type="hidden" name="id" value={p.id} />
                        <select
                          name="estado"
                          defaultValue={p.estado}
                          className="h-8 rounded-md border border-border px-2 text-xs"
                        >
                          {ESTADOS_PROPOSTA.map((e) => (
                            <option key={e} value={e}>
                              {e}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" size="sm" variant="outline">
                          Atualizar
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="projeto">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="text-base">Converter em projeto</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cria o cliente (se ainda não existir), o projeto, as faturas do plano de pagamento
                escolhido e, se indicado, o contrato de manutenção.
              </p>
            </CardHeader>
            <CardContent>
              <form action={converterEmProjeto} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="lead_id" value={lead.id} />
                <Campo nome="nome" label="Nome do projeto" valor={lead.empresa} obrigatorio />
                <Campo
                  nome="pacote"
                  label="Pacote"
                  valor={ultima?.titulo ?? lead.tipo_solucao ?? ""}
                />
                <Campo
                  nome="preco"
                  label="Preço adjudicado (€)"
                  tipo="number"
                  step="10"
                  valor={ultima?.preco_recomendado ?? lead.valor_estimado}
                />
                <Campo nome="custos_externos" label="Custos externos (€)" tipo="number" valor={0} />
                <Campo
                  nome="horas_estimadas"
                  label="Horas estimadas"
                  tipo="number"
                  valor={ultima?.horas_estimadas ?? 0}
                />
                <CampoSelect
                  nome="plano_pagamento"
                  label="Plano de pagamento"
                  opcoes={PLANOS_PAGAMENTO.map((p) => ({ valor: p.id, label: `${p.nome} — ${p.descricao}` }))}
                />
                <Campo nome="inicio" label="Início" tipo="date" />
                <Campo nome="entrega_prevista" label="Entrega prevista" tipo="date" />
                <Campo
                  nome="mensalidade"
                  label="Manutenção (€/mês, 0 = sem contrato)"
                  tipo="number"
                  valor={ultima?.mensalidade ?? 0}
                />
                <CampoSelect
                  nome="plano_manutencao"
                  label="Plano de manutenção"
                  opcoes={[
                    { valor: "basic", label: "Basic" },
                    { valor: "business", label: "Business" },
                    { valor: "pro", label: "Pro" },
                  ]}
                  valor={ultima?.plano_manutencao ?? "basic"}
                />
                <div className="sm:col-span-2">
                  <Campo nome="notas" label="Notas do projeto" area />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">
                    Criar projeto <ArrowUpRight className="size-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

const TOM_INFO = {
  normal: "border-border bg-card",
  alerta: "border-warning/40 bg-warning/5",
  mau: "border-destructive/40 bg-destructive/5",
} as const;

function Info({
  rotulo,
  valor,
  tom = "normal",
}: {
  rotulo: string;
  valor: string;
  tom?: keyof typeof TOM_INFO;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${TOM_INFO[tom]}`}>
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{rotulo}</p>
      <p className="truncate text-sm font-medium" title={valor}>
        {valor}
      </p>
    </div>
  );
}
