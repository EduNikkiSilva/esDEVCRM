"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { guardarBriefing } from "@/lib/actions";
import { BRIEFING, type CampoBriefing } from "@/lib/dominio";

type Valor = string | number | string[] | undefined;

export function BriefingForm({
  leadId,
  dadosIniciais,
}: {
  leadId: number;
  dadosIniciais: Record<string, Valor>;
}) {
  const [dados, setDados] = useState<Record<string, Valor>>(dadosIniciais ?? {});
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  const totalCampos = useMemo(
    () => BRIEFING.reduce((s, sec) => s + sec.campos.length, 0),
    [],
  );
  const preenchidos = useMemo(
    () =>
      Object.values(dados).filter(
        (v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && String(v).trim() !== ""),
      ).length,
    [dados],
  );

  const definir = (id: string, valor: Valor) => setDados((prev) => ({ ...prev, [id]: valor }));

  const alternarMulti = (id: string, opcao: string) =>
    setDados((prev) => {
      const atual = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      const novo = atual.includes(opcao)
        ? atual.filter((o) => o !== opcao)
        : [...atual, opcao];
      return { ...prev, [id]: novo };
    });

  const guardar = () =>
    iniciar(async () => {
      await guardarBriefing(leadId, dados);
      toast.success("Briefing guardado");
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Progress value={(preenchidos / totalCampos) * 100} className="h-2" />
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {preenchidos}/{totalCampos} campos
        </span>
        <Button size="sm" onClick={guardar} disabled={pendente}>
          <Save className="size-4" /> {pendente ? "A guardar…" : "Guardar"}
        </Button>
      </div>

      {BRIEFING.map((secao) => (
        <Card key={secao.id}>
          <CardHeader>
            <CardTitle className="text-base">{secao.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {secao.campos.map((campo) => (
              <CampoDinamico
                key={campo.id}
                campo={campo}
                valor={dados[campo.id]}
                definir={definir}
                alternarMulti={alternarMulti}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={pendente}>
          <Save className="size-4" /> {pendente ? "A guardar…" : "Guardar briefing"}
        </Button>
      </div>
    </div>
  );
}

function CampoDinamico({
  campo,
  valor,
  definir,
  alternarMulti,
}: {
  campo: CampoBriefing;
  valor: Valor;
  definir: (id: string, valor: Valor) => void;
  alternarMulti: (id: string, opcao: string) => void;
}) {
  const largo = campo.tipo === "area" || campo.tipo === "multi";

  return (
    <div className={largo ? "sm:col-span-2" : undefined}>
      <Label className="text-xs font-medium text-muted-foreground">{campo.label}</Label>
      <div className="mt-1.5">
        {campo.tipo === "area" ? (
          <Textarea
            rows={2}
            value={(valor as string) ?? ""}
            onChange={(e) => definir(campo.id, e.target.value)}
          />
        ) : campo.tipo === "numero" ? (
          <Input
            type="number"
            value={(valor as number) ?? ""}
            onChange={(e) => definir(campo.id, e.target.value)}
          />
        ) : campo.tipo === "opcoes" ? (
          <select
            value={(valor as string) ?? ""}
            onChange={(e) => definir(campo.id, e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring"
          >
            <option value="">—</option>
            {campo.opcoes?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : campo.tipo === "multi" ? (
          <div className="flex flex-wrap gap-1.5">
            {campo.opcoes?.map((o) => {
              const ativo = Array.isArray(valor) && valor.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => alternarMulti(campo.id, o)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    ativo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-ring"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        ) : (
          <Input
            value={(valor as string) ?? ""}
            onChange={(e) => definir(campo.id, e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
