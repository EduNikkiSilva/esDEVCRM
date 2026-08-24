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
npm run teste-precos              # motor de preços, sem servidor
```

A base de dados é criada automaticamente no primeiro arranque. Para a guardar noutro sítio
(uma pasta sincronizada, por exemplo), define `ESDEV_DB`:

```bash
# Windows PowerShell — permanente para o teu utilizador
[Environment]::SetEnvironmentVariable("ESDEV_DB", "C:\esDEV\data\esdev.db", "User")
```

**Cópia de segurança:** em **Definições → Exportar tudo (JSON)** (tabelas + logótipos +
documentos), ou copia `data/esdev.db`. É o sistema todo.

## O que está lá dentro

| Página | O que faz |
|---|---|
| **Dashboard** | Bloco *Hoje* com as ações do dia e as atrasadas, propostas em aberto, faturas vencidas, projetos em risco, próximas renovações, KPIs comerciais (ticket médio, conversão, aceitação) e financeiros (recebido, em falta, MRR, ARR, receita do mês). |
| **Pipeline** | Quadro com as 12 fases do §24 e, em cada cartão, a próxima ação. Sem follow-up marcado, o cartão avisa e permite criar um ali mesmo. Filtros *Sem follow-up* e *Follow-ups atrasados*. |
| **Lead** | Seis separadores: dados (com responsável e motivo de perda), timeline de atividades, briefing do §5, análise interna + calculadora, propostas e conversão em projeto. |
| **Calculadora** | Pacote base (§8) + extras (§9) + complexidade (§6) + urgência + risco + custos externos → mínimo, recomendado, premium e mensalidade sugerida. |
| **Propostas** | Numeração `PAAAA-NNN`, ciclo completo (rascunho, enviada, visualizada, negociação, aceite, recusada, expirada), datas de envio, resposta e expiração, e taxa de aceitação sobre propostas decididas. |
| **Cliente 360** | Separadores Resumo, Atividade, Projetos, Financeiro, Manutenção e Documentos: faturado, recebido, em falta, vencido, MRR/ARR, contactos da empresa, propostas, serviços recorrentes e contratos. |
| **Projetos** | Fase de desenvolvimento (§16), horas estimadas vs reais, €/h efetivo, checklist de entrega (§17), tarefas, faturas com prazo e timeline de atividades. |
| **Faturação** | Marcos de pagamento, trabalho adicional e custos de terceiros, com data de vencimento. Uma fatura pendente fora de prazo aparece como *Vencida*. |
| **Manutenção** | Planos de manutenção e serviços recorrentes (domínio, alojamento, email, SEO, suporte) com custo, preço, margem, ciclo e renovação; MRR, ARR e alertas de renovação. |
| **Referências** | As tabelas do documento sempre à mão: preços, mercado, extras, planos, processo, contrato, checklists. |

Transversal à app:

- **Tema claro e escuro**, com opção "sistema", no fundo da barra lateral.
- **Paleta de comandos** com `Ctrl+K`: salta para qualquer página, lead, cliente ou projeto.
- **Pipeline com arrastar-e-largar**: mover um cartão entre colunas muda a fase da lead e
  grava logo na base de dados.
- **Atividades como espinha dorsal**: cada contacto, chamada, reunião ou follow-up fica na
  timeline da lead, do cliente e do projeto. As pendentes alimentam o bloco *Hoje*.
- **Responsivo**: em telemóvel a barra lateral vira painel deslizante, útil para consultar uma
  lead numa reunião.

### O fluxo pensado para o dia a dia

0. Abrir o **Dashboard**: o bloco *Hoje* diz o que há para fazer e o que ficou atrasado.
1. Entra um contacto → **Nova lead** (fase *Novo Lead*), já com a data do primeiro contacto.
2. Reunião → registar a atividade na **timeline** e preencher o **briefing** do lead.
3. **Análise & preço**: mexer nos pacotes, extras e nas notas de 1 a 5. Guardar fixa os três
   escalões na lead e atualiza o valor estimado.
4. **Propostas**: criar Essential, Business ou Premium a partir da análise, com âmbito,
   exclusões e rondas de alterações. Marcar como *Enviada* move a lead no pipeline.
5. Proposta aceite → é criado um **contrato** em estado *Pendente* e a lead pode ser
   **convertida em projeto**: cria o cliente, o projeto, as faturas do plano de pagamento
   escolhido (50/50 ou 40/30/30) e o plano de manutenção.
6. Durante o projeto: registar horas reais, avançar a fase, marcar faturas pagas e fechar a
   checklist de entrega.
7. Entregue → o plano de manutenção e os serviços recorrentes passam a contar no MRR, com
   renovações a avisar no dashboard.

## Acesso online e autenticação

O CRM corre num endereço público protegido por **login com a conta Google**, restrito aos
endereços de `EMAILS_PERMITIDOS` (por omissão `geral@esdev.pt`). Não há utilizadores nem
passwords para memorizar, e a sessão dura 30 dias por dispositivo.

Um URL secreto **não** é proteção: o `proxy.ts` fecha a aplicação inteira antes de qualquer
página ser servida. Quem não tem sessão vê o ecrã de entrada e mais nada — nem os nomes dos
módulos.

```
GOOGLE_CLIENT_ID=...           # Google Cloud → Credenciais → ID de cliente OAuth (Web)
GOOGLE_CLIENT_SECRET=...
SESSAO_SECRET=...              # node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
EMAILS_PERMITIDOS=geral@esdev.pt
```

Enquanto estas variáveis não existirem, a aplicação fica aberta — é o modo local — e a barra
lateral mostra um aviso a dizer que não deve ser publicada assim.

### O que está ativo

| Medida | Detalhe |
|---|---|
| Entrada | Conta Google, restrita a `EMAILS_PERMITIDOS` |
| Inatividade | Sessão fecha após 30 minutos sem uso (`MINUTOS_INATIVIDADE`) |
| Duração máxima | 30 dias, mesmo com uso contínuo |
| Renovação | Deslizante: cada utilização adia o fim por inatividade |
| Cookie | Assinado com HMAC-SHA256, `httpOnly`, `secure`, `sameSite=lax` |
| HTTPS | Obrigatório, com HSTS de dois anos |
| Motores de busca | `robots.txt` e `X-Robots-Tag: noindex` |
| Incorporação | Bloqueada (`X-Frame-Options` e `frame-ancestors 'none'`) |
| Formulários | `form-action` limitado ao próprio site e ao Google |
| Permissões do browser | Câmara, microfone e localização negados |
| Registo de acessos | Entradas, saídas e tentativas recusadas, com IP, visíveis em Definições |

O registo de acessos responde a uma pergunta que de outra forma não tem resposta: alguém
tentou entrar na área reservada? Uma tentativa recusada aparece a vermelho, com o email que a
fez e o endereço de onde veio.

Para verificar a proteção: `npm run teste-autenticacao`. Arranca o servidor com credenciais de
teste e confirma que todas as páginas ficam fechadas sem sessão, que um cookie assinado com
outro segredo é recusado, que um cookie expirado é recusado e que a assinatura é verificada.

### Endereço próprio

O CRM é publicado como projeto próprio na Vercel, em `https://crm.esdev.pt` (ou no endereço
`*.vercel.app` atribuído automaticamente). O guia passo a passo está em
**[PUBLICAR.md](PUBLICAR.md)**.

Se algum dia quiseres servi-lo debaixo de um caminho do site principal — `www.esdev.pt/dev` —
o suporte está feito: compila-se com `ESDEV_BASE_PATH=/dev` e o projeto do site reescreve
`/dev/:caminho*` para o projeto do CRM. Não é o caminho recomendado, porque obriga a
republicar o site a cada alteração do CRM.

## Base de dados: local ou alojada

A camada de dados tem dois motores, escolhidos por uma variável de ambiente:

| `DATABASE_URL` | Motor | Onde faz sentido |
|---|---|---|
| ausente | SQLite embutido no Node, ficheiro `data/esdev.db` | uso local, sem internet |
| definido | PostgreSQL | produção na Vercel (Neon) |

O SQL é escrito uma única vez: os marcadores são sempre `?` (o adaptador de Postgres traduz
para `$1, $2, …`), os INSERT recebem `RETURNING id` automaticamente, e as poucas expressões
que divergem entre motores estão isoladas em `AGORA`, `HOJE`, `mesDe` e `semAcento` em
`src/lib/db.ts`. As datas são guardadas como texto ISO nos dois motores, para o comportamento
ser idêntico.

Ambos os caminhos são testados: as verificações de interface correm contra SQLite e contra um
PostgreSQL real.

```bash
# local (SQLite)
npm run dados-exemplo && npm run build && npm start

# contra Postgres
DATABASE_URL="postgresql://utilizador:senha@servidor/base" npm run dados-exemplo
DATABASE_URL="postgresql://utilizador:senha@servidor/base" npm start
```

## Como trabalhamos (regras de colaboração)

Trabalho diretamente na `main` e só faço push depois de o build, o lint e as duas baterias de
testes passarem. A Vercel republica sozinha a cada push.

O teu papel é revisão e travão de emergência, não integração:

```powershell
cd "$env:USERPROFILE\Documents\esDEVCRM"
git pull                 # trazer o que eu fiz
```

Se alguma alteração te desagradar, o histórico é linear e cada alteração é um commit só:

```powershell
git log --oneline -5     # ver os últimos
git revert <hash>        # desfazer um deles
git push                 # e a Vercel volta ao estado anterior
```

Na Vercel tens outra rede de segurança, ainda mais rápida: **Deployments** → nos três pontos de
uma publicação anterior → **Promote to Production**. Reverte em segundos, sem tocar no código.

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
| Estrutura da base de dados | `db/schema.sql` e `db/schema.postgres.sql` |
| Colunas novas em tabelas antigas | `db/alteracoes.sql` |

### Duas coisas a ter em conta

**Os teus dados nunca são afetados.** A pasta `data/` está fora do Git, por isso um `git pull`
ou um `git checkout` nunca mexe em leads, propostas ou faturas.

**Colunas novas na base de dados precisam de migração.** O esquema é criado com
`CREATE TABLE IF NOT EXISTS`, o que significa que tabelas novas aparecem sozinhas, mas uma
coluna nova numa tabela que já existe **não**. Para isso existe o `db/alteracoes.sql`: cada
`ALTER TABLE … ADD COLUMN` e `CREATE INDEX` é executado uma instrução por vez no arranque, nos
dois motores, e os erros de "já existe" são ignorados. Uma coluna nova tem de ser acrescentada
em **três** sítios: nos dois schemas (para bases novas) e no `alteracoes.sql` (para as antigas).

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

## Preços — calibração para freelancer (agosto de 2026)

A esDEV é uma marca pessoal, não uma empresa com equipa. As tabelas estão calibradas para
**freelancer típico em Portugal**: meio da faixa (Zaask / PME), sem valores de agência.

| Serviço | Freelancer (mercado) | Agência (mercado) | esDEV |
|---|---|---|---|
| Landing page | 300–1.000 € | 500–2.000 € | 350–750 € |
| Site institucional (5–10 páginas) | 1.000–5.000 € | 2.000–10.000 € | 1.200–2.100 € |
| Site médio (10–15 páginas) | 3.500–7.000 € | 3.000–6.000 € | 2.000–3.800 € |
| E-commerce | 2.000–8.000 € | 3.000–15.000 € | 1.500–5.800 € |
| E-commerce à medida / ERP | — | 10.000–50.000 € | 5.500–10.000 € |
| Webapp / plataforma | 8.000–30.000 € | 15.000–80.000 € | 5.000–11.000 € |
| CRM PME pequena | — | 3.000–8.000 € | 2.800–5.000 € |
| CRM PME média | — | 8.000–25.000 € | 5.000–9.500 € |
| Manutenção técnica | — | 40–150 €/mês | 29–59 €/mês (Basic) |
| Manutenção com conteúdos | — | 150–400 €/mês | 79–149 €/mês (Business) |
| Gestão completa com SEO | — | 400–750 €/mês | 179–349 €/mês (Pro) |
| Trabalho avulso | 20–60 €/h · 40–80 €/h | — | 30–50 €/h |

**Valor/hora com dois limites**, em vez de um só: **piso de 32 €/h**, abaixo do qual o projeto
não paga IRS, Segurança Social, contabilidade, ferramentas e o tempo não faturável de
prospeção; e **alvo de 45 €/h**, onde um orçamento bem feito deve aterrar. A calculadora
mostra vermelho abaixo do piso, amarelo entre piso e alvo, verde no alvo.

**Capacidade de entrega é um limite real.** Trabalhando sozinho, os pacotes no topo da tabela
(CRM Advanced, e-commerce à medida) ocupam meses inteiros e concentram todo o risco numa
pessoa. O CRM Advanced está marcado como exigindo parceria ou subcontratação — não é preço,
é honestidade sobre o que uma pessoa entrega.

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

O valor/hora efetivo é mostrado sempre, comparado com o piso de 32 €/h e o alvo de 45 €/h.
Fica vermelho quando o preço não paga as horas — é o sinal de que o orçamento precisa de
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

O modelo dela é independente — parte de horas por fase e tarifas horárias (30–50 €/h),
enquanto o CRM parte de pacotes fechados. Serve de contraprova: um institucional de 5 páginas
dá ~2.000 € pelas horas no Excel contra 1.600 € pelo pacote no CRM, o que significa que esse
pacote está no limite inferior e não deve ser descontado. O CRM é a fonte de verdade.

## Estrutura

```
esdev-crm.bat        arranque com um clique no Windows
esdev-crm.sh         arranque em macOS / Linux
src/app/             páginas (App Router, Server Components)
src/components/      calculadora, briefing, quadro de pipeline, gráficos, navegação e UI
src/lib/pricing.ts   motor de preços — tabelas de pacotes, extras e fatores
src/lib/mercado.ts   faixas de mercado e fontes usadas na calibração
src/lib/dominio.ts   pipeline, atividades, propostas, recorrência, checklists e regras
src/lib/datas.ts     aritmética de datas ISO, ciclos de renovação e MRR mensalizado
src/lib/db.ts        ligação SQLite local ou PostgreSQL, e aplicação do esquema
src/lib/queries.ts   leituras: timeline, Cliente 360, KPIs, vencimentos e recorrência
src/lib/actions.ts   escritas (Server Actions)
db/schema.sql        esquema da base de dados (SQLite)
db/alteracoes.sql    colunas e índices acrescentados a bases já existentes
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
