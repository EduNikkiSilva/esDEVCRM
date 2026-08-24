"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Search } from "lucide-react";
import { ConteudoBarraLateral } from "@/components/barra-lateral";
import { PaletaComandos } from "@/components/paleta-comandos";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Logotipos } from "@/lib/logo";
import { tituloDaRota } from "@/lib/navegacao";

export function Estrutura({
  children,
  logos,
}: {
  children: React.ReactNode;
  logos: Logotipos;
}) {
  const [paleta, setPaleta] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/5 lg:block">
        <ConteudoBarraLateral logos={logos} abrirPaleta={() => setPaleta(true)} />
      </aside>

      <div className="lg:pl-64">
        <header className="vidro sticky top-0 z-30 border-b">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <Sheet open={menu} onOpenChange={setMenu}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                    <Menu className="size-5" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72 border-r-0 p-0">
                <SheetTitle className="sr-only">Navegação</SheetTitle>
                <ConteudoBarraLateral logos={logos} onNavegar={() => setMenu(false)} />
              </SheetContent>
            </Sheet>

            <h1 className="truncate text-sm font-semibold">{tituloDaRota(pathname)}</h1>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaleta(true)}
                className="gap-2 text-muted-foreground"
              >
                <Search className="size-3.5" />
                <span className="hidden sm:inline">Procurar</span>
                <kbd className="hidden rounded border border-border px-1 font-mono text-[10px] sm:inline">
                  Ctrl K
                </kbd>
              </Button>
              <Button size="sm" asChild>
                <Link href="/leads/nova">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Nova lead</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>

      <PaletaComandos aberta={paleta} onAbertaChange={setPaleta} />
    </div>
  );
}
