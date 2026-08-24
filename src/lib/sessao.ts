/**
 * Sessão assinada em cookie, sem dependências externas.
 *
 * O cookie leva o email autenticado e uma assinatura HMAC-SHA256 feita com
 * SESSAO_SECRET. Sem o segredo não é possível forjar um cookie válido, e a
 * verificação usa Web Crypto para funcionar tanto no servidor como no middleware.
 */
export const COOKIE_SESSAO = "esdev_sessao";
export const DIAS_SESSAO = 30;

export type Sessao = { email: string; nome: string; exp: number };

const codificador = new TextEncoder();

const paraBase64Url = (dados: ArrayBuffer | Uint8Array) => {
  const bytes = dados instanceof Uint8Array ? dados : new Uint8Array(dados);
  let texto = "";
  for (const b of bytes) texto += String.fromCharCode(b);
  return btoa(texto).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};

const deBase64Url = (valor: string) => {
  const normalizado = valor.replaceAll("-", "+").replaceAll("_", "/");
  const preenchido = normalizado.padEnd(Math.ceil(normalizado.length / 4) * 4, "=");
  return Uint8Array.from(atob(preenchido), (c) => c.charCodeAt(0));
};

async function chave(segredo: string) {
  return crypto.subtle.importKey(
    "raw",
    codificador.encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function assinarSessao(sessao: Sessao, segredo: string): Promise<string> {
  const corpo = paraBase64Url(codificador.encode(JSON.stringify(sessao)));
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    await chave(segredo),
    codificador.encode(corpo),
  );
  return `${corpo}.${paraBase64Url(assinatura)}`;
}

export async function lerSessao(cookie: string | undefined, segredo: string) {
  if (!cookie) return null;
  const [corpo, assinatura] = cookie.split(".");
  if (!corpo || !assinatura) return null;

  const valida = await crypto.subtle.verify(
    "HMAC",
    await chave(segredo),
    deBase64Url(assinatura),
    codificador.encode(corpo),
  );
  if (!valida) return null;

  try {
    const sessao = JSON.parse(new TextDecoder().decode(deBase64Url(corpo))) as Sessao;
    if (!sessao.exp || sessao.exp < Date.now()) return null;
    return sessao;
  } catch {
    return null;
  }
}
