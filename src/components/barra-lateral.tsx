"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Database } from "lucide-react";
import { LogoEsdev } from "@/components/logotipo";
import { SeletorTema } from "@/components/tema";
import type { Logotipos } from "@/lib/logo";
import { NAVEGACAO } from "@/lib/navegacao";
import { cn } from "@/lib/utils";

export function ConteudoBarraLateral({
  onNavegar,
  abrirPaleta,
  logos,
}: {
  onNavegar?: () => void;
  abrirPaleta?: () => void;
  logos: Logotipos;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Link
        href="/"
        onClick={onNavegar}
        className="block px-5 py-5 transition-opacity hover:opacity-80"
      >
        {logos.escuro ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logos.escuro} alt="esDEV" className="h-7 w-auto" />
        ) : (
          <LogoEsdev className="h-7 text-white" />
        )}
        <p className="mt-1.5 text-[11px] tracking-[0.14em] text-white/40 uppercase">
          Sistema operacional
        </p>
      </Link>

      {abrirPaleta ? (
        <button
          type="button"
          onClick={abrirPaleta}
          className="mx-3 mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-card/5 px-3 py-2 text-left text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
        >
          <Command className="size-3.5" />
          Ir para…
          <kbd className="ml-auto rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/60">
            Ctrl K
          </kbd>
        </button>
      ) : null}

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAVEGACAO.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.12em] text-white/35 uppercase">
              {grupo.titulo}
            </p>
            <ul className="space-y-0.5">
              {grupo.links.map(({ href, label, icon: Icone }) => {
                const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavegar}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                        ativo
                          ? "bg-card/10 font-medium text-white"
                          : "text-white/60 hover:bg-card/5 hover:text-white",
                      )}
                    >
                      {ativo ? (
                        <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                      ) : null}
                      <Icone
                        className={cn(
                          "size-4 transition-colors",
                          ativo ? "text-primary" : "text-white/40 group-hover:text-white/70",
                        )}
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-2 text-[11px] text-white/40">
          <Database className="size-3.5 shrink-0" />
          <span className="truncate">Base de dados local · data/esdev.db</span>
        </div>
        <SeletorTema />
      </div>
    </div>
  );
}
