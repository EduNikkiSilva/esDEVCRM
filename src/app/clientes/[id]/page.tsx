import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Campo, PageHeader, Stat } from "@/components/ui-kit";
import { apagarCliente, guardarCliente } from "@/lib/actions";
import { data, eur } from "@/lib/format";
import {
  faturasDoCliente,
  manutencoesDoCliente,
  obterCliente,
  projetosDoCliente,
} from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await obterCliente(Number(id));
  if (!cliente) notFound();

  const projetos = await projetosDoCliente(cliente.id);
  const faturas = await faturasDoCliente(cliente.id);
  const manutencoes = await manutencoesDoCliente(cliente.id);
  const recebido = faturas.filter((f) => f.estado === "Paga").reduce((s, f) => s + f.valor, 0);
  const emFalta = faturas.filter((f) => f.estado === "Pendente").reduce((s, f) => s + f.valor, 0);
  const mrr = manutencoes.filter((m) => m.estado === "Ativo").reduce((s, m) => s + m.valor_mensal, 0);

  return (
    <>
      <PageHeader titulo={cliente.empresa} descricao={cliente.website ?? undefined}>
        <Button asChild variant="outline">
          <Link href="/clientes">Todos os clientes</Link>
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat titulo="Projetos" valor={String(projetos.length)} />
        <Stat titulo="Recebido" valor={eur(recebido)} tom="bom" />
        <Stat titulo="Em falta" valor={eur(emFalta)} tom={emFalta ? "alerta" : "neutro"} />
        <Stat titulo="Manutenção" valor={`${eur(mrr)}/mês`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Dados de faturação</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={guardarCliente} className="grid gap-3">
              <input type="hidden" name="id" value={cliente.id} />
              <Campo nome="empresa" label="Empresa" valor={cliente.empresa} obrigatorio />
              <Campo nome="nif" label="NIF" valor={cliente.nif} />
              <Campo nome="contacto_nome" label="Pessoa de contacto" valor={cliente.contacto_nome} />
              <Campo nome="contacto_cargo" label="Cargo" valor={cliente.contacto_cargo} />
              <Campo nome="email" label="Email" tipo="email" valor={cliente.email} />
              <Campo nome="telefone" label="Telefone" valor={cliente.telefone} />
              <Campo nome="website" label="Website" valor={cliente.website} />
              <Campo nome="notas" label="Notas" area valor={cliente.notas} />
              <Button type="submit">Guardar</Button>
            </form>
            <form action={apagarCliente} className="mt-4">
              <input type="hidden" name="id" value={cliente.id} />
              <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="size-4" /> Apagar cliente
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              {projetos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem projetos.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {projetos.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                      <Link href={`/projetos/${p.id}`} className="text-sm font-medium hover:underline">
                        {p.nome}
                      </Link>
                      <span className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="outline">{p.estado}</Badge>
                        <span className="tabular-nums">{eur(p.preco)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Faturação</CardTitle>
            </CardHeader>
            <CardContent>
              {faturas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem faturas.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {faturas.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span>
                        {f.descricao}
                        <span className="ml-2 text-xs text-muted-foreground">{data(f.emitida_em)}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <Badge variant={f.estado === "Paga" ? "default" : "outline"}>
                          {f.estado}
                        </Badge>
                        <span className="tabular-nums">{eur(f.valor)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
