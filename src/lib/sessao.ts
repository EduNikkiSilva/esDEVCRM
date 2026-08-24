/**
 * Sessão assinada em cookie, sem dependências externas.
 *
 * O cookie leva o email autenticado e uma assinatura HMAC-SHA256 feita com
 * SESSAO_SECRET. Sem o segredo não é possível forjar um cookie válido, e a
 * verificação usa Web Crypto para funcionar tanto no servidor como no middleware.
 */
export const COOKIE_SESSAO = "esdev_sessao";

/** Duração máxima de uma sessão, mesmo com uso contínuo. */
export const DIAS_SESSAO = 30;

/** Fim de sessão por inatividade. Configurável em MINUTOS_INATIVIDADE. */
export const MINUTOS_INATIVIDADE = Number(process.env.MINUTOS_INATIVIDADE ?? 30);

/** Só voltamos a assinar o cookie a partir deste tempo, para não o fazer a cada pedido. */
export const MINUTOS_RENOVACAO = 5;

export type Sessao = {
  email: string;
  nome: string;
  /** Fim absoluto da sessão. */
  exp: number;
  /** Última atividade, em milissegundos. */
  ult: number;
};

export type Estado = { sessao: Sessao; renovar: boolean } | null;

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
    // Sessões antigas não trazem "ult": tratamo-las como inativas, para o novo
    // limite de inatividade não ser contornável por um cookie anterior.
    if (typeof sessao.ult !== "number") return null;
    if (Date.now() - sessao.ult > MINUTOS_INATIVIDADE * 60 * 1000) return null;
    return sessao;
  } catch {
    return null;
  }
}

/** Verifica a sessão e diz se o cookie deve ser reemitido com atividade nova. */
export async function estadoSessao(
  cookie: string | undefined,
  segredo: string,
): Promise<Estado> {
  const sessao = await lerSessao(cookie, segredo);
  if (!sessao) return null;
  return { sessao, renovar: Date.now() - sessao.ult > MINUTOS_RENOVACAO * 60 * 1000 };
}
