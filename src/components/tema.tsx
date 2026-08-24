"use client";

import { ThemeProvider } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ProvedorTema({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}

const OPCOES = [
  { valor: "light", icone: Sun, rotulo: "Claro" },
  { valor: "dark", icone: Moon, rotulo: "Escuro" },
  { valor: "system", icone: Monitor, rotulo: "Sistema" },
] as const;

export function SeletorTema({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);
  // O tema só é conhecido depois da hidratação; até lá nenhum botão fica ativo.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMontado(true), []);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5",
        className,
      )}
    >
      {OPCOES.map(({ valor, icone: Icone, rotulo }) => {
        const ativo = montado && theme === valor;
        return (
          <button
            key={valor}
            type="button"
            onClick={() => setTheme(valor)}
            aria-label={`Tema ${rotulo}`}
            title={rotulo}
            className={cn(
              "grid size-7 place-items-center rounded-full transition-colors",
              ativo ? "bg-white/15 text-white" : "text-white/50 hover:text-white",
            )}
          >
            <Icone className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
