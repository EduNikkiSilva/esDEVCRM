import Link from "next/link";
import { CalendarClock, Check, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Campo, CampoSelect, PageHeader, Stat, Vazio } from "@/components/ui-kit";
import { alternarPagamento, apagarFatura, criarFatura, emitirFatura } from "@/lib/actions";
import { diasAte, somarDias } from "@/lib/datas";
import { TIPOS_FATURA, estadoFatura } from "@/lib/dominio";
import { data, eur, hoje } from "@/lib/format";
import { listarClientes, listarFaturas, listarProjetos } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function FaturasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const todas = (await listarFaturas()) as (Awaited<ReturnType<typeof listarFaturas>>[number] & {
    cliente?: string | null;
    projeto?: string | null;
  })[];
  const clientes = await listarClientes();
  const projetos = await listarProjetos();

  const dia = hoje();
  const comEstado = todas.map((f) => ({ ...f, calculado: estadoFatura(f, dia) }));
  const recebido = comEstado.filter((f) => f.estado === "Paga").reduce((s, f) => s + f.valor, 0);
  const pendente = comEstado.filter((f) => f.estado === "Pendente").reduce((s, f) => s + f.valor, 0);
  const vencidas = comEstado.filter((f) => f.calculado === "Vencida");
  const totalVencido = vencidas.reduce((s, f) => s + f.valor, 0);
  const semPrazo = comEstado.filter((f) => f.estado === "Pendente" && !f.vence_em);

  const faturas =
    filtro === "vencidas"
      ? vencidas
      : filtro === "pendentes"
        ? comEstado.filter((f) => f.estado === "Pendente")
        : filtro === "sem-prazo"
          ? semPrazo
          : comEstado;

  return (
    <>
      <PageHeader
        titulo="Faturação"
        descricao="Marcos de pagamento, trabalho adicional e custos de terceiros. Uma fatura pendente com o prazo ultrapassado conta como vencida."
      >
        {filtro ? (
          <Button asChild variant="outline">
            <Link href="/faturas">Ver todas</Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat titulo="Recebido" valor={eur(recebido)} tom="bom" />
        <Link href="/faturas?filtro=pendentes" className="block">
          <Stat
            titulo="Em falta"
            valor={eur(pendente)}
            tom={pendente ? "alerta" : "neutro"}
            nota="Emitidas e não pagas"
          />
        </Link>
        <Link href="/faturas?filtro=vencidas" className="block">
          <Stat
            titulo="Vencido"
            valor={eur(totalVencido)}
            tom={totalVencido ? "mau" : "bom"}
            nota={`${vencidas.length} fatura(s) fora de prazo`}
          />
        </Link>
        <Link href="/faturas?filtro=sem-prazo" className="block">
          <Stat
            titulo="Sem prazo definido"
            valor={String(semPrazo.length)}
            tom={semPrazo.length ? "alerta" : "neutro"}
            nota="Sem data de vencimento não há cobrança"
          />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent className="px-0">
            {faturas.length === 0 ? (
              <div className="px-6">
                <Vazio titulo="Sem faturas registadas." />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturas.map((f) => {
                    const dias = diasAte(f.vence_em);
                    const vencida = f.calculado === "Vencida";
                    return (
                      <TableRow key={f.id} className={vencida ? "bg-destructive/[0.04]" : undefined}>
                        <TableCell>
                          <span className="font-medium">{f.descricao}</span>
                          {f.projeto ? (
                            <Link
                              href={`/projetos/${f.projeto_id}`}
                              className="block text-xs text-muted-foreground hover:underline"
                            >
                              {f.projeto}
                            </Link>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{f.cliente ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{f.tipo}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{eur(f.valor)}</TableCell>
                        <TableCell className="text-xs">
                          {f.estado === "Paga" ? (
                            <span className="text-muted-foreground">pago {data(f.paga_em)}</span>
                          ) : f.vence_em ? (
                            <span className={vencida ? "font-medium text-destructive" : "text-muted-foreground"}>
                              {data(f.vence_em)}
                              <span className="block text-muted-foreground/70">
                                {dias === null
                                  ? ""
                                  : dias < 0
                                    ? `há ${-dias} dia(s)`
                                    : `faltam ${dias} dia(s)`}
                              </span>
                            </span>
                          ) : (
                            <form action={emitirFatura} className="flex items-center gap-1">
                              <input type="hidden" name="id" value={f.id} />
                              <input type="hidden" name="emitida_em" value={f.emitida_em ?? dia} />
                              <input
                                type="date"
                                name="vence_em"
                                defaultValue={somarDias(f.emitida_em ?? dia, 30)}
                                className="h-7 rounded-md border border-border px-1.5 text-xs"
                              />
                              <Button type="submit" size="sm" variant="ghost" title="Definir prazo">
                                <CalendarClock className="size-4" />
                              </Button>
                            </form>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              f.estado === "Paga"
                                ? "text-success"
                                : vencida
                                  ? "font-medium text-destructive"
                                  : "text-warning"
                            }
                          >
                            {f.calculado}
                          </span>
                          <span className="block text-xs text-muted-foreground/70">
                            {f.emitida_em ? `emitida ${data(f.emitida_em)}` : "não emitida"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <form action={alternarPagamento}>
                              <input type="hidden" name="id" value={f.id} />
                              <Button
                                type="submit"
                                size="sm"
                                variant={f.estado === "Paga" ? "outline" : "default"}
                                title={f.estado === "Paga" ? "Marcar como pendente" : "Marcar como paga"}
                              >
                                <Check className="size-4" />
                              </Button>
                            </form>
                            <form action={apagarFatura}>
                              <input type="hidden" name="id" value={f.id} />
                              <Button type="submit" size="icon" variant="ghost" className="text-destructive">
                                <Trash2 className="size-4" />
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Nova fatura</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={criarFatura} className="grid gap-3">
              <Campo nome="descricao" label="Descrição" obrigatorio />
              <CampoSelect nome="tipo" label="Tipo" opcoes={TIPOS_FATURA} />
              <Campo nome="valor" label="Valor (€)" tipo="number" step="10" />
              <CampoSelect
                nome="cliente_id"
                label="Cliente"
                opcoes={clientes.map((c) => ({ valor: String(c.id), label: c.empresa }))}
                vazioLabel="—"
              />
              <CampoSelect
                nome="projeto_id"
                label="Projeto"
                opcoes={projetos.map((p) => ({ valor: String(p.id), label: p.nome }))}
                vazioLabel="—"
              />
              <Campo nome="emitida_em" label="Data de emissão" tipo="date" valor={dia} />
              <Campo
                nome="vence_em"
                label="Vencimento"
                tipo="date"
                valor={somarDias(dia, 30)}
              />
              <CampoSelect nome="estado" label="Estado" opcoes={["Pendente", "Paga"]} />
              <Button type="submit">Registar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
