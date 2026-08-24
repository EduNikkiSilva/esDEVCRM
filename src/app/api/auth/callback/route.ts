import { NextResponse } from "next/server";
import { authConfigurada, emailPermitido, segredoSessao } from "@/lib/auth";
import { COOKIE_SESSAO, DIAS_SESSAO, assinarSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

type Perfil = { email?: string; name?: string; email_verified?: boolean };

/** O id_token vem do endpoint de token do Google por TLS, logo basta descodificar. */
function perfilDoIdToken(idToken: string): Perfil {
  const [, corpo] = idToken.split(".");
  const normalizado = corpo.replaceAll("-", "+").replaceAll("_", "/");
  const preenchido = normalizado.padEnd(Math.ceil(normalizado.length / 4) * 4, "=");
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(preenchido), (c) => c.charCodeAt(0))));
}

export async function GET(pedido: Request) {
  const url = new URL(pedido.url);
  const falhar = (erro: string) => NextResponse.redirect(new URL(`/login?erro=${erro}`, url.origin));

  if (!authConfigurada()) return falhar("nao-configurado");

  const codigo = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = pedido.headers.get("cookie") ?? "";
  const stateEsperado = /esdev_state=([^;]+)/.exec(cookies)?.[1];
  const para = decodeURIComponent(/esdev_para=([^;]+)/.exec(cookies)?.[1] ?? "/");

  if (!codigo || !state || state !== stateEsperado) return falhar("estado-invalido");

  const troca = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: codigo,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${url.origin}/api/auth/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!troca.ok) return falhar("troca-falhou");
  const { id_token: idToken } = (await troca.json()) as { id_token?: string };
  if (!idToken) return falhar("sem-id-token");

  let perfil: Perfil;
  try {
    perfil = perfilDoIdToken(idToken);
  } catch {
    return falhar("id-token-invalido");
  }

  if (!perfil.email_verified || !emailPermitido(perfil.email)) return falhar("sem-permissao");

  const exp = Date.now() + DIAS_SESSAO * 24 * 60 * 60 * 1000;
  const cookie = await assinarSessao(
    { email: perfil.email!.toLowerCase(), nome: perfil.name ?? perfil.email!, exp },
    segredoSessao(),
  );

  const destino = para.startsWith("/") ? para : "/";
  const resposta = NextResponse.redirect(new URL(destino, url.origin));
  resposta.cookies.set(COOKIE_SESSAO, cookie, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    maxAge: DIAS_SESSAO * 24 * 60 * 60,
    path: "/",
  });
  resposta.cookies.delete("esdev_state");
  resposta.cookies.delete("esdev_para");
  return resposta;
}
