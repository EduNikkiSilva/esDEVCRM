import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerSessao } from "@/lib/sessao";

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

  const sessao = await lerSessao(pedido.cookies.get(COOKIE_SESSAO)?.value, segredo!);
  if (sessao) return NextResponse.next();

  const login = new URL("/login", pedido.nextUrl);
  login.searchParams.set("para", `${pathname}${search}`);
  const resposta = NextResponse.redirect(login);
  resposta.cookies.delete(COOKIE_SESSAO);
  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
