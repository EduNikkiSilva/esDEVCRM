import Link from "next/link";
import { Plus, Repeat, Trash2 } from "lucide-react";
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
import {
  apagarManutencao,
  apagarServicoRecorrente,
  guardarManutencao,
  guardarServicoRecorrente,
  renovarManutencao,
  renovarServico,
} from "@/lib/actions";
import { diasAte } from "@/lib/datas";
import {
  ESTADOS_RECORRENTE,
  PERIODICIDADES,
  TIPOS_SERVICO_RECORRENTE,
} from "@/lib/dominio";
import { data, eur, hoje } from "@/lib/format";
import { PLANOS_MANUTENCAO } from "@/lib/pricing";
import {
  listarClientes,
  listarManutencoes,
  listarProjetos,
  listarServicosRecorrentes,
  recorrencia,
  renovacoesProximas,
} from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

/** Renovações mais próximas que isto entram na lista de alertas. */
const JANELA_ALERTA_DIAS = 45;

export default async function ManutencaoPage() {
  const [contratos, servicos, clientes, projetos, totais, renovacoes] = await Promise.all([
    listarManutencoes(),
    listarServicosRecorrentes(),
    listarClientes(),
    listarProjetos(),
    recorrencia(),
    renovacoesProximas(JANELA_ALERTA_DIAS),
  ]);

  const dia = hoje();
  const opcoesCliente = clientes.map((c) => ({ valor: String(c.id), label: c.empresa }));
  const opcoesProjeto = projetos.map((p) => ({ valor: String(p.id), label: p.nome }));

  return (
    <>
      <PageHeader
        titulo="Manutenção e receita recorrente"
        descricao="Manutenção, domínios, alojamento e suporte: é o que transforma projetos pontuais em receita previsível. O MRR normaliza todos os ciclos a mês."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat titulo="MRR" valor={`${eur(totais.mrr)}/mês`} tom="bom" icone={Repeat} />
        <Stat titulo="ARR" valor={eur(totais.arr)} nota="MRR × 12" />
        <Stat
          titulo="Custo de fornecedores"
          valor={`${eur(totais.custoMensal)}/mês`}
          tom={totais.custoMensal ? "alerta" : "neutro"}
        />
        <Stat
          titulo="Margem recorrente"
          valor={`${eur(totais.margemMensal)}/mês`}
          tom={totais.margemMensal > 0 ? "bom" : "mau"}
        />
        <Stat
          titulo="Serviços ativos"
          valor={String(totais.contratos)}
          nota={`${totais.clientes} cliente(s) recorrente(s)`}
        />
      </div>

      {renovacoes.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              Próximas renovações · {JANELA_ALERTA_DIAS} dias
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Uma renovação por tratar é receita que se perde em silêncio.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {renovacoes.map((r) => {
                const dias = diasAte(r.renovacao);
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="text-sm font-medium">{r.cliente ?? "Sem cliente"}</span>
                    <Badge variant="outline">{r.tipo}</Badge>
                    <span
                      className={`text-xs ${r.atrasada ? "font-medium text-destructive" : "text-muted-foreground"}`}
                    >
                      {data(r.renovacao)}
                      {dias === null
                        ? ""
                        : dias < 0
                          ? ` · atrasada há ${-dias} dia(s)`
                          : ` · faltam ${dias} dia(s)`}
                    </span>
                    <span className="ml-auto text-sm font-semibold tabular-nums">
                      {eur(r.valor)} / {r.ciclo.toLowerCase()}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {PLANOS_MANUTENCAO.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between text-base">
                {p.nome}
                <span className="text-sm font-normal text-muted-foreground tabular-nums">
                  {eur(p.minimo)}–{eur(p.maximo)}/mês
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{p.inclui}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Planos de manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            {contratos.length === 0 ? (
              <Vazio titulo="Sem contratos de manutenção.">
                Ao converter uma lead em projeto pode criar o contrato automaticamente.
              </Vazio>
            ) : (
              <ul className="divide-y divide-border/60">
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
                      <p className="truncate text-xs text-muted-foreground">
                        {c.projeto ?? "Sem projeto"} · desde {data(c.inicio)} · {c.ciclo}
                        {c.renovacao ? ` · renova ${data(c.renovacao)}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {c.plano}
                    </Badge>
                    <Badge variant={c.estado === "Ativo" ? "default" : "outline"}>{c.estado}</Badge>
                    <span className="text-sm font-semibold tabular-nums">
                      {eur(c.valor_mensal)}/{c.ciclo === "Mensal" ? "mês" : c.ciclo.toLowerCase()}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      {c.estado === "Ativo" ? (
                        <form action={renovarManutencao}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Renovar
                          </Button>
                        </form>
                      ) : null}
                      <form action={guardarManutencao} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="cliente_id" value={c.cliente_id ?? ""} />
                        <input type="hidden" name="projeto_id" value={c.projeto_id ?? ""} />
                        <input type="hidden" name="plano" value={c.plano} />
                        <input type="hidden" name="valor_mensal" value={c.valor_mensal} />
                        <input type="hidden" name="inicio" value={c.inicio ?? ""} />
                        <input type="hidden" name="ciclo" value={c.ciclo} />
                        <input type="hidden" name="renovacao" value={c.renovacao ?? ""} />
                        <select
                          name="estado"
                          defaultValue={c.estado}
                          className="h-8 rounded-md border border-border px-2 text-xs"
                        >
                          {ESTADOS_RECORRENTE.map((e) => (
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
                        <Button type="submit" size="icon" variant="ghost" className="text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Novo plano</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={guardarManutencao} className="grid gap-3">
              <CampoSelect nome="cliente_id" label="Cliente" opcoes={opcoesCliente} vazioLabel="—" />
              <CampoSelect nome="projeto_id" label="Projeto" opcoes={opcoesProjeto} vazioLabel="—" />
              <CampoSelect
                nome="plano"
                label="Plano"
                opcoes={PLANOS_MANUTENCAO.map((p) => ({ valor: p.id, label: p.nome }))}
              />
              <Campo nome="valor_mensal" label="Valor por ciclo (€)" tipo="number" valor={39} />
              <CampoSelect nome="ciclo" label="Ciclo" opcoes={PERIODICIDADES} />
              <Campo nome="inicio" label="Início" tipo="date" valor={dia} />
              <Campo nome="notas" label="Notas" area />
              <Button type="submit">Criar plano</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Serviços recorrentes</CardTitle>
          <p className="text-xs text-muted-foreground">
            Domínios, alojamento, email, SEO e suporte. O custo é o que se paga ao fornecedor; o
            preço é o que se cobra ao cliente. A diferença é a margem real.
          </p>
        </CardHeader>
        <CardContent className="px-0">
          {servicos.length === 0 ? (
            <div className="px-6">
              <Vazio titulo="Sem serviços recorrentes registados.">
                Registe domínios e alojamento que já revende: é receita que muitas vezes fica fora
                das contas.
              </Vazio>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead>Renovação</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicos.map((s) => {
                  const margem = s.preco - s.custo;
                  const dias = diasAte(s.renovacao);
                  const atrasada = dias !== null && dias < 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link href={`/clientes/${s.cliente_id}`} className="hover:underline">
                          {s.cliente ?? "Cliente"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{s.tipo}</span>
                        {s.descricao ? (
                          <span className="block text-xs text-muted-foreground">{s.descricao}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.fornecedor ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{eur(s.custo)}</TableCell>
                      <TableCell className="text-right tabular-nums">{eur(s.preco)}</TableCell>
                      <TableCell
                        className={`text-right font-medium tabular-nums ${margem > 0 ? "text-success" : "text-destructive"}`}
                      >
                        {eur(margem)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={atrasada ? "font-medium text-destructive" : undefined}>
                          {s.renovacao ? data(s.renovacao) : "—"}
                        </span>
                        <span className="block text-muted-foreground/70">{s.periodicidade}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {s.estado === "Ativo" ? (
                            <form action={renovarServico}>
                              <input type="hidden" name="id" value={s.id} />
                              <Button type="submit" size="sm" variant="outline">
                                Renovar
                              </Button>
                            </form>
                          ) : (
                            <Badge variant="outline">{s.estado}</Badge>
                          )}
                          <form action={apagarServicoRecorrente}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="cliente_id" value={s.cliente_id} />
                            <Button
                              type="submit"
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <form
            action={guardarServicoRecorrente}
            className="grid gap-3 border-t border-border px-6 pt-4 sm:grid-cols-4"
          >
            <CampoSelect
              nome="cliente_id"
              label="Cliente"
              opcoes={opcoesCliente}
              vazioLabel="Escolher…"
            />
            <CampoSelect nome="tipo" label="Tipo" opcoes={TIPOS_SERVICO_RECORRENTE} />
            <Campo nome="descricao" label="Descrição" placeholder="exemplo.pt" />
            <Campo nome="fornecedor" label="Fornecedor" placeholder="Cloudflare" />
            <Campo nome="custo" label="Custo (€)" tipo="number" step="0.01" valor={0} />
            <Campo nome="preco" label="Preço cobrado (€)" tipo="number" step="0.01" valor={0} />
            <CampoSelect nome="periodicidade" label="Periodicidade" opcoes={PERIODICIDADES} />
            <Campo nome="inicio" label="Início" tipo="date" valor={dia} />
            <div className="sm:col-span-4">
              <Button type="submit" size="sm">
                <Plus className="size-4" /> Adicionar serviço recorrente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
