"use client";

import { useMemo, useState } from "react";
import { Check, CalendarClock, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Campo, CampoSelect } from "@/components/ui-kit";
import {
  adiarAtividade,
  alternarAtividade,
  apagarAtividade,
  criarAtividade,
} from "@/lib/actions";
import { hoje } from "@/lib/datas";
import { COR_ATIVIDADE, TIPOS_ATIVIDADE, type TipoAtividade } from "@/lib/dominio";
import { data as formatarData } from "@/lib/format";
import type { Atividade } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Alvo = { leadId?: number; clienteId?: number; projetoId?: number };

const ESTADOS = [
  { id: "todas", label: "Todas" },
  { id: "pendentes", label: "Pendentes" },
  { id: "concluidas", label: "Concluídas" },
] as const;

export function TimelineAtividades({
  atividades,
  alvo,
  titulo = "Timeline",
}: {
  atividades: Atividade[];
  alvo: Alvo;
  titulo?: string;
}) {
  const [estado, setEstado] = useState<(typeof ESTADOS)[number]["id"]>("todas");
  const [tipo, setTipo] = useState("");
  const [aberto, setAberto] = useState(false);

  const visiveis = useMemo(
    () =>
      atividades.filter(
        (a) =>
          (tipo === "" || a.tipo === tipo) &&
          (estado === "todas" ||
            (estado === "pendentes" ? !a.concluida : Boolean(a.concluida))),
      ),
    [atividades, estado, tipo],
  );

  const pendentes = atividades.filter((a) => !a.concluida).length;
  const campos = (
    <>
      {alvo.leadId ? <input type="hidden" name="lead_id" value={alvo.leadId} /> : null}
      {alvo.clienteId ? <input type="hidden" name="cliente_id" value={alvo.clienteId} /> : null}
      {alvo.projetoId ? <input type="hidden" name="projeto_id" value={alvo.projetoId} /> : null}
    </>
  );

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold">
          {titulo}
          {pendentes > 0 ? (
            <span className="ml-2 font-normal text-muted-foreground">
              {pendentes} pendente{pendentes === 1 ? "" : "s"}
            </span>
          ) : null}
        </h3>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {ESTADOS.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEstado(e.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                  estado === e.id
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            aria-label="Filtrar por tipo"
            className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
          >
            <option value="">Todos os tipos</option>
            {TIPOS_ATIVIDADE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Button size="sm" variant={aberto ? "secondary" : "default"} onClick={() => setAberto(!aberto)}>
            <Plus className="size-4" /> Atividade
          </Button>
        </div>
      </div>

      {aberto ? (
        <Card className="mb-4">
          <CardContent>
            <form action={criarAtividade} className="grid gap-3 sm:grid-cols-4">
              {campos}
              <CampoSelect nome="tipo" label="Tipo" opcoes={TIPOS_ATIVIDADE} valor="Follow-up" />
              <Campo nome="data" label="Data" tipo="date" valor={hoje()} />
              <Campo nome="hora" label="Hora" tipo="time" />
              <Campo nome="titulo" label="Assunto" obrigatorio placeholder="Ligar para agendar reunião" />
              <div className="sm:col-span-4">
                <Campo nome="descricao" label="Detalhe" area placeholder="O que foi dito, o que ficou combinado…" />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="concluida" value="1" className="size-4 rounded border-input" />
                Já aconteceu (registo de histórico)
              </label>
              <div className="sm:col-span-4">
                <Button type="submit" size="sm">
                  Guardar atividade
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {visiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Sem atividades para mostrar.
        </p>
      ) : (
        <ol className="relative space-y-2 border-l border-border pl-5">
          {visiveis.map((a) => (
            <Linha key={a.id} atividade={a} />
          ))}
        </ol>
      )}
    </section>
  );
}

function Linha({ atividade: a }: { atividade: Atividade }) {
  const concluida = Boolean(a.concluida);
  const atrasada = !concluida && a.data < hoje();
  const hoje_ = !concluida && a.data === hoje();

  return (
    <li className="relative">
      <span
        className={cn(
          "absolute top-3.5 -left-[27px] size-3 rounded-full border-2 border-background",
          concluida ? "bg-success" : atrasada ? "bg-destructive" : "bg-primary",
        )}
      />
      <div
        className={cn(
          "rounded-xl border border-border bg-card px-3 py-2.5",
          atrasada && "border-destructive/40 bg-destructive/[0.03]",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={COR_ATIVIDADE[a.tipo as TipoAtividade]}>
            {a.tipo}
          </Badge>
          <span className={cn("text-sm font-medium", concluida && "text-muted-foreground")}>
            {a.titulo}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatarData(a.data)}
            {a.hora ? ` · ${a.hora}` : ""}
          </span>
          {atrasada ? (
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
              Atrasada
            </Badge>
          ) : hoje_ ? (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Hoje
            </Badge>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
            <form action={alternarAtividade}>
              <input type="hidden" name="id" value={a.id} />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                title={concluida ? "Reabrir" : "Marcar como concluída"}
              >
                {concluida ? <RotateCcw className="size-4" /> : <Check className="size-4" />}
              </Button>
            </form>
            {!concluida ? (
              <form action={adiarAtividade}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="dias" value={7} />
                <Button type="submit" size="sm" variant="ghost" title="Adiar 7 dias">
                  <CalendarClock className="size-4" />
                </Button>
              </form>
            ) : null}
            <form action={apagarAtividade}>
              <input type="hidden" name="id" value={a.id} />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="text-destructive"
                title="Apagar"
              >
                <Trash2 className="size-4" />
              </Button>
            </form>
          </div>
        </div>
        {a.descricao ? (
          <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{a.descricao}</p>
        ) : null}
      </div>
    </li>
  );
}
