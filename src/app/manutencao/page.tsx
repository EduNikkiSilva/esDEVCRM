import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Campo, CampoSelect, PageHeader, Stat, Vazio } from "@/components/ui-kit";
import { apagarManutencao, guardarManutencao } from "@/lib/actions";
import { data, eur, hoje } from "@/lib/format";
import { PLANOS_MANUTENCAO } from "@/lib/pricing";
import { listarClientes, listarManutencoes, listarProjetos } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default function ManutencaoPage() {
  const contratos = listarManutencoes();
  const clientes = listarClientes();
  const projetos = listarProjetos();
  const ativos = contratos.filter((c) => c.estado === "Ativo");
  const mrr = ativos.reduce((s, c) => s + c.valor_mensal, 0);

  return (
    <>
      <PageHeader
        titulo="Manutenção e receita recorrente"
        descricao="A manutenção é um serviço próprio: transforma projetos pontuais em relações comerciais contínuas."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat titulo="Receita recorrente" valor={`${eur(mrr)}/mês`} tom="bom" />
        <Stat titulo="Anualizada" valor={eur(mrr * 12)} />
        <Stat titulo="Contratos ativos" valor={String(ativos.length)} nota={`${contratos.length} no total`} />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {PLANOS_MANUTENCAO.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between text-base">
                {p.nome}
                <span className="text-sm font-normal text-slate-500 tabular-nums">
                  {eur(p.minimo)}–{eur(p.maximo)}/mês
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{p.inclui}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            {contratos.length === 0 ? (
              <Vazio titulo="Sem contratos de manutenção.">
                Ao converter uma lead em projeto pode criar o contrato automaticamente.
              </Vazio>
            ) : (
              <ul className="divide-y divide-slate-100">
                {contratos.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {c.cliente_id ? (
                          <Link href={`/clientes/${c.cliente_id}`} className="hover:underline">
                            {c.cliente ?? "Cliente"}
                          </Link>
                        ) : (
                          (c.cliente ?? "Sem cliente")
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {c.projeto ?? "Sem projeto"} · desde {data(c.inicio)}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {c.plano}
                    </Badge>
                    <Badge variant={c.estado === "Ativo" ? "default" : "outline"}>{c.estado}</Badge>
                    <span className="text-sm font-semibold tabular-nums">
                      {eur(c.valor_mensal)}/mês
                    </span>
                    <form action={guardarManutencao} className="ml-auto flex items-center gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="cliente_id" value={c.cliente_id ?? ""} />
                      <input type="hidden" name="projeto_id" value={c.projeto_id ?? ""} />
                      <input type="hidden" name="plano" value={c.plano} />
                      <input type="hidden" name="valor_mensal" value={c.valor_mensal} />
                      <input type="hidden" name="inicio" value={c.inicio ?? ""} />
                      <select
                        name="estado"
                        defaultValue={c.estado}
                        className="h-8 rounded-md border border-slate-200 px-2 text-xs"
                      >
                        {["Ativo", "Suspenso", "Cancelado"].map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Guardar
                      </Button>
                    </form>
                    <form action={apagarManutencao}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" size="icon" variant="ghost" className="text-rose-600">
                        <Trash2 className="size-4" />
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Novo contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={guardarManutencao} className="grid gap-3">
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
              <CampoSelect
                nome="plano"
                label="Plano"
                opcoes={PLANOS_MANUTENCAO.map((p) => ({ valor: p.id, label: p.nome }))}
              />
              <Campo nome="valor_mensal" label="Valor mensal (€)" tipo="number" valor={39} />
              <Campo nome="inicio" label="Início" tipo="date" valor={hoje()} />
              <Campo nome="notas" label="Notas" area />
              <Button type="submit">Criar contrato</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
