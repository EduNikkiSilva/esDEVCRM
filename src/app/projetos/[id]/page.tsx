import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChecklistEntrega } from "@/components/checklist-entrega";
import { Campo, CampoSelect, PageHeader, Stat } from "@/components/ui-kit";
import {
  alternarPagamento,
  alternarTarefa,
  apagarFatura,
  atualizarProjeto,
  criarFatura,
  criarTarefa,
  registarHoras,
} from "@/lib/actions";
import { ESTADOS_PROJETO, TIPOS_FATURA } from "@/lib/dominio";
import { data, eur, eur2 } from "@/lib/format";
import { VALOR_HORA_INTERNO } from "@/lib/pricing";
import { listarFaturas, listarTarefas, obterProjeto } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projeto = obterProjeto(Number(id));
  if (!projeto) notFound();

  const faturas = listarFaturas(projeto.id);
  const tarefas = listarTarefas(projeto.id);
  const recebido = faturas.filter((f) => f.estado === "Paga").reduce((s, f) => s + f.valor, 0);
  const emFalta = faturas.filter((f) => f.estado === "Pendente").reduce((s, f) => s + f.valor, 0);
  const valorHora =
    projeto.horas_reais > 0 ? (projeto.preco - projeto.custos_externos) / projeto.horas_reais : null;
  const checklist = JSON.parse(projeto.checklist || "[]") as string[];

  return (
    <>
      <PageHeader titulo={projeto.nome} descricao={projeto.pacote ?? undefined}>
        <Badge variant="outline" className="self-center">
          {projeto.estado}
        </Badge>
        {projeto.cliente_id ? (
          <Button asChild variant="outline">
            <Link href={`/clientes/${projeto.cliente_id}`}>{projeto.cliente}</Link>
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link href="/projetos">Todos os projetos</Link>
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat titulo="Adjudicado" valor={eur(projeto.preco)} nota={`${eur(projeto.custos_externos)} de custos externos`} />
        <Stat titulo="Recebido" valor={eur(recebido)} tom="bom" />
        <Stat titulo="Em falta" valor={eur(emFalta)} tom={emFalta ? "alerta" : "neutro"} />
        <Stat
          titulo="€/h efetivo"
          valor={valorHora === null ? "—" : `${eur2(valorHora)}/h`}
          nota={`${projeto.horas_reais}h reais · referência ${eur(VALOR_HORA_INTERNO)}/h`}
          tom={valorHora === null ? "neutro" : valorHora < VALOR_HORA_INTERNO ? "alerta" : "bom"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados do projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={atualizarProjeto} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="id" value={projeto.id} />
                <Campo nome="nome" label="Nome" valor={projeto.nome} obrigatorio />
                <Campo nome="pacote" label="Pacote" valor={projeto.pacote} />
                <CampoSelect
                  nome="estado"
                  label="Fase de desenvolvimento"
                  opcoes={ESTADOS_PROJETO}
                  valor={projeto.estado}
                />
                <Campo nome="preco" label="Preço adjudicado (€)" tipo="number" step="10" valor={projeto.preco} />
                <Campo
                  nome="custos_externos"
                  label="Custos externos (€)"
                  tipo="number"
                  valor={projeto.custos_externos}
                />
                <Campo
                  nome="horas_estimadas"
                  label="Horas estimadas"
                  tipo="number"
                  valor={projeto.horas_estimadas}
                />
                <Campo
                  nome="horas_reais"
                  label="Horas reais"
                  tipo="number"
                  step="0.5"
                  valor={projeto.horas_reais}
                />
                <Campo nome="inicio" label="Início" tipo="date" valor={projeto.inicio} />
                <Campo
                  nome="entrega_prevista"
                  label="Entrega prevista"
                  tipo="date"
                  valor={projeto.entrega_prevista}
                />
                <div className="sm:col-span-2">
                  <Campo nome="notas" label="Notas" area valor={projeto.notas} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">Guardar</Button>
                </div>
              </form>

              <form action={registarHoras} className="mt-4 flex items-end gap-2 border-t border-border/60 pt-4">
                <input type="hidden" name="id" value={projeto.id} />
                <Campo nome="horas" label="Registar horas trabalhadas" tipo="number" step="0.5" valor={0} className="w-48" />
                <Button type="submit" variant="outline">
                  <Plus className="size-4" /> Somar
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Faturação do projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="divide-y divide-border/60">
                {faturas.length === 0 ? (
                  <li className="py-2 text-sm text-muted-foreground">Sem faturas.</li>
                ) : (
                  faturas.map((f) => (
                    <li key={f.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                      <span className="font-medium">{f.descricao}</span>
                      <Badge variant="outline">{f.tipo}</Badge>
                      <span className="tabular-nums">{eur(f.valor)}</span>
                      <span className="text-xs text-muted-foreground">
                        {f.estado === "Paga" ? `paga ${data(f.paga_em)}` : "pendente"}
                      </span>
                      <span className="ml-auto flex gap-1">
                        <form action={alternarPagamento}>
                          <input type="hidden" name="id" value={f.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant={f.estado === "Paga" ? "outline" : "default"}
                          >
                            <Check className="size-4" />
                            {f.estado === "Paga" ? "Reabrir" : "Marcar paga"}
                          </Button>
                        </form>
                        <form action={apagarFatura}>
                          <input type="hidden" name="id" value={f.id} />
                          <Button type="submit" size="icon" variant="ghost" className="text-destructive">
                            <Trash2 className="size-4" />
                          </Button>
                        </form>
                      </span>
                    </li>
                  ))
                )}
              </ul>

              <form action={criarFatura} className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-4">
                <input type="hidden" name="projeto_id" value={projeto.id} />
                <Campo nome="descricao" label="Descrição" placeholder="Trabalho adicional" />
                <CampoSelect nome="tipo" label="Tipo" opcoes={TIPOS_FATURA} />
                <Campo nome="valor" label="Valor (€)" tipo="number" step="10" />
                <div className="flex items-end">
                  <Button type="submit" variant="outline" className="w-full">
                    Adicionar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist de entrega (§17)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChecklistEntrega projetoId={projeto.id} concluidos={checklist} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tarefas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tarefas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem tarefas.</p>
              ) : (
                <ul className="space-y-1.5">
                  {tarefas.map((t) => (
                    <li key={t.id}>
                      <form action={alternarTarefa} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="projeto_id" value={projeto.id} />
                        <Button type="submit" size="icon" variant="ghost" className="size-6">
                          <Check
                            className={`size-4 ${
                              t.estado === "Concluída" ? "text-success" : "text-muted-foreground/40"
                            }`}
                          />
                        </Button>
                        <span
                          className={`text-sm ${
                            t.estado === "Concluída" ? "text-muted-foreground/70 line-through" : ""
                          }`}
                        >
                          {t.titulo}
                        </span>
                        {t.prazo ? (
                          <span className="ml-auto text-xs text-muted-foreground/70">{data(t.prazo)}</span>
                        ) : null}
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <form action={criarTarefa} className="grid gap-2 border-t border-border/60 pt-3">
                <input type="hidden" name="projeto_id" value={projeto.id} />
                <Campo nome="titulo" label="Nova tarefa" placeholder="Aprovar design da homepage" />
                <Campo nome="prazo" label="Prazo" tipo="date" />
                <Button type="submit" variant="outline" size="sm">
                  <Plus className="size-4" /> Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
