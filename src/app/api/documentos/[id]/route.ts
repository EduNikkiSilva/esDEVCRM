import { NextResponse } from "next/server";
import { authConfigurada, sessaoAtual } from "@/lib/auth";
import { consulta } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Descarrega o anexo de um contrato (BLOB em `ficheiros`). */
export async function GET(
  _pedido: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (authConfigurada()) {
    const sessao = await sessaoAtual();
    if (!sessao) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }
  }

  const { id } = await params;
  const contratoId = Number(id);
  if (!Number.isFinite(contratoId) || contratoId <= 0) {
    return new NextResponse("Contrato inválido", { status: 400 });
  }

  const contrato = await consulta<{ ficheiro: string | null }>(
    "SELECT ficheiro FROM contratos WHERE id = ?",
    contratoId,
  );
  if (!contrato[0]) return new NextResponse("Contrato não encontrado", { status: 404 });

  const ficheiros = await consulta<{ tipo: string; dados: Uint8Array | Buffer }>(
    "SELECT tipo, dados FROM ficheiros WHERE chave = ?",
    `contrato:${contratoId}`,
  );
  if (!ficheiros[0]) return new NextResponse("Documento não encontrado", { status: 404 });

  const nome = (contrato[0].ficheiro || `contrato-${contratoId}`).replace(/[^\w.\- ()\[\]]+/g, "_");
  const bytes = Buffer.from(ficheiros[0].dados);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": ficheiros[0].tipo || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
