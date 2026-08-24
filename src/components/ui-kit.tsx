import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function PageHeader({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titulo}</h1>
        {descricao ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{descricao}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap gap-2">{children}</div> : null}
    </header>
  );
}

export function Stat({
  titulo,
  valor,
  nota,
  tom = "neutro",
}: {
  titulo: string;
  valor: string;
  nota?: string;
  tom?: "neutro" | "bom" | "alerta";
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{titulo}</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums",
            tom === "bom" && "text-emerald-600",
            tom === "alerta" && "text-amber-600",
          )}
        >
          {valor}
        </p>
        {nota ? <p className="mt-1 text-xs text-slate-500">{nota}</p> : null}
      </CardContent>
    </Card>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <p className="text-sm font-medium text-slate-700">{titulo}</p>
      {children ? <div className="mt-3 text-sm text-slate-500">{children}</div> : null}
    </div>
  );
}

type CampoProps = {
  nome: string;
  label: string;
  valor?: string | number | null;
  tipo?: string;
  placeholder?: string;
  area?: boolean;
  obrigatorio?: boolean;
  className?: string;
  step?: string;
};

export function Campo({
  nome,
  label,
  valor,
  tipo = "text",
  placeholder,
  area,
  obrigatorio,
  className,
  step,
}: CampoProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={nome} className="text-xs font-medium text-slate-600">
        {label}
      </Label>
      {area ? (
        <Textarea
          id={nome}
          name={nome}
          defaultValue={valor ?? ""}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <Input
          id={nome}
          name={nome}
          type={tipo}
          step={step}
          defaultValue={valor ?? ""}
          placeholder={placeholder}
          required={obrigatorio}
        />
      )}
    </div>
  );
}

export function CampoSelect({
  nome,
  label,
  valor,
  opcoes,
  className,
  vazioLabel,
}: {
  nome: string;
  label: string;
  valor?: string | null;
  opcoes: readonly { valor: string; label: string }[] | readonly string[];
  className?: string;
  vazioLabel?: string;
}) {
  const itens = opcoes.map((o) => (typeof o === "string" ? { valor: o, label: o } : o));
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={nome} className="text-xs font-medium text-slate-600">
        {label}
      </Label>
      <select
        id={nome}
        name={nome}
        defaultValue={valor ?? ""}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-xs outline-none focus-visible:border-slate-400 focus-visible:ring-[3px] focus-visible:ring-slate-200"
      >
        {vazioLabel ? <option value="">{vazioLabel}</option> : null}
        {itens.map((i) => (
          <option key={i.valor} value={i.valor}>
            {i.label}
          </option>
        ))}
      </select>
    </div>
  );
}
