import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Plus, Star, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormularioAcao } from "@/components/formulario-acao";
import { TimelineAtividades } from "@/components/timeline-atividades";
import { Campo, CampoSelect, PageHeader, Stat } from "@/components/ui-kit";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  apagarCliente,
  apagarContacto,
  apagarContrato,
  apagarServicoRecorrente,
  guardarCliente,
  guardarContacto,
  guardarContrato,
  guardarServicoRecorrente,
  migrarContactoDoCliente,
  renovarServico,
} from "@/lib/actions";
import { diasAte, hoje } from "@/lib/datas";
import {
  COR_PROPOSTA,
  ESTADOS_CONTRATO,
  ESTADOS_RECORRENTE,
  PERIODICIDADES,
  TIPOS_SERVICO_RECORRENTE,
  estadoFatura,
  type EstadoProposta,
} from "@/lib/dominio";
import { data, eur } from "@/lib/format";
import {
  contratosDoCliente,
  faturasDoCliente,
  listarAtividades,
  listarContactos,
  manutencoesDoCliente,
  obterCliente,
  projetosDoCliente,
  propostasDoCliente,
  resumoCliente,
  servicosDoCliente,
} from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await obterCliente(Number(id));
  if (!cliente) notFound();

  const [
    resumo,
    contactos,
    projetos,
    faturas,
    propostas,
    manutencoes,
    servicos,
    contratos,
    atividades,
  ] = await Promise.all([
    resumoCliente(cliente.id),
    listarContactos(cliente.id),
    projetosDoCliente(cliente.id),
    faturasDoCliente(cliente.id),
    propostasDoCliente(cliente.id),
    manutencoesDoCliente(cliente.id),
    servicosDoCliente(cliente.id),
    contratosDoCliente(cliente.id),
    listarAtividades({ clienteId: cliente.id }),
  ]);

  const dia = hoje();

  return (
    <>
      <PageHeader titulo={cliente.empresa} descricao={cliente.website ?? undefined}>
        <Button asChild variant="outline">
          <Link href="/clientes">Todos os clientes</Link>
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat titulo="Faturado" valor={eur(resumo.faturado)} nota={`${projetos.length} projeto(s)`} />
        <Stat titulo="Recebido" valor={eur(resumo.recebido)} tom="bom" />
        <Stat
          titulo="Em falta"
          valor={eur(resumo.pendente)}
          tom={resumo.pendente ? "alerta" : "neutro"}
        />
        <Stat
          titulo="Vencido"
          valor={eur(resumo.vencido)}
          tom={resumo.vencido ? "mau" : "bom"}
          nota="Fora de prazo"
        />
        <Stat
          titulo="Receita recorrente"
          valor={`${eur(resumo.mrr)}/mês`}
          nota={`${resumo.servicosAtivos} serviço(s) · ${eur(resumo.arr)}/ano`}
          tom={resumo.mrr ? "bom" : "neutro"}
        />
        <Stat
          titulo="Próxima ação"
          valor={resumo.proxima ? data(resumo.proxima.data) : "—"}
          nota={
            resumo.proxima
              ? resumo.proxima.titulo
              : resumo.ultima
                ? `último contacto ${data(resumo.ultima.data)}`
                : "sem histórico"
          }
          tom={resumo.proxima ? "neutro" : "alerta"}
        />
      </div>

      <Tabs defaultValue="resumo">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="atividade">Atividade ({atividades.length})</TabsTrigger>
          <TabsTrigger value="projetos">Projetos ({projetos.length})</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro ({faturas.length})</TabsTrigger>
          <TabsTrigger value="manutencao">
            Manutenção ({manutencoes.length + servicos.length})
          </TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({contratos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">Dados de faturação</CardTitle>
              </CardHeader>
              <CardContent>
                <FormularioAcao action={guardarCliente} className="grid gap-3" sucesso="Cliente atualizado">
                  <input type="hidden" name="id" value={cliente.id} />
                  <Campo nome="empresa" label="Empresa" valor={cliente.empresa} obrigatorio />
                  <Campo nome="nif" label="NIF" valor={cliente.nif} />
                  <Campo
                    nome="contacto_nome"
                    label="Pessoa de contacto"
                    valor={cliente.contacto_nome}
                  />
                  <Campo nome="contacto_cargo" label="Cargo" valor={cliente.contacto_cargo} />
                  <Campo nome="email" label="Email" tipo="email" valor={cliente.email} />
                  <Campo nome="telefone" label="Telefone" valor={cliente.telefone} />
                  <Campo nome="website" label="Website" valor={cliente.website} />
                  <Campo nome="notas" label="Notas" area valor={cliente.notas} />
                  <Button type="submit">Guardar</Button>
                </FormularioAcao>
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
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">Contactos</CardTitle>
                    {contactos.length === 0 && cliente.contacto_nome ? (
                      <form action={migrarContactoDoCliente}>
                        <input type="hidden" name="cliente_id" value={cliente.id} />
                        <Button type="submit" size="sm" variant="outline">
                          <UserPlus className="size-4" /> Importar contacto do cliente
                        </Button>
                      </form>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Várias pessoas por empresa. O contacto principal é o que aparece por omissão.
                  </p>
                </CardHeader>
                <CardContent>
                  {contactos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem contactos registados.</p>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {contactos.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                          {c.principal ? (
                            <Star
                              className="size-3.5 fill-warning text-warning"
                              aria-label="Contacto principal"
                            />
                          ) : null}
                          <span className="text-sm font-medium">{c.nome}</span>
                          {c.cargo ? (
                            <span className="text-xs text-muted-foreground">{c.cargo}</span>
                          ) : null}
                          {c.email ? (
                            <a
                              href={`mailto:${c.email}`}
                              className="text-xs text-muted-foreground hover:underline"
                            >
                              {c.email}
                            </a>
                          ) : null}
                          {c.telefone ? (
                            <span className="text-xs text-muted-foreground">{c.telefone}</span>
                          ) : null}
                          <form action={apagarContacto} className="ml-auto">
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="cliente_id" value={cliente.id} />
                            <Button
                              type="submit"
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Separator className="my-4" />
                  <form action={guardarContacto} className="grid gap-3 sm:grid-cols-4">
                    <input type="hidden" name="cliente_id" value={cliente.id} />
                    <Campo nome="nome" label="Nome" obrigatorio />
                    <Campo nome="cargo" label="Cargo" />
                    <Campo nome="email" label="Email" tipo="email" />
                    <Campo nome="telefone" label="Telefone" />
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input
                        type="checkbox"
                        name="principal"
                        value="1"
                        className="size-4 rounded border-input"
                      />
                      Contacto principal
                    </label>
                    <div className="sm:col-span-2">
                      <Button type="submit" size="sm" variant="outline">
                        <Plus className="size-4" /> Adicionar contacto
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Propostas</CardTitle>
                </CardHeader>
                <CardContent>
                  {propostas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem propostas associadas.</p>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {propostas.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                          <Link
                            href={`/leads/${p.lead_id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {p.numero ?? `Proposta ${p.id}`} · {p.nivel}
                          </Link>
                          <span className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Badge
                              variant="outline"
                              className={COR_PROPOSTA[p.estado as EstadoProposta]}
                            >
                              {p.estado}
                            </Badge>
                            <span className="tabular-nums">{eur(p.valor)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="atividade">
          <TimelineAtividades
            atividades={atividades}
            alvo={{ clienteId: cliente.id }}
            titulo="Relação com a esDEV"
          />
        </TabsContent>

        <TabsContent value="projetos">
          <Card>
            <CardContent>
              {projetos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem projetos.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {projetos.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link
                          href={`/projetos/${p.id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {p.nome}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {p.inicio ? `início ${data(p.inicio)}` : "sem início"}
                          {p.entrega_prevista ? ` · entrega ${data(p.entrega_prevista)}` : ""}
                          {p.horas_reais > 0 ? ` · ${p.horas_reais}h reais` : ""}
                        </p>
                      </div>
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
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardContent>
              {faturas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem faturas.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {faturas.map((f) => {
                    const estado = estadoFatura(f, dia);
                    return (
                      <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{f.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {f.emitida_em ? `emitida ${data(f.emitida_em)}` : "não emitida"}
                            {f.vence_em ? ` · vence ${data(f.vence_em)}` : ""}
                            {f.paga_em ? ` · paga ${data(f.paga_em)}` : ""}
                          </p>
                        </div>
                        <span className="flex items-center gap-3">
                          <Badge
                            variant={estado === "Paga" ? "default" : "outline"}
                            className={estado === "Vencida" ? "border-destructive/30 bg-destructive/10 text-destructive" : ""}
                          >
                            {estado}
                          </Badge>
                          <span className="text-sm tabular-nums">{eur(f.valor)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manutencao">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Planos de manutenção</CardTitle>
              </CardHeader>
              <CardContent>
                {manutencoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem plano de manutenção.</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {manutencoes.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium capitalize">{m.plano}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.ciclo}
                            {m.renovacao ? ` · renova ${data(m.renovacao)}` : ""}
                          </p>
                        </div>
                        <span className="flex items-center gap-3">
                          <Badge variant="outline">{m.estado}</Badge>
                          <span className="text-sm tabular-nums">{eur(m.valor_mensal)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Serviços recorrentes</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Domínio, alojamento, email e outros serviços com custo e preço próprios. A margem
                  é o que sobra depois do fornecedor.
                </p>
              </CardHeader>
              <CardContent>
                {servicos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem serviços recorrentes.</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {servicos.map((s) => {
                      const dias = diasAte(s.renovacao);
                      return (
                        <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {s.tipo}
                              {s.descricao ? (
                                <span className="ml-2 font-normal text-muted-foreground">
                                  {s.descricao}
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {s.fornecedor ? `${s.fornecedor} · ` : ""}
                              {s.periodicidade}
                              {s.renovacao
                                ? ` · renova ${data(s.renovacao)}${dias !== null && dias < 0 ? " (atrasada)" : ""}`
                                : ""}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            custo {eur(s.custo)} → preço {eur(s.preco)} ·{" "}
                            <strong className={s.preco - s.custo > 0 ? "text-success" : "text-destructive"}>
                              margem {eur(s.preco - s.custo)}
                            </strong>
                          </span>
                          <Badge variant="outline">{s.estado}</Badge>
                          <form action={renovarServico}>
                            <input type="hidden" name="id" value={s.id} />
                            <Button type="submit" size="sm" variant="outline">
                              Renovar
                            </Button>
                          </form>
                          <form action={apagarServicoRecorrente}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="cliente_id" value={cliente.id} />
                            <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="size-4" />
                            </Button>
                          </form>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <Separator className="my-4" />
                <form action={guardarServicoRecorrente} className="grid gap-3 sm:grid-cols-4">
                  <input type="hidden" name="cliente_id" value={cliente.id} />
                  <CampoSelect nome="tipo" label="Tipo" opcoes={TIPOS_SERVICO_RECORRENTE} />
                  <Campo nome="descricao" label="Descrição" placeholder="exemplo.pt" />
                  <Campo nome="fornecedor" label="Fornecedor" placeholder="Cloudflare" />
                  <CampoSelect nome="periodicidade" label="Periodicidade" opcoes={PERIODICIDADES} />
                  <Campo nome="custo" label="Custo (€)" tipo="number" step="0.01" valor={0} />
                  <Campo nome="preco" label="Preço cobrado (€)" tipo="number" step="0.01" valor={0} />
                  <Campo nome="inicio" label="Início" tipo="date" valor={dia} />
                  <CampoSelect nome="estado" label="Estado" opcoes={ESTADOS_RECORRENTE} />
                  <div className="sm:col-span-4">
                    <Button type="submit" size="sm" variant="outline">
                      <Plus className="size-4" /> Adicionar serviço recorrente
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contratos</CardTitle>
              <p className="text-xs text-muted-foreground">
                Um projeto relevante não deve começar antes de o contrato estar assinado. Os PDFs
                ficam na base de dados (viajam no backup JSON).
              </p>
            </CardHeader>
            <CardContent>
              {contratos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem contratos registados.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {contratos.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{c.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.data ? data(c.data) : "sem data"}
                          {c.ficheiro ? ` · ${c.ficheiro}` : ""}
                        </p>
                      </div>
                      {c.ficheiro ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={`/api/documentos/${c.id}`}>
                            <Download className="size-4" /> Descarregar
                          </a>
                        </Button>
                      ) : null}
                      <FormularioAcao
                        action={guardarContrato}
                        className="flex flex-wrap items-center gap-2"
                        sucesso="Contrato atualizado"
                      >
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="cliente_id" value={cliente.id} />
                        <input type="hidden" name="titulo" value={c.titulo} />
                        <input type="hidden" name="proposta_id" value={c.proposta_id ?? ""} />
                        <input type="hidden" name="projeto_id" value={c.projeto_id ?? ""} />
                        <input type="hidden" name="data" value={c.data ?? ""} />
                        <input type="hidden" name="ficheiro" value={c.ficheiro ?? ""} />
                        <select
                          name="estado"
                          defaultValue={c.estado}
                          className="h-8 rounded-md border border-border px-2 text-xs"
                        >
                          {ESTADOS_CONTRATO.map((e) => (
                            <option key={e} value={e}>
                              {e}
                            </option>
                          ))}
                        </select>
                        <Input
                          name="anexo"
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                          className="h-8 max-w-[14rem] text-xs"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Atualizar
                        </Button>
                      </FormularioAcao>
                      <FormularioAcao action={apagarContrato} sucesso="Contrato apagado">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="cliente_id" value={cliente.id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </FormularioAcao>
                    </li>
                  ))}
                </ul>
              )}

              <Separator className="my-4" />
              <FormularioAcao
                action={guardarContrato}
                className="grid gap-3 sm:grid-cols-4"
                sucesso="Contrato registado"
              >
                <input type="hidden" name="cliente_id" value={cliente.id} />
                <Campo
                  nome="titulo"
                  label="Título"
                  obrigatorio
                  placeholder="Contrato de desenvolvimento"
                  className="sm:col-span-2"
                />
                <CampoSelect nome="estado" label="Estado" opcoes={ESTADOS_CONTRATO} />
                <Campo nome="data" label="Data" tipo="date" />
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="anexo-novo">Documento (PDF / Word / imagem)</Label>
                  <Input
                    id="anexo-novo"
                    name="anexo"
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                  />
                </div>
                <Campo
                  nome="ficheiro"
                  label="Ou localização externa"
                  placeholder="Drive › Clientes › contrato.pdf"
                  className="sm:col-span-2"
                />
                <div className="sm:col-span-2 self-end">
                  <Button type="submit" size="sm" variant="outline">
                    <Plus className="size-4" /> Registar contrato
                  </Button>
                </div>
              </FormularioAcao>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
