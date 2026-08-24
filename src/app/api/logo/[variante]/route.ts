import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { VARIANTES, ficheiroLogotipo, type Variante } from "@/lib/logo";

export const dynamic = "force-dynamic";

const TIPOS: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export async function GET(
  _pedido: Request,
  { params }: { params: Promise<{ variante: string }> },
) {
  const { variante } = await params;
  if (!VARIANTES.includes(variante as Variante)) {
    return new NextResponse("Variante desconhecida", { status: 404 });
  }

  const ficheiro = ficheiroLogotipo(variante as Variante);
  if (!ficheiro) return new NextResponse("Sem logótipo", { status: 404 });

  return new NextResponse(new Uint8Array(fs.readFileSync(ficheiro)), {
    headers: {
      "Content-Type": TIPOS[path.extname(ficheiro).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
