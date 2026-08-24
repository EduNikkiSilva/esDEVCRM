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
import { Campo, PageHeader, Vazio } from "@/components/ui-kit";
import { guardarCliente } from "@/lib/actions";
import { listarClientes } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default function ClientesPage() {
  const clientes = listarClientes();

  return (
    <>
      <PageHeader
        titulo="Clientes"
        descricao="Dados de faturação e contacto. Um cliente é criado automaticamente quando uma lead é convertida em projeto."
      />

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
                    <TableHead>NIF</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/clientes/${c.id}`} className="font-medium hover:underline">
                          {c.empresa}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.nif ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.contacto_nome ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.telefone ?? "—"}</TableCell>
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
            <form action={guardarCliente} className="grid gap-3">
              <Campo nome="empresa" label="Empresa" obrigatorio />
              <Campo nome="nif" label="NIF" />
              <Campo nome="contacto_nome" label="Pessoa de contacto" />
              <Campo nome="contacto_cargo" label="Cargo" />
              <Campo nome="email" label="Email" tipo="email" />
              <Campo nome="telefone" label="Telefone" />
              <Campo nome="website" label="Website atual" />
              <Button type="submit">Adicionar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
