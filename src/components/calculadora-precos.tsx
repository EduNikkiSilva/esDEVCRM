"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Save, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { guardarAnalise } from "@/lib/actions";
import { eur, eur2, pct } from "@/lib/format";
import {
  EIXOS_COMPLEXIDADE,
  EXTRAS,
  GRUPOS_EXTRAS,
  INPUTS_INICIAIS,
  PACOTES,
  VALOR_HORA_INTERNO,
  calcularPreco,
  type CategoriaPacote,
  type EixoComplexidade,
  type InputsCalculadora,
} from "@/lib/pricing";

const CATEGORIAS: CategoriaPacote[] = ["Website", "E-commerce", "Software / CRM"];

export function CalculadoraPrecos({
  leadId,
  inputsIniciais,
  titulo,
}: {
  leadId?: number;
  inputsIniciais?: InputsCalculadora;
  titulo?: string;
}) {
  const [inputs, setInputs] = useState<InputsCalculadora>(inputsIniciais ?? INPUTS_INICIAIS);
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  const r = useMemo(() => calcularPreco(inputs), [inputs]);

  const atualizar = (parcial: Partial<InputsCalculadora>) =>
    setInputs((prev) => ({ ...prev, ...parcial }));

  const mudarExtra = (id: string, delta: number) =>
    setInputs((prev) => {
      const atual = prev.extras[id] ?? 0;
      const novo = Math.max(0, atual + delta);
      const extras = { ...prev.extras };
      if (novo === 0) delete extras[id];
      else extras[id] = novo;
      return { ...prev, extras };
    });

  const mudarComplexidade = (eixo: EixoComplexidade, valor: number) =>
    setInputs((prev) => ({ ...prev, complexidade: { ...prev.complexidade, [eixo]: valor } }));

  const guardar = () =>
    iniciar(async () => {
      await guardarAnalise(inputs, { leadId, titulo: titulo ?? r.pacote.nome });
      toast.success("Análise guardada", {
        description: leadId
          ? "O valor estimado da lead foi atualizado com o preço recomendado."
          : "Disponível no histórico de análises.",
      });
      router.refresh();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pacote base (§8)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {CATEGORIAS.map((categoria) => (
              <div key={categoria}>
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {categoria}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PACOTES.filter((p) => p.categoria === categoria).map((p) => {
                    const ativo = p.id === inputs.pacoteId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => atualizar({ pacoteId: p.id })}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          ativo
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-ring"
                        }`}
                      >
                        <p className="text-sm font-semibold">{p.nome}</p>
                        <p
                          className={`mt-0.5 text-xs ${
                            ativo ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          {p.descricao}
                        </p>
                        <p className="mt-1.5 text-xs font-medium tabular-nums">
                          {eur(p.minimo)} · {eur(p.recomendado)} · {eur(p.premium)}
                        </p>
                        <p
                          className={`mt-0.5 text-[11px] ${
                            ativo ? "text-primary-foreground/70" : "text-muted-foreground/70"
                          }`}
                        >
                          Mercado: {p.mercado}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extras e funcionalidades (§9)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {GRUPOS_EXTRAS.map((grupo) => (
              <div key={grupo}>
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {grupo}
                </p>
                <ul className="divide-y divide-border/60">
                  {EXTRAS.filter((e) => e.grupo === grupo).map((e) => {
                    const q = inputs.extras[e.id] ?? 0;
                    return (
                      <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm">{e.nome}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {e.minimo === e.premium
                              ? eur(e.recomendado)
                              : `${eur(e.minimo)} – ${eur(e.premium)}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-7"
                            onClick={() => mudarExtra(e.id, -1)}
                            disabled={q === 0}
                            aria-label={`Remover ${e.nome}`}
                          >
                            <Minus className="size-3.5" />
                          </Button>
                          <span
                            className={`w-6 text-center text-sm tabular-nums ${
                              q ? "font-semibold" : "text-muted-foreground/70"
                            }`}
                          >
                            {q}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-7"
                            onClick={() => mudarExtra(e.id, 1)}
                            aria-label={`Adicionar ${e.nome}`}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise interna (§6)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {EIXOS_COMPLEXIDADE.map((eixo) => (
              <div key={eixo.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div>
                  <Label className="text-sm font-normal text-foreground/80">{eixo.nome}</Label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={inputs.complexidade[eixo.id]}
                    onChange={(ev) => mudarComplexidade(eixo.id, Number(ev.target.value))}
                    className="mt-1 w-full accent-primary"
                  />
                </div>
                <span className="w-6 text-center text-sm font-semibold tabular-nums">
                  {inputs.complexidade[eixo.id]}
                </span>
              </div>
            ))}

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm font-normal text-foreground/80">
                  Urgência — acresce {pct(r.acrescimoUrgencia)}
                </Label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={inputs.urgencia}
                  onChange={(e) => atualizar({ urgencia: Number(e.target.value) })}
                  className="mt-1 w-full accent-primary"
                />
              </div>
              <div>
                <Label className="text-sm font-normal text-foreground/80">
                  Risco — margem de {pct(r.margemRisco)}
                </Label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={inputs.risco}
                  onChange={(e) => atualizar({ risco: Number(e.target.value) })}
                  className="mt-1 w-full accent-primary"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={inputs.prioritario}
                onChange={(e) => atualizar({ prioritario: e.target.checked })}
                className="size-4 accent-primary"
              />
              Desenvolvimento prioritário (+10%)
            </label>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="horas" className="text-xs text-muted-foreground">
                  Horas estimadas
                </Label>
                <Input
                  id="horas"
                  type="number"
                  min={0}
                  step={1}
                  value={inputs.horasEstimadas}
                  onChange={(e) => atualizar({ horasEstimadas: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="custos" className="text-xs text-muted-foreground">
                  Custos externos (€)
                </Label>
                <Input
                  id="custos"
                  type="number"
                  min={0}
                  step={10}
                  value={inputs.custosExternos}
                  onChange={(e) => atualizar({ custosExternos: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ajuste" className="text-xs text-muted-foreground">
                  Ajuste comercial (%)
                </Label>
                <Input
                  id="ajuste"
                  type="number"
                  step={1}
                  value={inputs.ajusteComercial}
                  onChange={(e) => atualizar({ ajusteComercial: Number(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {[
                { rotulo: "Preço mínimo", valor: r.precoFinal.minimo, nota: "Essential" },
                {
                  rotulo: "Preço recomendado",
                  valor: r.precoFinal.recomendado,
                  nota: "Business",
                  destaque: true,
                },
                { rotulo: "Preço premium", valor: r.precoFinal.premium, nota: "Premium" },
              ].map((l) => (
                <div
                  key={l.rotulo}
                  className={`flex items-baseline justify-between rounded-md px-3 py-2 ${
                    l.destaque ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  <span className="text-xs">
                    {l.rotulo}
                    <span className={l.destaque ? "text-primary-foreground/70" : "text-muted-foreground"}>
                      {" "}
                      · {l.nota}
                    </span>
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${l.destaque ? "text-xl" : "text-base"}`}
                  >
                    {eur(l.valor)}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">Mensalidade recomendada</p>
              <p className="text-lg font-semibold tabular-nums">{eur(r.manutencao.valor)}/mês</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {r.manutencao.nome} · faixa {eur(r.manutencao.minimo)}–{eur(r.manutencao.maximo)}
              </p>
            </div>

            <div
              className={`rounded-md border p-3 ${
                r.rentabilidadeOk
                  ? "border-success/30 bg-success/10"
                  : "border-destructive/30 bg-destructive/10"
              }`}
            >
              <p className="text-xs text-muted-foreground">Valor/hora efetivo (§29)</p>
              <p className="text-lg font-semibold tabular-nums">{eur2(r.valorHora)}/h</p>
              <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                {!r.rentabilidadeOk ? <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> : null}
                Referência interna {eur(VALOR_HORA_INTERNO)}/h
              </p>
            </div>

            <Separator />

            <dl className="space-y-1.5 text-xs">
              <Linha rotulo="Pacote base" valor={eur(r.base.recomendado)} />
              <Linha rotulo="Extras" valor={eur(r.extras.recomendado)} />
              <Linha rotulo="Complexidade média" valor={r.mediaComplexidade.toFixed(1)} />
              <Linha rotulo="Fator complexidade" valor={`×${r.fatorComplexidade.toFixed(2)}`} />
              <Linha rotulo="Urgência" valor={`+${pct(r.acrescimoUrgencia)}`} />
              <Linha rotulo="Prioritário" valor={`+${pct(r.acrescimoPrioritario)}`} />
              <Linha rotulo="Margem de risco" valor={`+${pct(r.margemRisco)}`} />
              <Linha rotulo="Custos externos" valor={eur(r.custosExternos)} />
              <Linha rotulo="Preço técnico" valor={eur(r.precoTecnico.recomendado)} />
            </dl>

            {r.linhasExtras.length > 0 ? (
              <>
                <Separator />
                <div className="flex flex-wrap gap-1">
                  {r.linhasExtras.map((l) => (
                    <Badge key={l.extra.id} variant="secondary" className="font-normal">
                      {l.quantidade}× {l.extra.nome}
                    </Badge>
                  ))}
                </div>
              </>
            ) : null}

            <Button className="w-full" onClick={guardar} disabled={pendente}>
              <Save className="size-4" />
              {pendente ? "A guardar…" : leadId ? "Guardar na lead" : "Guardar análise"}
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium tabular-nums">{valor}</dd>
    </div>
  );
}
