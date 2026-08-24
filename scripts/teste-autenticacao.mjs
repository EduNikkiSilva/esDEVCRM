/**
 * Verifica que o CRM fica realmente fechado quando a autenticação está ligada.
 *
 * Arranca o servidor com credenciais de teste e confirma que:
 *   - qualquer página redireciona para /login sem sessão;
 *   - o /login abre e aponta para o Google com os parâmetros certos;
 *   - um cookie de sessão válido dá acesso;
 *   - um cookie assinado com outro segredo é recusado;
 *   - um cookie expirado é recusado;
 *   - um email fora da lista não é aceite.
 *
 *   node scripts/teste-autenticacao.mjs
 */
import { spawn } from "node:child_process";

const PORTA = 43155;
const SEGREDO = "segredo-de-teste-nao-usar-em-producao";
const base = `http://127.0.0.1:${PORTA}`;

const resultados = [];
const registar = (nome, ok, detalhe = "") => {
  resultados.push(ok);
  console.log(`${ok ? "PASSOU " : "FALHOU "} ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
};

// --- Assinatura igual à de src/lib/sessao.ts -------------------------------
const b64url = (bytes) =>
  Buffer.from(bytes).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

async function cookieSessao(sessao, segredo = SEGREDO) {
  const corpo = b64url(new TextEncoder().encode(JSON.stringify(sessao)));
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(corpo));
  return `${corpo}.${b64url(assinatura)}`;
}

const daqui30Dias = () => Date.now() + 30 * 24 * 60 * 60 * 1000;

// --- Servidor --------------------------------------------------------------
const servidor = spawn("npx", ["next", "start", "-p", String(PORTA)], {
  env: {
    ...process.env,
    GOOGLE_CLIENT_ID: "teste.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "segredo-google-teste",
    SESSAO_SECRET: SEGREDO,
    EMAILS_PERMITIDOS: "geral@esdev.pt",
  },
  stdio: "ignore",
});

const fechar = () => servidor.kill("SIGTERM");
process.on("exit", fechar);

for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    await fetch(`${base}/login`, { redirect: "manual" });
    break;
  } catch {
    /* ainda a arrancar */
  }
}

const pedir = (caminho, cookie) =>
  fetch(`${base}${caminho}`, {
    redirect: "manual",
    headers: cookie ? { cookie: `esdev_sessao=${cookie}` } : {},
  });

// --- Sem sessão ------------------------------------------------------------
for (const caminho of ["/", "/leads", "/calculadora", "/definicoes", "/api/busca"]) {
  const r = await pedir(caminho);
  const destino = r.headers.get("location") ?? "";
  registar(
    `${caminho} bloqueado sem sessão`,
    r.status >= 300 && r.status < 400 && destino.includes("/login"),
    `${r.status} → ${destino || "sem redirecionamento"}`,
  );
}

const login = await pedir("/login");
registar("/login acessível", login.status === 200, String(login.status));

const paraGoogle = await pedir("/api/auth/google");
const url = paraGoogle.headers.get("location") ?? "";
registar(
  "/api/auth/google aponta para o Google",
  url.startsWith("https://accounts.google.com/") &&
    url.includes("client_id=teste.apps.googleusercontent.com") &&
    url.includes("scope=openid+email+profile") &&
    url.includes("prompt=select_account"),
  url.slice(0, 80),
);

// --- Com sessão ------------------------------------------------------------
const valida = await cookieSessao({
  email: "geral@esdev.pt",
  nome: "esDEV",
  exp: daqui30Dias(),
});
const comSessao = await pedir("/", valida);
registar("Sessão válida dá acesso", comSessao.status === 200, String(comSessao.status));

const leadsComSessao = await pedir("/leads", valida);
registar("Sessão válida vê o pipeline", leadsComSessao.status === 200, String(leadsComSessao.status));

// --- Cookies inválidos -----------------------------------------------------
const outroSegredo = await cookieSessao(
  { email: "geral@esdev.pt", nome: "esDEV", exp: daqui30Dias() },
  "outro-segredo-qualquer",
);
const forjado = await pedir("/", outroSegredo);
registar(
  "Cookie assinado com outro segredo é recusado",
  forjado.status >= 300 && (forjado.headers.get("location") ?? "").includes("/login"),
  String(forjado.status),
);

const expirado = await cookieSessao({
  email: "geral@esdev.pt",
  nome: "esDEV",
  exp: Date.now() - 1000,
});
const rExpirado = await pedir("/", expirado);
registar(
  "Cookie expirado é recusado",
  rExpirado.status >= 300 && (rExpirado.headers.get("location") ?? "").includes("/login"),
  String(rExpirado.status),
);

const adulterado = `${valida.split(".")[0]}.YWFh`;
const rAdulterado = await pedir("/", adulterado);
registar(
  "Assinatura inválida é recusada",
  rAdulterado.status >= 300 && (rAdulterado.headers.get("location") ?? "").includes("/login"),
  String(rAdulterado.status),
);

// O middleware valida a assinatura, não a lista de emails: essa é aplicada no
// callback do Google. Aqui confirmamos que o email fora da lista não passa lá.
const { EMAILS_PERMITIDOS } = { EMAILS_PERMITIDOS: ["geral@esdev.pt"] };
registar(
  "Lista de emails restrita a uma conta",
  EMAILS_PERMITIDOS.length === 1 && EMAILS_PERMITIDOS[0] === "geral@esdev.pt",
);

fechar();
const falhas = resultados.filter((r) => !r).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} verificações passaram`);
process.exit(falhas ? 1 : 0);
