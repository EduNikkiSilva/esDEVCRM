import Link from "next/link";
import { Check, Trash2 } from "lucide-react";
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
import { alternarPagamento, apagarFatura, criarFatura } from "@/lib/actions";
import { TIPOS_FATURA } from "@/lib/dominio";
import { data, eur, hoje } from "@/lib/format";
import { listarClientes, listarFaturas, listarProjetos } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function FaturasPage() {
  const faturas = (await listarFaturas()) as (Awaited<ReturnType<typeof listarFaturas>>[number] & {
    cliente?: string | null;
    projeto?: string | null;
  })[];
  const clientes = await listarClientes();
  const projetos = await listarProjetos();
  const recebido = faturas.filter((f) => f.estado === "Paga").reduce((s, f) => s + f.valor, 0);
  const pendente = faturas.filter((f) => f.estado === "Pendente").reduce((s, f) => s + f.valor, 0);

  return (
    <>
      <PageHeader
        titulo="Faturação"
        descricao="Marcos de pagamento, trabalho adicional e custos de terceiros. O que está pendente é o que ainda falta receber."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat titulo="Recebido" valor={eur(recebido)} tom="bom" />
        <Stat titulo="Em falta" valor={eur(pendente)} tom={pendente ? "alerta" : "neutro"} />
        <Stat titulo="Documentos" valor={String(faturas.length)} />
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
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturas.map((f) => (
                    <TableRow key={f.id}>
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
                      <TableCell>
                        <span className={f.estado === "Paga" ? "text-success" : "text-warning"}>
                          {f.estado}
                        </span>
                        <span className="block text-xs text-muted-foreground/70">
                          {f.estado === "Paga" ? data(f.paga_em) : data(f.emitida_em)}
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
                  ))}
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
              <Campo nome="emitida_em" label="Data de emissão" tipo="date" valor={hoje()} />
              <CampoSelect nome="estado" label="Estado" opcoes={["Pendente", "Paga"]} />
              <Button type="submit">Registar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
