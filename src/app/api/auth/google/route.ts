import { NextResponse } from "next/server";
import { authConfigurada } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Início do fluxo OAuth: manda o utilizador ao Google com um state anti-CSRF. */
export async function GET(pedido: Request) {
  if (!authConfigurada()) {
    return NextResponse.redirect(new URL("/login?erro=nao-configurado", pedido.url));
  }

  const url = new URL(pedido.url);
  const para = url.searchParams.get("para") ?? "/";
  const state = crypto.randomUUID();

  const autorizar = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  autorizar.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  autorizar.searchParams.set("redirect_uri", `${url.origin}/api/auth/callback`);
  autorizar.searchParams.set("response_type", "code");
  autorizar.searchParams.set("scope", "openid email profile");
  autorizar.searchParams.set("state", state);
  // Mostra sempre o seletor de contas: é fácil ter várias contas Google abertas.
  autorizar.searchParams.set("prompt", "select_account");

  const resposta = NextResponse.redirect(autorizar);
  const seguro = url.protocol === "https:";
  resposta.cookies.set("esdev_state", state, {
    httpOnly: true,
    secure: seguro,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  resposta.cookies.set("esdev_para", para, {
    httpOnly: true,
    secure: seguro,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return resposta;
}
