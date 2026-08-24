import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Vazio } from "@/components/ui-kit";
import { COR_FASE, FASES, type Fase } from "@/lib/dominio";
import { eur, data } from "@/lib/format";
import { listarLeads } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string }>;
}) {
  const { fase: filtro } = await searchParams;
  const leads = listarLeads();
  const colunas = filtro && FASES.includes(filtro as Fase) ? [filtro as Fase] : FASES;

  return (
    <>
      <PageHeader
        titulo="Pipeline"
        descricao="Lead → Contactado → Reunião → Discovery/Briefing → Proposta → Negociação → Aceite → Contrato → Pagamento inicial → Projeto ativo → Entregue → Manutenção."
      >
        {filtro ? (
          <Button asChild variant="outline">
            <Link href="/leads">Ver pipeline completo</Link>
          </Button>
        ) : null}
        <Button asChild>
          <Link href="/leads/nova">
            <Plus className="size-4" /> Nova lead
          </Link>
        </Button>
      </PageHeader>

      {leads.length === 0 ? (
        <Vazio titulo="Ainda não há leads registadas.">
          Cada contacto entra aqui como lead e percorre o pipeline até virar projeto e, depois,
          manutenção.
          <div className="mt-4">
            <Button asChild size="sm">
              <Link href="/leads/nova">Registar a primeira lead</Link>
            </Button>
          </div>
        </Vazio>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {colunas.map((fase) => {
            const doFase = leads.filter((l) => l.fase === fase);
            const total = doFase.reduce((s, l) => s + (l.valor_estimado ?? 0), 0);
            return (
              <section key={fase} className="w-72 shrink-0">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold">{fase}</h2>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {doFase.length} · {eur(total)}
                  </span>
                </div>
                <div className="space-y-2">
                  {doFase.length === 0 ? (
                    <p className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                      Vazio
                    </p>
                  ) : (
                    doFase.map((l) => (
                      <Link
                        key={l.id}
                        href={`/leads/${l.id}`}
                        className="block rounded-lg border border-slate-200 bg-white p-3 shadow-xs transition-shadow hover:shadow-md"
                      >
                        <p className="truncate text-sm font-semibold">{l.empresa}</p>
                        <p className="truncate text-xs text-slate-500">
                          {l.contacto_nome ?? "Sem contacto"}
                          {l.tipo_solucao ? ` · ${l.tipo_solucao}` : ""}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Badge variant="outline" className={COR_FASE[l.fase as Fase]}>
                            {eur(l.valor_estimado)}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            {data(l.atualizado_em)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
