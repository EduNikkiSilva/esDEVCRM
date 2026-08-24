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
import { Campo, CampoSelect, PageHeader, Vazio } from "@/components/ui-kit";
import {
  apagarLead,
  atualizarLead,
  converterEmProjeto,
  criarProposta,
  mudarEstadoProposta,
} from "@/lib/actions";
import {
  COR_FASE,
  FAIXAS_ORCAMENTO,
  FASES,
  ORIGENS_LEAD,
  PLANOS_PAGAMENTO,
  TIPOS_SOLUCAO,
  type Fase,
} from "@/lib/dominio";
import { data, eur, eur2 } from "@/lib/format";
import { NIVEIS_PROPOSTA, type InputsCalculadora } from "@/lib/pricing";
import { listarAnalises, listarPropostas, obterBriefing, obterLead } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = obterLead(Number(id));
  if (!lead) notFound();

  const briefing = obterBriefing(lead.id);
  const analises = listarAnalises(lead.id);
  const ultima = analises[0];
  const propostas = listarPropostas(lead.id);
  const inputsIniciais = ultima
    ? (JSON.parse(ultima.inputs) as InputsCalculadora)
    : undefined;

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

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Info rotulo="Contacto" valor={lead.contacto_nome ?? "—"} />
        <Info rotulo="Email" valor={lead.email ?? "—"} />
        <Info rotulo="Telefone" valor={lead.telefone ?? "—"} />
        <Info rotulo="Valor estimado" valor={eur(lead.valor_estimado)} />
      </div>

      <Tabs defaultValue="dados">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="dados">Dados</TabsTrigger>
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
                <div className="sm:col-span-2">
                  <Campo nome="notas" label="Notas" area valor={lead.notas} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">Guardar</Button>
                </div>
              </form>

              <Separator className="my-6" />
              <form action={apagarLead}>
                <input type="hidden" name="id" value={lead.id} />
                <Button type="submit" variant="ghost" size="sm" className="text-rose-600">
                  <Trash2 className="size-4" /> Apagar lead
                </Button>
              </form>
            </CardContent>
          </Card>
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
                <ul className="divide-y divide-slate-100 text-sm">
                  {analises.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                      <span className="font-medium">{a.titulo}</span>
                      <span className="text-slate-500">{data(a.criado_em)}</span>
                      <span className="tabular-nums">
                        {eur(a.preco_minimo)} · <strong>{eur(a.preco_recomendado)}</strong> ·{" "}
                        {eur(a.preco_premium)}
                      </span>
                      <span className="text-slate-500 tabular-nums">
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
                  <Card key={nivel.id} className={nivel.id === "BUSINESS" ? "border-slate-900" : ""}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        {nivel.nome}
                        {nivel.id === "BUSINESS" ? <Badge>Recomendada</Badge> : null}
                      </CardTitle>
                      <p className="text-xs text-slate-500">{nivel.descricao}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold tabular-nums">{eur(valor)}</p>
                      <p className="mb-4 text-xs text-slate-500">
                        + {eur(ultima.mensalidade)}/mês de manutenção
                      </p>
                      <form action={criarProposta} className="space-y-3">
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
                      </form>
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
                <ul className="divide-y divide-slate-100">
                  {propostas.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                      <Badge variant="outline">{p.nivel}</Badge>
                      <span className="font-semibold tabular-nums">{eur(p.valor)}</span>
                      <span className="text-xs text-slate-500">
                        {eur(p.mensalidade)}/mês · {p.rondas_alteracoes} rondas · válida{" "}
                        {p.validade_dias} dias · criada {data(p.criado_em)}
                      </span>
                      <form action={mudarEstadoProposta} className="ml-auto flex items-center gap-2">
                        <input type="hidden" name="id" value={p.id} />
                        <select
                          name="estado"
                          defaultValue={p.estado}
                          className="h-8 rounded-md border border-slate-200 px-2 text-xs"
                        >
                          {["Rascunho", "Enviada", "Aceite", "Recusada"].map((e) => (
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
              <p className="text-sm text-slate-500">
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

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] tracking-wide text-slate-500 uppercase">{rotulo}</p>
      <p className="truncate text-sm font-medium">{valor}</p>
    </div>
  );
}
