# esDEV CRM

CRM interno da esDEV, para correr **localmente no teu computador**. É a implementação do
documento *esDEV — Sistema Operacional e Comercial v1.0*: pipeline comercial, briefing,
análise interna, calculadora de preços, propostas em três níveis, projetos, faturação,
manutenção e receita recorrente.

Os dados ficam num único ficheiro SQLite em `data/esdev.db`. Não há contas, servidores
externos nem nuvem: nada sai da tua máquina.

## Arrancar

**Windows:** corre `instalar.ps1` uma vez — cria a pasta de destino, copia o projeto,
instala, compila, cria os atalhos **esDEV CRM** e arranca. Depois é sempre pelo atalho, ou
por duplo clique em `esdev-crm.bat`. Instala, compila e abre o CRM numa janela
própria, sem barra de endereço, como uma app de desktop. **macOS / Linux:** `./esdev-crm.sh`.

O guia completo de instalação — onde guardar a pasta, como afixar no menu Iniciar, backups e
acesso pelo telemóvel — está em **[INSTALACAO.md](INSTALACAO.md)**.

Manualmente, com **Node.js 22.13 ou superior** (o CRM usa o SQLite embutido no Node):

```bash
npm install
npm run dados-exemplo   # opcional: insere os dois exemplos do documento (§26 e §27)
npm run dev             # desenvolvimento, http://localhost:43127
npm run build && npm start   # uso normal, arranca mais rápido
npm run limpar-dados         # ver quantos registos existem (não apaga)
npm run limpar-dados -- --sim   # apagar tudo e voltar ao zero
```

Não corras `npm run build` com o `npm run dev` ligado: partilham a pasta `.next` e o
servidor de desenvolvimento passa a devolver 403 aos ficheiros de JavaScript, deixando a
página sem interatividade.

Para verificar que as interações do lado do cliente estão de pé (tema, paleta `Ctrl+K`,
calculadora, menu em telemóvel, arrastar no pipeline, gráfico e notificações), com a app a
correr:

```bash
npx playwright install chromium   # uma vez
npm run teste-interface
```

A base de dados é criada automaticamente no primeiro arranque. Para a guardar noutro sítio
(uma pasta sincronizada, por exemplo), define `ESDEV_DB`:

```bash
# Windows PowerShell — permanente para o teu utilizador
[Environment]::SetEnvironmentVariable("ESDEV_DB", "C:\esDEV\data\esdev.db", "User")
```

**Cópia de segurança:** copia `data/esdev.db`. É o sistema todo.

## O que está lá dentro

| Página | O que faz |
|---|---|
| **Dashboard** | Pipeline aberto, recebido, em falta, receita recorrente, projetos ativos, rentabilidade real (§29) e regras de ouro (§25). |
| **Pipeline** | Quadro com as 12 fases do §24, de Novo Lead a Manutenção, com valor por coluna. |
| **Lead** | Cinco separadores: dados, briefing completo do §5, análise interna + calculadora, propostas e conversão em projeto. |
| **Calculadora** | Pacote base (§8) + extras (§9) + complexidade (§6) + urgência + risco + custos externos → mínimo, recomendado, premium e mensalidade sugerida. |
| **Propostas** | Todas as propostas, estado (rascunho / enviada / aceite / recusada) e taxa de aceitação. |
| **Clientes** | Dados de faturação, projetos, faturas e manutenção por cliente. |
| **Projetos** | Fase de desenvolvimento (§16), horas estimadas vs reais, €/h efetivo, checklist de entrega (§17), tarefas e faturas do projeto. |
| **Faturação** | Marcos de pagamento, trabalho adicional e custos de terceiros; pago vs pendente. |
| **Manutenção** | Contratos recorrentes, planos Basic/Business/Pro e receita mensal e anualizada. |
| **Referências** | As tabelas do documento sempre à mão: preços, mercado, extras, planos, processo, contrato, checklists. |

Transversal à app:

- **Tema claro e escuro**, com opção "sistema", no fundo da barra lateral.
- **Paleta de comandos** com `Ctrl+K`: salta para qualquer página, lead, cliente ou projeto.
- **Pipeline com arrastar-e-largar**: mover um cartão entre colunas muda a fase da lead e
  grava logo na base de dados.
- **Responsivo**: em telemóvel a barra lateral vira painel deslizante, útil para consultar uma
  lead numa reunião.

### O fluxo pensado para o dia a dia

1. Entra um contacto → **Nova lead** (fase *Novo Lead*).
2. Reunião → preencher o **briefing** no separador do lead. A barra mostra quanto falta.
3. **Análise & preço**: mexer nos pacotes, extras e nas notas de 1 a 5. Guardar fixa os três
   escalões na lead e atualiza o valor estimado.
4. **Propostas**: criar Essential, Business ou Premium a partir da análise, com âmbito,
   exclusões e rondas de alterações. Marcar como *Enviada* move a lead no pipeline.
5. Proposta aceite → **Converter em projeto**: cria o cliente, o projeto, as faturas do plano
   de pagamento escolhido (50/50 ou 40/30/30) e o contrato de manutenção.
6. Durante o projeto: registar horas reais, avançar a fase, marcar faturas pagas e fechar a
   checklist de entrega.
7. Entregue → o contrato de manutenção passa a contar na receita recorrente.

## Como trabalhamos (regras de colaboração)

A `main` é tua. Eu nunca lhe faço push.

1. **Tu pedes** a alteração, em texto normal.
2. **Eu implemento e testo** aqui, e envio para uma branch com o prefixo `cursor/`.
3. **Tu revês, decides e publicas.** O merge para a `main` é sempre teu.

No teu computador, para trazer e experimentar o que eu fiz:

```powershell
cd "$env:USERPROFILE\Documents\esDEVCRM"
git fetch origin
git checkout cursor/<nome-da-branch>
npm install            # só se as dependências mudaram
npm run dev            # experimentar em http://localhost:43127
```

Se gostares, o merge com a tua assinatura num único commit:

```powershell
git checkout main
git merge --squash cursor/<nome-da-branch>
git commit -m "descrição da alteração"
git push
```

O `--squash` junta o meu trabalho num só commit, assinado por ti — a `main` fica com o teu
histórico, limpo. Se não gostares, `git checkout main` e ignoras a branch; nada se perdeu.

Para apagar branches já integradas:

```powershell
git branch -d cursor/<nome-da-branch>
git push origin --delete cursor/<nome-da-branch>
```

## Fazer alterações

O GitHub é o armazém e o canal de transporte; a edição é sempre em código. Há dois caminhos.

### A. Tu, no teu computador

```powershell
cd "$env:USERPROFILE\Documents\esDEVCRM"
git pull                 # começar sempre por aqui
npm run dev              # http://localhost:43127, recarrega a cada gravação
```

O modo de desenvolvimento mostra as alterações no browser assim que gravas o ficheiro — é o
melhor para mexer em design. Quando estiveres satisfeito:

```powershell
git add -A
git commit -m "o que mudou"
git push
npm run build            # com o dev desligado
```

Não corras `npm run build` com o `npm run dev` ligado: partilham a pasta `.next` e a app fica
sem JavaScript até reiniciares.

### B. Um agente, a partir do repositório GitHub

Abres um agente sobre `esDEVCRM`, descreves o que queres, ele trabalha numa branch e abre um
pull request. Revês o diff no GitHub, fazes merge, e no teu PC:

```powershell
git pull
npm install              # só se as dependências mudaram
npm run build
```

### Onde mexer, por tipo de alteração

| Queres mudar | Ficheiro |
|---|---|
| Cores, tipografia, arredondamentos, tema escuro | `src/app/globals.css` |
| Tabelas de preços, extras, planos, fatores | `src/lib/pricing.ts` |
| Fases do pipeline, briefing, checklists | `src/lib/dominio.ts` |
| Barra lateral, navegação, barra superior | `src/components/barra-lateral.tsx`, `src/components/estrutura.tsx` |
| Uma página concreta | `src/app/<nome>/page.tsx` |
| Estrutura da base de dados | `db/schema.sql` |

### Duas coisas a ter em conta

**Os teus dados nunca são afetados.** A pasta `data/` está fora do Git, por isso um `git pull`
ou um `git checkout` nunca mexe em leads, propostas ou faturas.

**Colunas novas na base de dados precisam de migração.** O esquema é criado com
`CREATE TABLE IF NOT EXISTS`, o que significa que tabelas novas aparecem sozinhas, mas uma
coluna nova numa tabela que já existe **não**. Se uma alteração precisar disso, tem de vir
acompanhada do `ALTER TABLE` correspondente — vale a pena dizê-lo no pedido ao agente.

## Trabalhar com GitHub

O repositório deve ser **privado**: contém tabelas de preços, margens e posicionamento
comercial da esDEV. A pasta `data/` está ignorada pelo Git, por isso a base de dados com
clientes reais e o logótipo que carregares nunca são enviados para o GitHub — só o código.

### Publicar pela primeira vez

Cria no GitHub um repositório privado e vazio chamado `esDEVCRM` (sem README nem
`.gitignore`, para não colidir), e depois, dentro de `Documents\esDEVCRM`:

```powershell
# Se a pasta veio de um ZIP e ainda não tem histórico Git
git init -b main
git add .
git commit -m "esDEV CRM"
git remote add origin https://github.com/<o-teu-utilizador>/esDEVCRM.git
git push -u origin main
```

Se a pasta já foi clonada com histórico, mantém o remoto antigo com outro nome e acrescenta
o GitHub como principal:

```powershell
git remote rename origin cursor
git remote add origin https://github.com/<o-teu-utilizador>/esDEVCRM.git
git push -u origin main
```

### No dia a dia

```powershell
git pull                 # trazer alterações
git add -A
git commit -m "descrição curta do que mudou"
git push
```

### Ativar as verificações automáticas

O ficheiro de CI está em `.github/ci.yml`, fora da pasta que o GitHub lê, porque tokens sem
o âmbito `workflow` não podem criar workflows. Para o ativar, uma vez, na tua máquina:

```powershell
mkdir .github\workflows
git mv .github\ci.yml .github\workflows\ci.yml
git commit -m "Ativar CI"
git push
```

A partir daí cada push corre lint, verificação de tipos e build no GitHub, e vês um visto
vermelho se algo quebrar antes de estragares a instalação local.

### Trabalho com agentes

Depois de o repositório estar no GitHub, é aí que deves ligar os agentes do Cursor: cada
tarefa fica numa branch, revês o diff e fazes merge. Fica tudo com histórico e com CI, em vez
de ficheiros copiados à mão.

## Logótipo

A aplicação traz o logótipo esDEV em vetor (`src/components/logotipo.tsx`), usado na barra
lateral, no ícone da app e na página **Como usar**. Para usar os teus ficheiros originais em
vez da versão vetorial, basta copiá-los para `public/`:

```
public/logo.png          → versão para fundos claros (aceita .svg, .png ou .webp)
public/logo-branco.png   → versão para fundos escuros, usada na barra lateral
```

Se só tiveres uma versão, coloca-a como `logo.png` — é usada nos dois sítios. A aplicação
deteta os ficheiros ao arrancar, sem alterar código.

## Preços — calibração V2 (agosto de 2026)

As tabelas não são as do documento V1: foram recalibradas com preços praticados em Portugal
em 2026, recolhidos de publicações portuguesas de referência. O posicionamento é o do §2 —
acima do freelancer de entrada, abaixo da agência.

| Serviço | Freelancer (mercado) | Agência (mercado) | esDEV |
|---|---|---|---|
| Landing page | 300–1.000 € | 500–2.000 € | 600–1.200 € |
| Site institucional (5–10 páginas) | 1.000–5.000 € | 2.000–10.000 € | 1.900–3.400 € |
| Site médio (10–15 páginas) | 3.500–7.000 € | 3.000–6.000 € | 3.000–5.500 € |
| E-commerce (até 100 produtos) | 2.000–8.000 € | 3.000–15.000 € | 2.400–10.000 € |
| E-commerce à medida / ERP | — | 10.000–50.000 € | 10.000–22.000 € |
| Webapp / plataforma à medida | 8.000–30.000 € | 15.000–80.000 € | 9.000–25.000 € |
| CRM PME pequena | — | 3.000–8.000 € | 4.500–8.000 € |
| CRM PME média | — | 8.000–25.000 € | 9.000–18.000 € |
| Manutenção técnica | — | 40–150 €/mês | 45–95 €/mês (Basic) |
| Manutenção com conteúdos | — | 150–400 €/mês | 130–280 €/mês (Business) |
| Gestão completa com SEO | — | 400–750 €/mês | 320–650 €/mês (Pro) |
| Trabalho avulso | 20–60 €/h · 40–80 €/h | — | 50–75 €/h |

O valor/hora interno mínimo passou de 35 € para **45 €/h**: é o piso abaixo do qual um projeto
não paga custos, impostos e tempo não faturável, num mercado onde programadores freelance
cobram 30–80 €/h.

As faixas de mercado e as fontes (com links) estão na página **Referências** da aplicação e em
`src/lib/mercado.ts`. Revê-las anualmente, ou assim que houver 10 projetos fechados com horas
reais medidas — a partir daí os dados próprios valem mais do que qualquer artigo.

## Como o preço é calculado

```
preço técnico = (pacote base + extras)
                × fator de complexidade      média das 7 notas do §6, de ×0,80 a ×1,20
                × (1 + urgência)             0% a +30%
                × (1 + prioritário)          +10% quando ativo
                × (1 + margem de risco)      0% a +20%
                + custos externos            não multiplicados

preço final = preço técnico ± ajuste comercial, arredondado a 10 €
```

Os três escalões (mínimo, recomendado, premium) percorrem a mesma fórmula partindo das três
colunas da tabela de pacotes, e mapeiam diretamente nos níveis Essential, Business e Premium
das propostas (§10). A mensalidade sugerida escolhe o plano do §19 pelo peso do projeto e pela
categoria, posicionando o valor dentro da faixa do plano.

O valor/hora efetivo é mostrado sempre, comparado com o mínimo interno de 45 €/h. Fica
vermelho quando o preço não paga as horas — é o sinal do §29 de que o orçamento precisa de
correção, não de desconto.

Onde afinar: `src/lib/pricing.ts` tem as tabelas de pacotes, extras, planos de manutenção e
todos os fatores no topo do ficheiro. É o único sítio a mexer para recalibrar preços. Cada
pacote traz um campo `mercado` com a faixa observada, que aparece na calculadora — serve para
justificar o valor numa negociação.

## Calculadora em Excel

O repositório mantém também a versão em folha de cálculo, útil para orçamentar fora do CRM
ou para partilhar o raciocínio com terceiros:

```bash
python scripts/gerar_calculadora.py Calculadora_Precos_esDEV.xlsx
python scripts/verificar_calculadora.py   # avalia as fórmulas em 4 cenários
```

O modelo dela é independente — parte de horas por fase e tarifas horárias (55–70 €/h,
alinhadas com o mercado), enquanto o CRM parte de pacotes fechados. Os dois convergem nos
mesmos valores para os casos típicos (um institucional de 5 páginas dá 2.950 € no Excel e
2.600 € no CRM), mas o CRM é a fonte de verdade; o Excel é o instrumento de apoio.

## Estrutura

```
esdev-crm.bat        arranque com um clique no Windows
esdev-crm.sh         arranque em macOS / Linux
src/app/             páginas (App Router, Server Components)
src/components/      calculadora, briefing, quadro de pipeline, gráficos, navegação e UI
src/lib/pricing.ts   motor de preços — tabelas de pacotes, extras e fatores
src/lib/mercado.ts   faixas de mercado e fontes usadas na calibração
src/lib/dominio.ts   pipeline, briefing, checklists e regras do documento
src/lib/db.ts        ligação SQLite local
src/lib/actions.ts   escritas (Server Actions)
db/schema.sql        esquema da base de dados
scripts/             dados de exemplo e gerador da calculadora em Excel
```

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts, next-themes e
o SQLite embutido no Node (`node:sqlite`).

Não há dependências nativas de propósito: o `better-sqlite3` obrigava a compilar com o
Visual Studio e as ferramentas de C++ em Windows, o que tornava a instalação impraticável.
O `node:sqlite` vem com o Node e não compila nada.

## Avisos

Os preços são referências internas calibradas com o mercado, não uma tabela pública, e devem
ser confirmados com os teus custos reais e com o teu enquadramento fiscal (a Segurança Social
representa cerca de 15% da faturação bruta a partir do segundo ano de atividade). O
modelo de contrato e as cláusulas listadas em Referências precisam de revisão jurídica antes
de uso definitivo, e o enquadramento fiscal deve ser validado com contabilista — tal como o
próprio documento indica.
