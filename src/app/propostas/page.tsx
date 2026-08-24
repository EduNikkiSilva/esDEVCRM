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
import { mudarEstadoProposta } from "@/lib/actions";
import { data, eur } from "@/lib/format";
import { listarTodasPropostas } from "@/lib/queries";

const COR_ESTADO: Record<string, string> = {
  Rascunho: "bg-secondary text-foreground/80",
  Enviada: "bg-violet-50 text-violet-700 border-violet-200",
  Aceite: "bg-emerald-50 text-success border-emerald-200",
  Recusada: "bg-rose-50 text-rose-700 border-rose-200",
};

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function PropostasPage() {
  const propostas = await listarTodasPropostas();
  const enviadas = propostas.filter((p) => p.estado === "Enviada");
  const aceites = propostas.filter((p) => p.estado === "Aceite");
  const taxa = propostas.length
    ? Math.round((aceites.length / propostas.filter((p) => p.estado !== "Rascunho").length || 0) * 100)
    : 0;

  return (
    <>
      <PageHeader
        titulo="Propostas"
        descricao="Três níveis por oportunidade: Essential, Business e Premium. A proposta apresenta a solução e o preço; o contrato define as condições."
      >
        <Button asChild variant="outline">
          <Link href="/leads">Pipeline</Link>
        </Button>
      </PageHeader>

      {propostas.length === 0 ? (
        <Vazio titulo="Sem propostas.">
          As propostas criam-se no separador &ldquo;Propostas&rdquo; de cada lead, a partir da
          análise interna.
        </Vazio>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-3 text-sm">
            <Badge variant="outline">Total: {propostas.length}</Badge>
            <Badge variant="outline">Em aberto: {enviadas.length}</Badge>
            <Badge variant="outline">Aceites: {aceites.length}</Badge>
            {Number.isFinite(taxa) ? (
              <Badge variant="outline">Taxa de aceitação: {taxa}%</Badge>
            ) : null}
          </div>

          <Card>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Manutenção</TableHead>
                    <TableHead>Criada</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propostas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/leads/${p.lead_id}`} className="font-medium hover:underline">
                          {p.empresa}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.nivel}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{eur(p.valor)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {eur(p.mensalidade)}/mês
                      </TableCell>
                      <TableCell className="text-muted-foreground">{data(p.criado_em)}</TableCell>
                      <TableCell>
                        <form action={mudarEstadoProposta} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={p.id} />
                          <select
                            name="estado"
                            defaultValue={p.estado}
                            className={`h-8 rounded-md border px-2 text-xs ${COR_ESTADO[p.estado] ?? ""}`}
                          >
                            {["Rascunho", "Enviada", "Aceite", "Recusada"].map((e) => (
                              <option key={e} value={e}>
                                {e}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="ghost">
                            Guardar
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
