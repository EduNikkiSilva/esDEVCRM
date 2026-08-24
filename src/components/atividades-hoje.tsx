import Link from "next/link";
import { Check, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adiarAtividade, alternarAtividade } from "@/lib/actions";
import { COR_ATIVIDADE, type TipoAtividade } from "@/lib/dominio";
import { data as formatarData } from "@/lib/format";
import type { Atividade } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Linha = Atividade & { empresa: string | null; cliente: string | null };

/**
 * Lista de ações do bloco "Hoje" do dashboard. Cada linha resolve-se no próprio
 * sítio — concluir ou adiar — para o dashboard ser accionável e não só informativo.
 */
export function ListaAtividades({
  atividades,
  atrasadas,
  vazio,
}: {
  atividades: Linha[];
  atrasadas?: boolean;
  vazio: string;
}) {
  if (atividades.length === 0) {
    return <p className="px-1 py-6 text-center text-sm text-muted-foreground">{vazio}</p>;
  }

  return (
    <ul className="divide-y divide-border/60">
      {atividades.map((a) => {
        const alvo = a.lead_id
          ? `/leads/${a.lead_id}`
          : a.cliente_id
            ? `/clientes/${a.cliente_id}`
            : a.projeto_id
              ? `/projetos/${a.projeto_id}`
              : null;
        const nome = a.empresa ?? a.cliente;

        return (
          <li key={a.id} className="flex flex-wrap items-center gap-2 py-2.5">
            <Badge variant="outline" className={COR_ATIVIDADE[a.tipo as TipoAtividade]}>
              {a.tipo}
            </Badge>
            <span className="text-sm font-medium">{a.titulo}</span>
            {nome ? (
              alvo ? (
                <Link href={alvo} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                  {nome}
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">{nome}</span>
              )
            ) : null}
            <span
              className={cn(
                "text-xs tabular-nums",
                atrasadas ? "font-medium text-destructive" : "text-muted-foreground",
              )}
            >
              {formatarData(a.data)}
              {a.hora ? ` · ${a.hora}` : ""}
            </span>

            <div className="ml-auto flex items-center gap-1">
              <form action={adiarAtividade}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="dias" value={1} />
                <Button type="submit" size="sm" variant="ghost" title="Adiar 1 dia">
                  <CalendarClock className="size-4" />
                </Button>
              </form>
              <form action={alternarAtividade}>
                <input type="hidden" name="id" value={a.id} />
                <Button type="submit" size="sm" variant="outline" title="Marcar como concluída">
                  <Check className="size-4" /> Feito
                </Button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
