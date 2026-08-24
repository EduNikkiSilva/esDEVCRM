import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, Vazio } from "@/components/ui-kit";
import { data, eur, eur2 } from "@/lib/format";
import { VALOR_HORA_INTERNO } from "@/lib/pricing";
import { listarProjetos } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default function ProjetosPage() {
  const projetos = listarProjetos();

  return (
    <>
      <PageHeader
        titulo="Projetos"
        descricao="Kick-off → estrutura → design → aprovação → desenvolvimento → integrações → testes → aprovação final → deploy → entrega."
      >
        <Button asChild variant="outline">
          <Link href="/leads">Converter uma lead</Link>
        </Button>
      </PageHeader>

      {projetos.length === 0 ? (
        <Vazio titulo="Sem projetos.">
          Os projetos nascem da conversão de uma lead aceite, no separador &ldquo;Converter em
          projeto&rdquo;.
        </Vazio>
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Horas (est./real)</TableHead>
                  <TableHead className="text-right">€/h efetivo</TableHead>
                  <TableHead>Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projetos.map((p) => {
                  const vh = p.horas_reais > 0 ? (p.preco - p.custos_externos) / p.horas_reais : null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/projetos/${p.id}`} className="font-medium hover:underline">
                          {p.nome}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-500">{p.cliente ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{eur(p.preco)}</TableCell>
                      <TableCell className="text-right tabular-nums text-slate-500">
                        {p.horas_estimadas} / {p.horas_reais}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${
                          vh === null
                            ? "text-slate-400"
                            : vh < VALOR_HORA_INTERNO
                              ? "text-rose-600"
                              : "text-emerald-600"
                        }`}
                      >
                        {vh === null ? "—" : `${eur2(vh)}/h`}
                      </TableCell>
                      <TableCell className="text-slate-500">{data(p.entrega_prevista)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
