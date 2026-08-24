"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { TODOS_LINKS } from "@/lib/navegacao";

type Resultado = { grupo: string; titulo: string; nota: string; href: string };

export function PaletaComandos({
  aberta,
  onAbertaChange,
}: {
  aberta: boolean;
  onAbertaChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [resultados, setResultados] = useState<Resultado[]>([]);

  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onAbertaChange(!aberta);
      }
    };
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, [aberta, onAbertaChange]);

  useEffect(() => {
    if (!aberta) return;
    let cancelado = false;
    fetch("/api/busca")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelado) setResultados(d.resultados ?? []);
      })
      .catch(() => setResultados([]));
    return () => {
      cancelado = true;
    };
  }, [aberta]);

  const ir = (href: string) => {
    onAbertaChange(false);
    router.push(href);
  };

  const grupos = ["Leads", "Clientes", "Projetos"] as const;

  return (
    <CommandDialog
      open={aberta}
      onOpenChange={onAbertaChange}
      title="Ir para"
      description="Procurar páginas, leads, clientes e projetos"
      className="top-[15%]"
    >
      {/* O CommandDialog do shadcn não inclui a raiz do cmdk: sem este Command
          os itens não têm contexto e a paleta rebenta ao abrir. */}
      <Command>
        <CommandInput placeholder="Procurar página, lead, cliente ou projeto…" />
        <CommandList className="max-h-96">
          <CommandEmpty>Sem resultados.</CommandEmpty>

          <CommandGroup heading="Ações">
            <CommandItem value="nova lead criar" onSelect={() => ir("/leads/nova")}>
              <Plus className="size-4" /> Nova lead
            </CommandItem>
            <CommandItem value="calcular preço orçamento" onSelect={() => ir("/calculadora")}>
              <Plus className="size-4" /> Calcular um preço
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navegação">
            {TODOS_LINKS.map(({ href, label, icon: Icone, descricao }) => (
              <CommandItem key={href} value={`${label} ${descricao}`} onSelect={() => ir(href)}>
                <Icone className="size-4" />
                {label}
                <span className="ml-auto truncate text-xs text-muted-foreground">{descricao}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {grupos.map((grupo) => {
            const itens = resultados.filter((r) => r.grupo === grupo);
            if (itens.length === 0) return null;
            return (
              <CommandGroup key={grupo} heading={grupo}>
                {itens.map((r) => (
                  <CommandItem key={r.href} value={`${r.titulo} ${r.nota}`} onSelect={() => ir(r.href)}>
                    {r.titulo}
                    <span className="ml-auto truncate text-xs text-muted-foreground">{r.nota}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
