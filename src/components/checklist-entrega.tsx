"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { guardarChecklist } from "@/lib/actions";
import { CHECKLIST_ENTREGA } from "@/lib/dominio";

export function ChecklistEntrega({
  projetoId,
  concluidos,
}: {
  projetoId: number;
  concluidos: string[];
}) {
  const [itens, setItens] = useState<string[]>(concluidos);
  const [, iniciar] = useTransition();
  const router = useRouter();

  const alternar = (item: string) => {
    const novos = itens.includes(item) ? itens.filter((i) => i !== item) : [...itens, item];
    setItens(novos);
    iniciar(async () => {
      await guardarChecklist(projetoId, novos);
      if (novos.length === CHECKLIST_ENTREGA.length) {
        toast.success("Checklist de entrega completa");
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Progress value={(itens.length / CHECKLIST_ENTREGA.length) * 100} className="h-2" />
        <span className="shrink-0 text-xs text-slate-500 tabular-nums">
          {itens.length}/{CHECKLIST_ENTREGA.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {CHECKLIST_ENTREGA.map((item) => (
          <li key={item}>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={itens.includes(item)}
                onChange={() => alternar(item)}
                className="size-4 accent-slate-900"
              />
              <span className={itens.includes(item) ? "text-slate-400 line-through" : ""}>
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
