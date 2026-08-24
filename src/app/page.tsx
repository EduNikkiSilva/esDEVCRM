import Link from "next/link";
import {
  AlarmClock,
  ArrowRight,
  BadgeEuro,
  CalendarCheck,
  Clock,
  FileText,
  FolderKanban,
  Gauge,
  Percent,
  Receipt,
  Repeat,
  Target,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListaAtividades } from "@/components/atividades-hoje";
import { GraficoFaturacao } from "@/components/graficos-dashboard";
import { PageHeader, Stat, Vazio } from "@/components/ui-kit";
import { expirarPropostas } from "@/lib/actions";
import { diasAte } from "@/lib/datas";
import {
  COR_FASE,
  COR_PROPOSTA,
  FASES,
  REGRAS_DE_OURO,
  type EstadoProposta,
  type Fase,
} from "@/lib/dominio";
import { data, eur, eur2, pct } from "@/lib/format";
import { VALOR_HORA_ALVO, VALOR_HORA_INTERNO } from "@/lib/pricing";
import {
  atividadesAtrasadas,
  atividadesDoDia,
  contagemPorFase,
  faturacaoMensal,
  faturasVencidas,
  indicadores,
  indicadoresComerciais,
  listarFaturas,
  projetosEmRisco,
  propostasAbertas,
  receitaPeriodo,
  recorrencia,
  renovacoesProximas,
} from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // Sem tarefas agendadas, o dashboard é o momento natural para fechar propostas
  // cuja validade passou — senão ficavam eternamente "Enviada".
  await expirarPropostas();

  const [
    ind,
    comercial,
    receita,
    recorrente,
    fases,
    faturacao,
    faturas,
    hojeAtividades,
    atrasadas,
    vencidas,
    propostas,
    risco,
    renovacoes,
  ] = await Promise.all([
    indicadores(),
    indicadoresComerciais(),
    receitaPeriodo(),
    recorrencia(),
    contagemPorFase(),
    faturacaoMensal(),
    listarFaturas() as Promise<
      (Awaited<ReturnType<typeof listarFaturas>>[number] & {
        cliente?: string | null;
        projeto?: string | null;
      })[]
    >,
    atividadesDoDia(),
    atividadesAtrasadas(),
    faturasVencidas(),
    propostasAbertas(),
    projetosEmRisco(),
    renovacoesProximas(45),
  ]);

  const pendentes = faturas.filter((f) => f.estado === "Pendente").slice(0, 6);
  const maiorFase = Math.max(1, ...FASES.map((f) => fases.get(f)?.n ?? 0));
  const temDados = faturacao.some((m) => m.recebido > 0 || m.pendente > 0);
  const totalVencido = vencidas.reduce((s, f) => s + f.valor, 0);
  const porFazer = hojeAtividades.length + atrasadas.length;

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        descricao="Visão financeira e comercial da esDEV: pipeline, receita, receita recorrente e rentabilidade real."
      >
        <Button asChild variant="outline">
          <Link href="/calculadora">Calcular preço</Link>
        </Button>
        <Button asChild>
          <Link href="/leads">Abrir pipeline</Link>
        </Button>
      </PageHeader>

      <section className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="cartao-suave lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarCheck className="size-4 text-primary" /> Hoje
                {porFazer > 0 ? (
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    {porFazer}
                  </Badge>
                ) : null}
              </CardTitle>
              <Button asChild size="sm" variant="ghost">
                <Link href="/leads">
                  Pipeline <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O que está marcado para hoje e o que ficou para trás.
            </p>
          </CardHeader>
          <CardContent>
            <ListaAtividades
              atividades={hojeAtividades}
              vazio="Nada marcado para hoje."
            />
            {atrasadas.length > 0 ? (
              <>
                <p className="mt-4 mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-destructive uppercase">
                  <AlarmClock className="size-3.5" /> Atrasadas · {atrasadas.length}
                </p>
                <ListaAtividades atividades={atrasadas} atrasadas vazio="" />
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="cartao-suave">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="size-4" /> Propostas em aberto
              </CardTitle>
              <Button asChild size="sm" variant="ghost">
                <Link href="/propostas">
                  Ver <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {propostas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem propostas à espera de resposta.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {propostas.slice(0, 6).map((p) => {
                  const dias = diasAte(p.expira_em);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link
                          href={`/leads/${p.lead_id}`}
                          className="truncate text-sm font-medium hover:underline"
                        >
                          {p.empresa}
                        </Link>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge
                            variant="outline"
                            className={`px-1.5 py-0 text-[10px] ${COR_PROPOSTA[p.estado as EstadoProposta]}`}
                          >
                            {p.estado}
                          </Badge>
                          {dias === null
                            ? "sem validade"
                            : dias < 0
                              ? `expirou há ${-dias} dia(s)`
                              : `expira em ${dias} dia(s)`}
                        </p>
                      </div>
                      <span className="num shrink-0 text-sm font-semibold">{eur(p.valor)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          titulo="Pipeline aberto"
          valor={eur(ind.pipeline.total)}
          nota={`${ind.pipeline.n} oportunidade(s) em curso`}
          icone={FolderKanban}
        />
        <Stat
          titulo="Recebido"
          valor={eur(ind.recebido)}
          nota="Faturas marcadas como pagas"
          tom="bom"
          icone={BadgeEuro}
        />
        <Stat
          titulo="Em falta"
          valor={eur(ind.emFalta)}
          nota="Faturas pendentes"
          tom={ind.emFalta > 0 ? "alerta" : "neutro"}
          icone={Clock}
        />
        <Stat
          titulo="MRR"
          valor={`${eur(recorrente.mrr)}/mês`}
          nota={`ARR ${eur(recorrente.arr)} · ${recorrente.contratos} serviço(s)`}
          tom="bom"
          icone={Repeat}
        />
        <Stat
          titulo="Projetos ativos"
          valor={String(ind.projetosAtivos.n)}
          nota={`${eur(ind.projetosAtivos.preco)} adjudicados`}
          icone={Gauge}
        />
      </section>

      <section className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          titulo="Vencido"
          valor={eur(totalVencido)}
          nota={`${vencidas.length} fatura(s) fora de prazo`}
          tom={totalVencido > 0 ? "mau" : "bom"}
          icone={AlarmClock}
        />
        <Stat
          titulo="Receita do mês"
          valor={eur(receita.mes)}
          nota={`${eur(receita.ano)} no ano`}
          icone={BadgeEuro}
        />
        <Stat
          titulo="Ticket médio"
          valor={eur(comercial.ticketMedio)}
          nota={`${comercial.propostas} proposta(s) criadas`}
          icone={Target}
        />
        <Stat
          titulo="Taxa de conversão"
          valor={pct(comercial.conversao)}
          nota={`${comercial.ganhos} ganhas · ${comercial.perdidos} perdidas`}
          tom={comercial.conversao >= 0.3 ? "bom" : "neutro"}
          icone={Percent}
        />
        <Stat
          titulo="Aceitação de propostas"
          valor={pct(comercial.aceitacao)}
          nota={`${comercial.propostasAceites} de ${comercial.propostas}`}
          tom={comercial.aceitacao >= 0.4 ? "bom" : "neutro"}
          icone={FileText}
        />
      </section>

      {vencidas.length > 0 || risco.length > 0 || renovacoes.length > 0 ? (
        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="cartao-suave">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlarmClock className="size-4 text-destructive" /> Faturas vencidas
                </CardTitle>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/faturas?filtro=vencidas">
                    Ver <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vencidas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma fatura fora de prazo.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {vencidas.slice(0, 6).map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{f.descricao}</p>
                        <p className="truncate text-xs text-destructive">
                          {f.cliente ?? "Sem cliente"} · venceu {data(f.vence_em)}
                        </p>
                      </div>
                      <span className="num shrink-0 text-sm font-semibold">{eur(f.valor)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="cartao-suave">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TriangleAlert className="size-4 text-warning" /> Projetos em risco
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Entrega no passado ou horas acima do estimado.
              </p>
            </CardHeader>
            <CardContent>
              {risco.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum projeto em risco.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {risco.slice(0, 6).map((p) => (
                    <li key={p.id} className="py-2.5">
                      <Link
                        href={`/projetos/${p.id}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {p.nome}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.estado}
                        {p.entrega_prevista ? ` · entrega ${data(p.entrega_prevista)}` : ""}
                        {p.horas_estimadas > 0 && p.horas_reais > p.horas_estimadas
                          ? ` · ${p.horas_reais}h de ${p.horas_estimadas}h`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="cartao-suave">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Repeat className="size-4" /> Próximas renovações
                </CardTitle>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/manutencao">
                    Ver <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renovacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem renovações nos próximos 45 dias.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {renovacoes.slice(0, 6).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.cliente ?? "Sem cliente"}</p>
                        <p
                          className={`truncate text-xs ${r.atrasada ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {r.tipo} · {data(r.renovacao)}
                        </p>
                      </div>
                      <span className="num shrink-0 text-sm font-semibold">{eur(r.valor)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="cartao-suave lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Faturação dos últimos 6 meses</CardTitle>
            <p className="text-xs text-muted-foreground">
              Recebido vs. pendente, por mês de emissão ou pagamento.
            </p>
          </CardHeader>
          <CardContent>
            {temDados ? (
              <GraficoFaturacao dados={faturacao} />
            ) : (
              <Vazio titulo="Sem faturação registada." icone={Receipt}>
                Converte uma lead em projeto e as faturas do plano de pagamento aparecem aqui.
              </Vazio>
            )}
          </CardContent>
        </Card>

        <Card className="cartao-suave">
          <CardHeader>
            <CardTitle className="text-sm">Rentabilidade real</CardTitle>
            <p className="text-xs text-muted-foreground">
              Preço ÷ horas reais. Piso {eur(VALOR_HORA_INTERNO)}/h · alvo {eur(VALOR_HORA_ALVO)}/h.
            </p>
          </CardHeader>
          <CardContent>
            {ind.rentabilidade.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Registe horas reais nos projetos para acompanhar o preço efetivo por hora.
              </p>
            ) : (
              <ul className="space-y-3">
                {ind.rentabilidade.map((p) => {
                  const vh = (p.preco - p.custos_externos) / p.horas_reais;
                  const abaixo = vh < VALOR_HORA_INTERNO;
                  const noAlvo = vh >= VALOR_HORA_ALVO;
                  return (
                    <li key={p.id}>
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/projetos/${p.id}`}
                          className="truncate text-sm hover:underline"
                        >
                          {p.nome}
                        </Link>
                        <span
                          className={`num shrink-0 text-sm font-semibold ${
                            abaixo ? "text-destructive" : noAlvo ? "text-success" : "text-warning"
                          }`}
                        >
                          {eur2(vh)}/h
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                        <div
                          className={`h-1.5 rounded-full ${
                            abaixo ? "bg-destructive" : noAlvo ? "bg-success" : "bg-warning"
                          }`}
                          style={{ width: `${Math.min(100, (vh / (VALOR_HORA_ALVO * 1.5)) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="cartao-suave lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm">Pipeline por fase</CardTitle>
              <Button asChild size="sm" variant="ghost">
                <Link href="/leads">
                  Abrir <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {FASES.map((fase) => {
              const linha = fases.get(fase);
              const n = linha?.n ?? 0;
              return (
                <Link
                  key={fase}
                  href={`/leads?fase=${encodeURIComponent(fase)}`}
                  className="grid grid-cols-[10rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <span className="truncate text-[13px]">{fase}</span>
                  <span className="h-2 rounded-full bg-secondary">
                    <span
                      className="block h-2 rounded-full bg-gradient-to-r from-primary to-chart-2"
                      style={{ width: `${(n / maiorFase) * 100}%` }}
                    />
                  </span>
                  <span className="num w-28 text-right text-xs text-muted-foreground">
                    {n} · {eur(linha?.total ?? 0)}
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="cartao-suave">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm">Por receber</CardTitle>
              <Button asChild size="sm" variant="ghost">
                <Link href="/faturas">
                  Faturação <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem faturas pendentes.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {pendentes.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{f.descricao}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {f.cliente ?? "Sem cliente"} · {data(f.emitida_em)}
                      </p>
                    </div>
                    <span className="num shrink-0 text-sm font-semibold">{eur(f.valor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="cartao-suave lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Estado das leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {FASES.map((f) => (
                <Badge key={f} variant="outline" className={COR_FASE[f as Fase]}>
                  {f} · {fases.get(f)?.n ?? 0}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="cartao-suave">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TriangleAlert className="size-4 text-warning" /> Regras de ouro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {REGRAS_DE_OURO.slice(0, 5).map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-muted-foreground/40">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="sm" variant="ghost" className="mt-3 -ml-2">
              <Link href="/referencias">
                Ver as 14 regras <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
