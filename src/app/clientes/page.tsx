import Link from "next/link";
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
import { FormularioAcao } from "@/components/formulario-acao";
import { Campo, PageHeader, Stat, Vazio } from "@/components/ui-kit";
import { guardarCliente } from "@/lib/actions";
import { data, eur } from "@/lib/format";
import { listarClientesComResumo } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await listarClientesComResumo();
  const faturado = clientes.reduce((s, c) => s + c.faturado, 0);
  const recorrente = clientes.reduce((s, c) => s + c.recorrente, 0);
  const semAcompanhamento = clientes.filter((c) => !c.proxima_atividade).length;

  return (
    <>
      <PageHeader
        titulo="Clientes"
        descricao="Cada cliente é uma relação, não um registo: quanto já faturou, quanto falta receber, que receita recorrente gera e quando foi o último contacto."
      />

      {clientes.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat titulo="Clientes" valor={String(clientes.length)} />
          <Stat titulo="Faturado" valor={eur(faturado)} nota="Histórico total" />
          <Stat titulo="Receita recorrente" valor={`${eur(recorrente)}/mês`} tom="bom" />
          <Stat
            titulo="Sem próxima ação"
            valor={String(semAcompanhamento)}
            tom={semAcompanhamento ? "alerta" : "bom"}
            nota="Clientes sem nada marcado"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent className="px-0">
            {clientes.length === 0 ? (
              <div className="px-6">
                <Vazio titulo="Sem clientes registados." />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-right">Faturado</TableHead>
                    <TableHead className="text-right">Em falta</TableHead>
                    <TableHead className="text-right">Recorrente</TableHead>
                    <TableHead>Último contacto</TableHead>
                    <TableHead>Próxima ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/clientes/${c.id}`} className="font-medium hover:underline">
                          {c.empresa}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {c.projetos} projeto(s)
                          {c.nif ? ` · NIF ${c.nif}` : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.contacto_nome ?? "—"}
                        {c.email ? <span className="block text-xs">{c.email}</span> : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{eur(c.faturado)}</TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${c.vencido > 0 ? "font-medium text-destructive" : "text-muted-foreground"}`}
                      >
                        {eur(c.pendente)}
                        {c.vencido > 0 ? (
                          <span className="block text-xs">{eur(c.vencido)} vencido</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {c.recorrente > 0 ? `${eur(c.recorrente)}/mês` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.ultima_atividade ? data(c.ultima_atividade) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.proxima_atividade ? (
                          <span className="text-muted-foreground">{data(c.proxima_atividade)}</span>
                        ) : (
                          <span className="text-warning">sem follow-up</span>
                        )}
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
            <CardTitle className="text-base">Novo cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <FormularioAcao action={guardarCliente} className="grid gap-3" sucesso="Cliente criado">
              <Campo nome="empresa" label="Empresa" obrigatorio />
              <Campo nome="nif" label="NIF" />
              <Campo nome="contacto_nome" label="Pessoa de contacto" />
              <Campo nome="contacto_cargo" label="Cargo" />
              <Campo nome="email" label="Email" tipo="email" />
              <Campo nome="telefone" label="Telefone" />
              <Campo nome="website" label="Website atual" />
              <Button type="submit">Adicionar</Button>
            </FormularioAcao>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
