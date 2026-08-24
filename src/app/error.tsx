"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Ecrã de erro legível. Sem isto, um erro de servidor mostra apenas a página
 * genérica do alojamento, sem pista do que falhou.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const semBaseDeDados = error.message.includes("DATABASE_URL");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center">
      <Card>
        <CardContent className="space-y-4 py-2">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <TriangleAlert className="size-4" />
            </span>
            <div>
              <h1 className="text-base font-semibold">
                {semBaseDeDados ? "Base de dados não configurada" : "Algo falhou"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {semBaseDeDados
                  ? "O CRM está a correr num alojamento sem disco persistente e não encontrou a variável DATABASE_URL."
                  : "Ocorreu um erro ao preparar esta página."}
              </p>
            </div>
          </div>

          {semBaseDeDados ? (
            <ol className="list-inside list-decimal space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <li>Na Vercel: Storage → Create Database → Neon (Postgres).</li>
              <li>Ligar a base de dados ao projeto, em Production e Preview.</li>
              <li>Deployments → Redeploy, para a variável entrar em vigor.</li>
            </ol>
          ) : (
            <p className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs break-words text-muted-foreground">
              {error.message}
            </p>
          )}

          <div className="flex gap-2">
            <Button onClick={reset}>
              <RefreshCw className="size-4" /> Tentar outra vez
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
