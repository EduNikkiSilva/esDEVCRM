/**
 * Teste de interface com browser real. Verifica que as interações do lado do
 * cliente funcionam: tema, paleta de comandos, calculadora, menu em telemóvel,
 * gráfico e notificações.
 *
 *   node scripts/teste-interface.mjs [url]
 */
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:43127";
const resultados = [];
const erros = [];

const registar = (nome, ok, detalhe = "") => {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? "PASSOU " : "FALHOU "} ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
};

const browser = await chromium.launch();
const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const pagina = await contexto.newPage();
pagina.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
pagina.on("console", (m) => {
  if (m.type() === "error") erros.push(`console: ${m.text()}`);
});

// --- Dashboard e gráfico ---------------------------------------------------
await pagina.goto(url, { waitUntil: "networkidle" });
const barras = await pagina.locator(".recharts-bar-rectangle").count();
registar("Gráfico de faturação desenha barras", barras > 0, `${barras} barras`);

// --- Tema escuro -----------------------------------------------------------
await pagina.getByRole("button", { name: "Tema Escuro" }).click();
await pagina.waitForTimeout(400);
const escuro = await pagina.evaluate(() => document.documentElement.classList.contains("dark"));
registar("Botão de tema escuro aplica a classe dark", escuro);

const fundo = await pagina.evaluate(() => getComputedStyle(document.body).backgroundColor);
registar("Fundo muda no tema escuro", !/255, 255, 255/.test(fundo), fundo);

await pagina.getByRole("button", { name: "Tema Claro" }).click();
await pagina.waitForTimeout(300);
const voltouClaro = await pagina.evaluate(
  () => !document.documentElement.classList.contains("dark"),
);
registar("Botão de tema claro volta atrás", voltouClaro);

// --- Paleta de comandos ----------------------------------------------------
await pagina.keyboard.press("Control+k");
await pagina.waitForTimeout(500);
let paletaVisivel = await pagina.getByPlaceholder(/Procurar página/).isVisible().catch(() => false);
registar("Ctrl+K abre a paleta de comandos", paletaVisivel);

if (paletaVisivel) {
  const dialogo = pagina.locator('[data-slot="dialog-content"]');
  await pagina.getByPlaceholder(/Procurar página/).fill("remod");
  await pagina.waitForTimeout(600);
  const item = dialogo.locator('[data-slot="command-item"]', { hasText: /Remodelações Silva/ }).first();
  const encontrou = await item.isVisible().catch(() => false);
  registar("Paleta encontra a lead pelo nome", encontrou);
  if (encontrou) {
    await item.click();
    await pagina.waitForTimeout(1500);
    registar(
      "Selecionar na paleta navega para a lead",
      /\/leads\/\d+/.test(pagina.url()),
      pagina.url(),
    );
  } else {
    await pagina.keyboard.press("Escape");
  }
}

// --- Botão Procurar do cabeçalho ------------------------------------------
await pagina.goto(url, { waitUntil: "networkidle" });
await pagina.getByRole("button", { name: /Procurar/ }).click();
await pagina.waitForTimeout(500);
paletaVisivel = await pagina.getByPlaceholder(/Procurar página/).isVisible().catch(() => false);
registar("Botão Procurar abre a paleta", paletaVisivel);
await pagina.keyboard.press("Escape");

// --- Calculadora -----------------------------------------------------------
await pagina.goto(`${url}/calculadora`, { waitUntil: "networkidle" });
const precoAntes = await pagina.locator("text=/Preço recomendado/").locator("..").innerText();
await pagina.getByRole("button", { name: "Adicionar Página simples adicional" }).click();
await pagina.getByRole("button", { name: "Adicionar Página simples adicional" }).click();
await pagina.waitForTimeout(400);
const precoDepois = await pagina.locator("text=/Preço recomendado/").locator("..").innerText();
registar(
  "Botão + dos extras altera o preço",
  precoAntes !== precoDepois,
  `${precoAntes.replace(/\s+/g, " ")} → ${precoDepois.replace(/\s+/g, " ")}`,
);

// --- Menu em telemóvel -----------------------------------------------------
const movel = await contexto.newPage();
await movel.setViewportSize({ width: 400, height: 800 });
await movel.goto(url, { waitUntil: "networkidle" });
await movel.getByRole("button", { name: "Abrir menu" }).click();
await movel.waitForTimeout(600);
const navVisivel = await movel
  .getByRole("link", { name: "Faturação" })
  .isVisible()
  .catch(() => false);
registar("Menu em telemóvel abre a navegação", navVisivel);

// --- Arrastar-e-largar e notificação ---------------------------------------
await pagina.goto(`${url}/leads`, { waitUntil: "networkidle" });
const arrastou = await pagina.evaluate(async () => {
  const espera = () => new Promise((r) => setTimeout(r, 150));
  const cartao = [...document.querySelectorAll("article")].find((a) =>
    a.textContent?.includes("Clínica Dentária Nova"),
  );
  // Alterna o destino para o teste funcionar em execuções repetidas.
  const faseAtual = cartao?.closest("section")?.querySelector("h3")?.textContent;
  const destino = faseAtual === "Negociação" ? "Aceite" : "Negociação";
  const coluna = [...document.querySelectorAll("section")].find(
    (s) => s.querySelector("h3")?.textContent === destino,
  );
  if (!cartao || !coluna) return false;
  window.__destino = destino;
  const dt = new DataTransfer();
  cartao.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
  await espera();
  coluna.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer: dt }));
  await espera();
  coluna.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: dt }));
  return true;
});
registar("Cartão e coluna encontrados para arrastar", arrastou);
const destino = await pagina.evaluate(() => window.__destino ?? "Negociação");

if (arrastou) {
  await pagina.waitForTimeout(1500);
  const toast = await pagina
    .locator("[data-sonner-toast]")
    .first()
    .isVisible()
    .catch(() => false);
  registar("Notificação aparece ao mudar a fase", toast);

  await pagina.reload({ waitUntil: "networkidle" });
  const naColuna = await pagina.evaluate((d) => {
    const coluna = [...document.querySelectorAll("section")].find(
      (s) => s.querySelector("h3")?.textContent === d,
    );
    return !!coluna?.textContent?.includes("Clínica Dentária Nova");
  }, destino);
  registar(`Nova fase (${destino}) persiste na base de dados`, naColuna);
}

// --- Logótipo: guardar e remover ------------------------------------------
const imagemTeste = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);
await pagina.goto(`${url}/definicoes`, { waitUntil: "networkidle" });
await pagina.locator("#ficheiro-escuro").setInputFiles({
  name: "logo.png",
  mimeType: "image/png",
  buffer: imagemTeste,
});
await pagina
  .getByRole("button", { name: "Usar este ficheiro" })
  .nth(1)
  .click();
await pagina.waitForTimeout(2000);
const logo = pagina.locator('aside img[alt="esDEV"]').first();
const logoSrc = await logo.getAttribute("src").catch(() => null);
registar("Logótipo carregado aparece na barra lateral", Boolean(logoSrc), logoSrc ?? "sem imagem");
registar(
  "Imagem do logótipo é servida",
  await logo.evaluate((el) => el.naturalWidth > 0).catch(() => false),
);

await pagina
  .getByRole("button", { name: /Remover e voltar ao vetor/ })
  .first()
  .click();
await pagina.waitForTimeout(1500);
registar(
  "Remover o logótipo volta à versão vetorial",
  (await pagina.locator('aside svg[aria-label*="esDEV"]').count()) > 0,
);

await pagina.screenshot({ path: "/tmp/crm-claro.png", fullPage: false });
await pagina.getByRole("button", { name: "Tema Escuro" }).click();
await pagina.waitForTimeout(500);
await pagina.screenshot({ path: "/tmp/crm-escuro.png", fullPage: false });

await browser.close();

console.log("\nErros de consola/página:", erros.length ? erros.slice(0, 10) : "nenhum");
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} verificações passaram`);
process.exit(falhas.length ? 1 : 0);
