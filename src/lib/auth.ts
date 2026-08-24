import { cookies } from "next/headers";
import { COOKIE_SESSAO, lerSessao, type Sessao } from "@/lib/sessao";

/**
 * Autenticação com a conta Google, restrita aos endereços autorizados.
 *
 * Variáveis de ambiente:
 *   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET  credenciais OAuth do Google Cloud
 *   SESSAO_SECRET                            segredo para assinar o cookie
 *   EMAILS_PERMITIDOS                        lista separada por vírgulas
 *
 * Enquanto estas variáveis não existirem, a aplicação continua acessível — é o
 * modo local. A interface mostra um aviso, para nunca ser publicada assim.
 */
export const EMAILS_PERMITIDOS = (process.env.EMAILS_PERMITIDOS ?? "geral@esdev.pt")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const segredoSessao = () => process.env.SESSAO_SECRET ?? "";

export const authConfigurada = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && segredoSessao());

export function emailPermitido(email: string | undefined | null) {
  if (!email) return false;
  return EMAILS_PERMITIDOS.includes(email.toLowerCase());
}

/** Sessão atual, ou null. Devolve null quando a autenticação não está configurada. */
export async function sessaoAtual(): Promise<Sessao | null> {
  if (!authConfigurada()) return null;
  const cookie = (await cookies()).get(COOKIE_SESSAO)?.value;
  return lerSessao(cookie, segredoSessao());
}
