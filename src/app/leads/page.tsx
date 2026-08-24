import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuadroPipeline, type LeadQuadro } from "@/components/quadro-pipeline";
import { PageHeader, Stat, Vazio } from "@/components/ui-kit";
import { hoje } from "@/lib/datas";
import { FASES, FASES_ABERTAS, type Fase } from "@/lib/dominio";
import { eur } from "@/lib/format";
import { listarLeads, proximasAcoesPorLead, ultimosContactosPorLead } from "@/lib/queries";

// Lê a base de dados local a cada pedido.
export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string; acompanhamento?: string }>;
}) {
  const { fase: filtro, acompanhamento } = await searchParams;
  const [todas, proximas, contactos] = await Promise.all([
    listarLeads(),
    proximasAcoesPorLead(),
    ultimosContactosPorLead(),
  ]);

  const enriquecidas: LeadQuadro[] = todas.map((l) => ({
    ...l,
    proxima: proximas.get(l.id) ?? null,
    ultimoContacto: contactos.get(l.id) ?? null,
  }));

  const dia = hoje();
  const abertas = enriquecidas.filter((l) => FASES_ABERTAS.includes(l.fase as Fase));
  const semFollowUp = abertas.filter((l) => !l.proxima);
  const atrasadas = abertas.filter((l) => l.proxima && l.proxima.data < dia);

  const leads =
    acompanhamento === "sem-follow-up"
      ? semFollowUp
      : acompanhamento === "atrasados"
        ? atrasadas
        : enriquecidas;

  const colunas = filtro && FASES.includes(filtro as Fase) ? [filtro as Fase] : FASES;
  const valorAberto = abertas.reduce((s, l) => s + l.valor_estimado, 0);
  const ganhas = enriquecidas.filter((l) => ["Entregue", "Manutenção"].includes(l.fase));

  return (
    <>
      <PageHeader
        titulo="Pipeline"
        descricao="Arrasta as leads entre colunas para mudar de fase. Cada cartão mostra a próxima ação; sem ela, o negócio para."
      >
        {filtro || acompanhamento ? (
          <Button asChild variant="outline">
            <Link href="/leads">Ver pipeline completo</Link>
          </Button>
        ) : null}
        <Button asChild>
          <Link href="/leads/nova">Nova lead</Link>
        </Button>
      </PageHeader>

      {todas.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat titulo="Em aberto" valor={String(abertas.length)} nota="Oportunidades ativas" />
          <Stat titulo="Valor do pipeline" valor={eur(valorAberto)} nota="Soma dos valores estimados" />
          <Link href="/leads?acompanhamento=sem-follow-up" className="block">
            <Stat
              titulo="Sem follow-up"
              valor={String(semFollowUp.length)}
              tom={semFollowUp.length ? "alerta" : "bom"}
              nota="Leads em aberto sem próxima ação"
            />
          </Link>
          <Link href="/leads?acompanhamento=atrasados" className="block">
            <Stat
              titulo="Follow-ups atrasados"
              valor={String(atrasadas.length)}
              tom={atrasadas.length ? "mau" : "bom"}
              nota={`${ganhas.length} ganhas até hoje`}
            />
          </Link>
        </div>
      ) : null}

      {todas.length === 0 ? (
        <Vazio titulo="Ainda não há leads registadas." icone={FolderKanban}>
          Cada contacto entra aqui como lead e percorre o pipeline até virar projeto e, depois,
          manutenção.
          <div className="mt-4">
            <Button asChild size="sm">
              <Link href="/leads/nova">Registar a primeira lead</Link>
            </Button>
          </div>
        </Vazio>
      ) : leads.length === 0 ? (
        <Vazio titulo="Nada a acompanhar aqui.">
          Todas as leads em aberto têm a próxima ação marcada e em dia.
        </Vazio>
      ) : (
        <QuadroPipeline leads={leads} fases={colunas} />
      )}
    </>
  );
}
