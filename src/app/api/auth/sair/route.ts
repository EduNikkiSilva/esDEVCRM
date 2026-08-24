import { NextResponse } from "next/server";
import { COOKIE_SESSAO } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export async function GET(pedido: Request) {
  const resposta = NextResponse.redirect(new URL("/login?saiu=1", new URL(pedido.url).origin));
  resposta.cookies.delete(COOKIE_SESSAO);
  return resposta;
}

export const POST = GET;
