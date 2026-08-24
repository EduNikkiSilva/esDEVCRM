import Link from "next/link";
import {
  ArrowRight,
  BadgeEuro,
  Clock,
  FolderKanban,
  Gauge,
  Receipt,
  Repeat,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraficoFaturacao } from "@/components/graficos-dashboard";
import { PageHeader, Stat, Vazio } from "@/components/ui-kit";
import { COR_FASE, FASES, REGRAS_DE_OURO, type Fase } from "@/lib/dominio";
import { data, eur, eur2 } from "@/lib/format";
import { VALOR_HORA_INTERNO } from "@/lib/pricing";
import { contagemPorFase, faturacaoMensal, indicadores, listarFaturas } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default function Dashboard() {
  const ind = indicadores();
  const fases = contagemPorFase();
  const faturacao = faturacaoMensal();
  const faturas = listarFaturas() as (ReturnType<typeof listarFaturas>[number] & {
    cliente?: string | null;
    projeto?: string | null;
  })[];
  const pendentes = faturas.filter((f) => f.estado === "Pendente").slice(0, 6);
  const maiorFase = Math.max(1, ...FASES.map((f) => fases.get(f)?.n ?? 0));
  const temDados = faturacao.some((m) => m.recebido > 0 || m.pendente > 0);

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
          titulo="Receita recorrente"
          valor={`${eur(ind.mrr.total)}/mês`}
          nota={`${ind.mrr.n} contrato(s) · ${eur(ind.mrr.total * 12)}/ano`}
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
              Preço ÷ horas reais. Mínimo interno: {eur(VALOR_HORA_INTERNO)}/h.
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
                            abaixo ? "text-destructive" : "text-success"
                          }`}
                        >
                          {eur2(vh)}/h
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                        <div
                          className={`h-1.5 rounded-full ${abaixo ? "bg-destructive" : "bg-success"}`}
                          style={{
                            width: `${Math.min(100, (vh / (VALOR_HORA_INTERNO * 2)) * 100)}%`,
                          }}
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">Pipeline por fase</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/leads">
                Abrir <ArrowRight className="size-4" />
              </Link>
            </Button>
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">Por receber</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/faturas">
                Faturação <ArrowRight className="size-4" />
              </Link>
            </Button>
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
