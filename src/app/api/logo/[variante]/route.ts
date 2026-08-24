import { NextResponse } from "next/server";
import { VARIANTES, lerLogotipo, type Variante } from "@/lib/logo";

export const dynamic = "force-dynamic";

export async function GET(
  _pedido: Request,
  { params }: { params: Promise<{ variante: string }> },
) {
  const { variante } = await params;
  if (!VARIANTES.includes(variante as Variante)) {
    return new NextResponse("Variante desconhecida", { status: 404 });
  }

  const ficheiro = await lerLogotipo(variante as Variante);
  if (!ficheiro) return new NextResponse("Sem logótipo", { status: 404 });

  return new NextResponse(new Uint8Array(ficheiro.dados), {
    headers: {
      "Content-Type": ficheiro.tipo,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
