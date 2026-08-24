import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Stat, Vazio } from "@/components/ui-kit";
import { COR_FASE, FASES, REGRAS_DE_OURO, type Fase } from "@/lib/dominio";
import { eur, eur2, data } from "@/lib/format";
import { VALOR_HORA_INTERNO } from "@/lib/pricing";
import { contagemPorFase, indicadores, listarFaturas } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default function Dashboard() {
  const ind = indicadores();
  const fases = contagemPorFase();
  const faturas = listarFaturas() as (ReturnType<typeof listarFaturas>[number] & {
    cliente?: string | null;
    projeto?: string | null;
  })[];
  const pendentes = faturas.filter((f) => f.estado === "Pendente").slice(0, 6);
  const maiorFase = Math.max(1, ...FASES.map((f) => fases.get(f)?.n ?? 0));

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        descricao="Visão financeira e comercial da esDEV: pipeline, receita, receita recorrente e rentabilidade real."
      >
        <Button asChild>
          <Link href="/leads">Pipeline</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/calculadora">Calcular preço</Link>
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          titulo="Pipeline aberto"
          valor={eur(ind.pipeline.total)}
          nota={`${ind.pipeline.n} oportunidade(s) em curso`}
        />
        <Stat titulo="Recebido" valor={eur(ind.recebido)} nota="Faturas marcadas como pagas" tom="bom" />
        <Stat
          titulo="Em falta"
          valor={eur(ind.emFalta)}
          nota="Faturas pendentes"
          tom={ind.emFalta > 0 ? "alerta" : "neutro"}
        />
        <Stat
          titulo="Receita recorrente"
          valor={`${eur(ind.mrr.total)}/mês`}
          nota={`${ind.mrr.n} contrato(s) de manutenção`}
          tom="bom"
        />
        <Stat
          titulo="Projetos ativos"
          valor={String(ind.projetosAtivos.n)}
          nota={`${eur(ind.projetosAtivos.preco)} adjudicados`}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pipeline por fase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {FASES.map((fase) => {
              const linha = fases.get(fase);
              const n = linha?.n ?? 0;
              return (
                <Link
                  key={fase}
                  href={`/leads?fase=${encodeURIComponent(fase)}`}
                  className="grid grid-cols-[11rem_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50"
                >
                  <span className="truncate text-sm text-slate-700">{fase}</span>
                  <span className="h-2 rounded-full bg-slate-100">
                    <span
                      className="block h-2 rounded-full bg-slate-900"
                      style={{ width: `${(n / maiorFase) * 100}%` }}
                    />
                  </span>
                  <span className="w-28 text-right text-xs tabular-nums text-slate-500">
                    {n} · {eur(linha?.total ?? 0)}
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rentabilidade real (§29)</CardTitle>
          </CardHeader>
          <CardContent>
            {ind.rentabilidade.length === 0 ? (
              <p className="text-sm text-slate-500">
                Registe horas reais nos projetos para acompanhar o preço efetivo por hora.
                Referência interna: {eur(VALOR_HORA_INTERNO)}/h.
              </p>
            ) : (
              <ul className="space-y-3">
                {ind.rentabilidade.map((p) => {
                  const vh = (p.preco - p.custos_externos) / p.horas_reais;
                  const abaixo = vh < VALOR_HORA_INTERNO;
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <Link href={`/projetos/${p.id}`} className="truncate text-sm hover:underline">
                        {p.nome}
                      </Link>
                      <span
                        className={`shrink-0 text-sm font-medium tabular-nums ${
                          abaixo ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {eur2(vh)}/h
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Por receber</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/faturas">
                Faturação <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendentes.length === 0 ? (
              <Vazio titulo="Sem faturas pendentes.">
                As faturas são criadas automaticamente ao converter uma lead em projeto.
              </Vazio>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendentes.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{f.descricao}</p>
                      <p className="truncate text-xs text-slate-500">
                        {f.cliente ?? "Sem cliente"}
                        {f.projeto ? ` · ${f.projeto}` : ""} · emitida {data(f.emitida_em)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {eur(f.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TriangleAlert className="size-4 text-amber-500" /> Regras de ouro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              {REGRAS_DE_OURO.slice(0, 6).map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-slate-300">•</span>
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

      <section className="mt-6">
        <div className="flex flex-wrap gap-1.5">
          {FASES.map((f) => (
            <Badge key={f} variant="outline" className={COR_FASE[f as Fase]}>
              {f} · {fases.get(f)?.n ?? 0}
            </Badge>
          ))}
        </div>
      </section>
    </>
  );
}
