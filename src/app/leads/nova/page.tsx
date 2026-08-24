import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormularioAcao } from "@/components/formulario-acao";
import { Campo, CampoSelect, PageHeader } from "@/components/ui-kit";
import { criarLead } from "@/lib/actions";
import { hoje } from "@/lib/datas";
import { FAIXAS_ORCAMENTO, FASES, ORIGENS_LEAD, TIPOS_SOLUCAO } from "@/lib/dominio";

export default function NovaLeadPage() {
  return (
    <>
      <PageHeader
        titulo="Nova lead"
        descricao="O mínimo para começar: quem é, o que quer e por onde chegou. O resto preenche-se no briefing."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <FormularioAcao action={criarLead} className="grid gap-4 sm:grid-cols-2">
            <Campo nome="empresa" label="Empresa / Nome" obrigatorio placeholder="Remodelações Silva" />
            <Campo nome="contacto_nome" label="Pessoa de contacto" />
            <Campo nome="email" label="Email" tipo="email" />
            <Campo nome="telefone" label="Telefone" />
            <CampoSelect nome="origem" label="Origem" opcoes={ORIGENS_LEAD} vazioLabel="—" />
            <CampoSelect nome="fase" label="Fase" opcoes={FASES} valor="Novo Lead" />
            <CampoSelect
              nome="tipo_solucao"
              label="Tipo de solução"
              opcoes={TIPOS_SOLUCAO}
              vazioLabel="A definir"
            />
            <CampoSelect
              nome="orcamento_indicado"
              label="Investimento indicado pelo cliente"
              opcoes={FAIXAS_ORCAMENTO}
              valor="Ainda não definido"
            />
            <Campo
              nome="valor_estimado"
              label="Valor estimado (€)"
              tipo="number"
              step="10"
              valor={0}
            />
            <Campo nome="responsavel" label="Responsável" placeholder="Eduardo" />
            <Campo
              nome="primeiro_contacto"
              label="Primeiro contacto a fazer"
              tipo="date"
              valor={hoje()}
            />
            <div className="sm:col-span-2">
              <Campo nome="notas" label="Notas" area placeholder="Contexto do primeiro contacto…" />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Criar lead</Button>
              <Button asChild variant="ghost">
                <Link href="/leads">Cancelar</Link>
              </Button>
            </div>
          </FormularioAcao>
        </CardContent>
      </Card>
    </>
  );
}
