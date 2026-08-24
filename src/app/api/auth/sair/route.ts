import { NextResponse } from "next/server";
import { ipDoPedido, registarAcesso } from "@/lib/acessos";
import { COOKIE_SESSAO } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export async function GET(pedido: Request) {
  await registarAcesso("saida", {
    ip: ipDoPedido(pedido),
    agente: pedido.headers.get("user-agent"),
  });
  const resposta = NextResponse.redirect(new URL("/login?saiu=1", new URL(pedido.url).origin));
  resposta.cookies.delete(COOKIE_SESSAO);
  return resposta;
}

export const POST = GET;
