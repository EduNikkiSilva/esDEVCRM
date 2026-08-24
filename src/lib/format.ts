const moeda = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const moedaExata = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export const eur = (v: number | null | undefined) => moeda.format(v ?? 0);
export const eur2 = (v: number | null | undefined) => moedaExata.format(v ?? 0);

export const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

export function data(valor?: string | null) {
  if (!valor) return "—";
  const d = new Date(valor.length <= 10 ? `${valor}T00:00:00` : valor.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

export const hoje = () => new Date().toISOString().slice(0, 10);
