import { CalculadoraPrecos } from "@/components/calculadora-precos";
import { PageHeader } from "@/components/ui-kit";

export default function CalculadoraPage() {
  return (
    <>
      <PageHeader
        titulo="Calculadora de preços"
        descricao="Pacote base + extras + complexidade + urgência + risco + custos externos = preço técnico. Devolve mínimo, recomendado, premium e mensalidade sugerida."
      />
      <CalculadoraPrecos />
    </>
  );
}
