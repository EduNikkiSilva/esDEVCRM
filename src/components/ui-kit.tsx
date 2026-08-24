import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
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
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{titulo}</h2>
        {descricao ? (
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {descricao}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap gap-2">{children}</div> : null}
    </header>
  );
}

const TONS = {
  neutro: { texto: "text-foreground", chip: "bg-secondary text-secondary-foreground" },
  bom: { texto: "text-success", chip: "bg-success/10 text-success" },
  alerta: { texto: "text-warning", chip: "bg-warning/10 text-warning" },
  mau: { texto: "text-destructive", chip: "bg-destructive/10 text-destructive" },
} as const;

export function Stat({
  titulo,
  valor,
  nota,
  tom = "neutro",
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  nota?: string;
  tom?: keyof typeof TONS;
  icone?: LucideIcon;
}) {
  const estilo = TONS[tom];
  return (
    <Card className="cartao-suave gap-0 overflow-hidden py-0">
      <CardContent className="relative px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {titulo}
          </p>
          {Icone ? (
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", estilo.chip)}>
              <Icone className="size-3.5" />
            </span>
          ) : null}
        </div>
        <p className={cn("num mt-2 text-[26px] leading-none font-semibold", estilo.texto)}>
          {valor}
        </p>
        {nota ? <p className="mt-2 text-xs text-muted-foreground">{nota}</p> : null}
      </CardContent>
    </Card>
  );
}

export function Vazio({
  titulo,
  children,
  icone: Icone,
}: {
  titulo: string;
  children?: ReactNode;
  icone?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
      {Icone ? (
        <span className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground">
          <Icone className="size-5" />
        </span>
      ) : null}
      <p className="text-sm font-medium">{titulo}</p>
      {children ? (
        <div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</div>
      ) : null}
    </div>
  );
}

export function Secao({
  titulo,
  acao,
  children,
  className,
}: {
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{titulo}</h3>
        {acao}
      </div>
      {children}
    </section>
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
      <Label htmlFor={nome} className="text-xs font-medium text-muted-foreground">
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
      <Label htmlFor={nome} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <select
        id={nome}
        name={nome}
        defaultValue={valor ?? ""}
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
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
