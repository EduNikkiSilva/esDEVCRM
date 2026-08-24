import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_SESSAO,
  DIAS_SESSAO,
  assinarSessao,
  estadoSessao,
} from "@/lib/sessao";

/**
 * Trava a aplicação toda. Sem sessão válida, o visitante só vê o ecrã de login —
 * nem o nome dos módulos. Quando as variáveis de autenticação não estão
 * definidas (uso local), deixa passar.
 *
 * A verificação é feita aqui, antes de qualquer página, para o CRM poder viver
 * num endereço público sem depender de o URL ser secreto. No Next 16 este ficheiro
 * chama-se `proxy.ts`; o antigo `middleware.ts` está descontinuado.
 */
const PUBLICOS = ["/login", "/api/auth", "/api/logo", "/icon.svg", "/manifest.webmanifest"];

export async function proxy(pedido: NextRequest) {
  const segredo = process.env.SESSAO_SECRET;
  const configurada = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && segredo,
  );
  if (!configurada) return NextResponse.next();

  const { pathname, search } = pedido.nextUrl;
  if (PUBLICOS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const estado = await estadoSessao(pedido.cookies.get(COOKIE_SESSAO)?.value, segredo!);
  if (estado) {
    if (!estado.renovar) return NextResponse.next();

    // Renovação deslizante: cada utilização adia o fim por inatividade, sem
    // nunca passar do limite absoluto da sessão.
    const resposta = NextResponse.next();
    const cookie = await assinarSessao({ ...estado.sessao, ult: Date.now() }, segredo!);
    resposta.cookies.set(COOKIE_SESSAO, cookie, {
      httpOnly: true,
      secure: pedido.nextUrl.protocol === "https:",
      sameSite: "lax",
      maxAge: DIAS_SESSAO * 24 * 60 * 60,
      path: "/",
    });
    return resposta;
  }

  const login = new URL("/login", pedido.nextUrl);
  login.searchParams.set("para", `${pathname}${search}`);
  if (pedido.cookies.has(COOKIE_SESSAO)) login.searchParams.set("expirou", "1");
  const resposta = NextResponse.redirect(login);
  resposta.cookies.delete(COOKIE_SESSAO);
  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
