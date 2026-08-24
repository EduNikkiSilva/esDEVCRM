import { NextResponse } from "next/server";
import { authConfigurada, sessaoAtual } from "@/lib/auth";
import { gerarBackup, nomeFicheiroBackup } from "@/lib/backup";
import { caminhoBaseDados, usaPostgres } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Descarrega um JSON com todas as tabelas e ficheiros (logótipos, documentos). */
export async function GET() {
  if (authConfigurada()) {
    const sessao = await sessaoAtual();
    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }
  }

  const backup = await gerarBackup(usaPostgres ? "postgres" : caminhoBaseDados);
  const corpo = JSON.stringify(backup, null, 2);
  const nome = nomeFicheiroBackup();

  return new NextResponse(corpo, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}
