import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuadroPipeline } from "@/components/quadro-pipeline";
import { PageHeader, Stat, Vazio } from "@/components/ui-kit";
import { FASES, FASES_ABERTAS, type Fase } from "@/lib/dominio";
import { eur } from "@/lib/format";
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

  const abertas = leads.filter((l) => FASES_ABERTAS.includes(l.fase as Fase));
  const valorAberto = abertas.reduce((s, l) => s + l.valor_estimado, 0);
  const ganhas = leads.filter((l) => ["Entregue", "Manutenção"].includes(l.fase));
  const perdidas = leads.filter((l) => l.fase === "Perdido");

  return (
    <>
      <PageHeader
        titulo="Pipeline"
        descricao="Arrasta as leads entre colunas para mudar de fase. O valor de cada coluna atualiza-se de imediato."
      >
        {filtro ? (
          <Button asChild variant="outline">
            <Link href="/leads">Ver pipeline completo</Link>
          </Button>
        ) : null}
      </PageHeader>

      {leads.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat titulo="Em aberto" valor={String(abertas.length)} nota="Oportunidades ativas" />
          <Stat titulo="Valor do pipeline" valor={eur(valorAberto)} nota="Soma dos valores estimados" />
          <Stat titulo="Ganhas" valor={String(ganhas.length)} tom="bom" nota="Entregues ou em manutenção" />
          <Stat
            titulo="Perdidas"
            valor={String(perdidas.length)}
            tom={perdidas.length ? "mau" : "neutro"}
            nota="Analisar o motivo antes de arquivar"
          />
        </div>
      ) : null}

      {leads.length === 0 ? (
        <Vazio titulo="Ainda não há leads registadas." icone={FolderKanban}>
          Cada contacto entra aqui como lead e percorre o pipeline até virar projeto e, depois,
          manutenção.
          <div className="mt-4">
            <Button asChild size="sm">
              <Link href="/leads/nova">Registar a primeira lead</Link>
            </Button>
          </div>
        </Vazio>
      ) : (
        <QuadroPipeline leads={leads} fases={colunas} />
      )}
    </>
  );
}
