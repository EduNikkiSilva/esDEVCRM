"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  recebido: { label: "Recebido", color: "var(--chart-3)" },
  pendente: { label: "Pendente", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function GraficoFaturacao({
  dados,
}: {
  dados: { etiqueta: string; recebido: number; pendente: number }[];
}) {
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={dados} barGap={2}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
        <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={54}
          tickFormatter={(v: number) => `${Math.round(v / 100) / 10}k €`}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="recebido" fill="var(--color-recebido)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="pendente" fill="var(--color-pendente)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
