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
import { PageHeader, Stat, Vazio } from "@/components/ui-kit";
import { expirarPropostas, mudarEstadoProposta } from "@/lib/actions";
import { diasAte } from "@/lib/datas";
import {
  COR_PROPOSTA,
  ESTADOS_PROPOSTA,
  ESTADOS_PROPOSTA_ABERTOS,
  type EstadoProposta,
} from "@/lib/dominio";
import { data, eur, pct } from "@/lib/format";
import { listarTodasPropostas } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function PropostasPage() {
  await expirarPropostas();
  const propostas = await listarTodasPropostas();

  const abertas = propostas.filter((p) => ESTADOS_PROPOSTA_ABERTOS.includes(p.estado as EstadoProposta));
  const aceites = propostas.filter((p) => p.estado === "Aceite");
  const decididas = propostas.filter((p) =>
    ["Aceite", "Recusada", "Expirada"].includes(p.estado),
  );
  const taxa = decididas.length ? aceites.length / decididas.length : 0;
  const valorAberto = abertas.reduce((s, p) => s + p.valor, 0);

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
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat titulo="Total" valor={String(propostas.length)} />
            <Stat
              titulo="Em aberto"
              valor={String(abertas.length)}
              nota={`${eur(valorAberto)} à espera de resposta`}
            />
            <Stat titulo="Aceites" valor={String(aceites.length)} tom="bom" />
            <Stat
              titulo="Taxa de aceitação"
              valor={pct(taxa)}
              nota={`sobre ${decididas.length} decidida(s)`}
              tom={taxa >= 0.4 ? "bom" : "neutro"}
            />
          </div>

          <Card>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Manutenção</TableHead>
                    <TableHead>Enviada</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propostas.map((p) => {
                    const dias = diasAte(p.expira_em);
                    const aberta = ESTADOS_PROPOSTA_ABERTOS.includes(p.estado as EstadoProposta);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {p.numero ?? "—"}
                        </TableCell>
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
                        <TableCell className="text-xs text-muted-foreground">
                          {p.enviada_em ? data(p.enviada_em) : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.respondida_em ? (
                            <span className="text-muted-foreground">
                              resposta {data(p.respondida_em)}
                            </span>
                          ) : p.expira_em ? (
                            <span
                              className={
                                aberta && dias !== null && dias <= 3
                                  ? "font-medium text-destructive"
                                  : "text-muted-foreground"
                              }
                            >
                              {data(p.expira_em)}
                              {aberta && dias !== null ? (
                                <span className="block text-muted-foreground/70">
                                  {dias < 0 ? `há ${-dias} dia(s)` : `faltam ${dias} dia(s)`}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/70">{p.validade_dias} dias</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <form action={mudarEstadoProposta} className="flex items-center gap-2">
                            <input type="hidden" name="id" value={p.id} />
                            <select
                              name="estado"
                              defaultValue={p.estado}
                              className={`h-8 rounded-md border px-2 text-xs ${COR_PROPOSTA[p.estado as EstadoProposta] ?? ""}`}
                            >
                              {ESTADOS_PROPOSTA.map((e) => (
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
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
