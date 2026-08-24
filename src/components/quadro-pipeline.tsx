"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { mudarFaseLead } from "@/lib/actions";
import { COR_FASE, type Fase } from "@/lib/dominio";
import { data, eur } from "@/lib/format";
import { cn } from "@/lib/utils";

export type LeadQuadro = {
  id: number;
  empresa: string;
  contacto_nome: string | null;
  tipo_solucao: string | null;
  fase: string;
  valor_estimado: number;
  atualizado_em: string;
};

export function QuadroPipeline({
  leads: leadsIniciais,
  fases,
}: {
  leads: LeadQuadro[];
  fases: readonly Fase[];
}) {
  const [leads, setLeads] = useState(leadsIniciais);
  const [aArrastar, setAArrastar] = useState<number | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const router = useRouter();

  const largar = (fase: Fase, idDoEvento?: number) => {
    setAlvo(null);
    // O id viaja no próprio evento; o estado serve só para o efeito visual.
    const id = idDoEvento || aArrastar;
    setAArrastar(null);
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.fase === fase) return;

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, fase } : l)));
    iniciar(async () => {
      await mudarFaseLead(id, fase);
      toast.success(`${lead.empresa} → ${fase}`);
      router.refresh();
    });
  };

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      {fases.map((fase) => {
        const doFase = leads.filter((l) => l.fase === fase);
        const total = doFase.reduce((s, l) => s + (l.valor_estimado ?? 0), 0);
        return (
          <section
            key={fase}
            onDragOver={(e) => {
              e.preventDefault();
              setAlvo(fase);
            }}
            onDragLeave={() => setAlvo((a) => (a === fase ? null : a))}
            onDrop={(e) => {
              e.preventDefault();
              largar(fase, Number(e.dataTransfer.getData("text/plain")) || undefined);
            }}
            className={cn(
              "w-[17rem] shrink-0 rounded-2xl border bg-card/50 p-2.5 transition-colors",
              alvo === fase ? "border-primary bg-accent/40" : "border-border",
            )}
          >
            <header className="mb-2.5 flex items-center justify-between gap-2 px-1.5">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", corPonto(fase))} />
                <h3 className="text-[13px] font-semibold">{fase}</h3>
              </div>
              <span className="num text-[11px] text-muted-foreground">
                {doFase.length} · {eur(total)}
              </span>
            </header>

            <div className="space-y-2">
              {doFase.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 px-3 py-8 text-center text-[11px] text-muted-foreground/70">
                  Arrasta uma lead para aqui
                </p>
              ) : (
                doFase.map((l) => (
                  <article
                    key={l.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(l.id));
                      e.dataTransfer.effectAllowed = "move";
                      setAArrastar(l.id);
                    }}
                    onDragEnd={() => setAArrastar(null)}
                    className={cn(
                      "cartao-suave group cursor-grab rounded-xl border border-border bg-card p-3 transition-all active:cursor-grabbing",
                      aArrastar === l.id ? "opacity-40" : "hover:-translate-y-0.5",
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/leads/${l.id}`}
                          className="block truncate text-sm font-semibold hover:underline"
                        >
                          {l.empresa}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.contacto_nome ?? "Sem contacto"}
                          {l.tipo_solucao ? ` · ${l.tipo_solucao}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <Badge variant="outline" className={cn("num", COR_FASE[fase])}>
                        {eur(l.valor_estimado)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/70">
                        {data(l.atualizado_em)}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function corPonto(fase: Fase) {
  if (fase === "Perdido") return "bg-chart-5";
  if (fase === "Manutenção" || fase === "Entregue") return "bg-chart-3";
  if (fase === "Negociação") return "bg-chart-4";
  if (fase.startsWith("Proposta") || fase.startsWith("Discovery")) return "bg-chart-1";
  return "bg-chart-2";
}
