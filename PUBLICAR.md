# Publicar o esDEV CRM na Vercel

Guia do zero até ao CRM acessível de qualquer sítio, em `https://crm.esdev.pt`, protegido por
login com a conta Google `geral@esdev.pt`.

Escolhi o subdomínio `crm.esdev.pt` em vez de um caminho no site principal por três razões:
o endereço é conhecido de antemão (o que simplifica a configuração do Google), o CRM publica-se
sem tocar no site, e uma avaria no CRM não afeta o `www.esdev.pt`. Se preferires o endereço
`esdevcrm.vercel.app` que a Vercel dá por omissão, salta o passo 5 — funciona igual, muda só o
que escreves na barra.

Tempo total: cerca de 20 minutos, quase tudo à espera de cliques.

---

## 1. Criar as credenciais do Google

Isto tem de vir primeiro, porque o resto depende delas.

1. Abre [console.cloud.google.com](https://console.cloud.google.com) com a conta
   `geral@esdev.pt`.
2. No topo, seletor de projeto → **Novo projeto** → nome `esDEV CRM` → **Criar**.
3. Menu ☰ → **APIs e serviços** → **Ecrã de consentimento OAuth**:
   - Tipo de utilizador: **Externo** → **Criar**
   - Nome da app: `esDEV CRM`
   - Email de assistência: `geral@esdev.pt`
   - Dados de contacto do desenvolvedor: `geral@esdev.pt`
   - Guardar e continuar até ao fim (não é preciso pedir verificação)
   - Em **Utilizadores de teste**, **Adicionar** `geral@esdev.pt`
4. **APIs e serviços** → **Credenciais** → **Criar credenciais** → **ID do cliente OAuth**:
   - Tipo de aplicação: **Aplicação Web**
   - Nome: `esDEV CRM`
   - **URIs de redirecionamento autorizados** → **Adicionar URI**:
     `https://crm.esdev.pt/api/auth/callback`
   - (Opcional, para desenvolvimento local: `http://localhost:43127/api/auth/callback`)
   - **Criar**
5. Guarda o **ID do cliente** e o **Segredo do cliente**. Vais colá-los na Vercel no passo 4.

## 2. Criar o projeto na Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → escolhe
   `EduNikkiSilva/esDEVCRM`.
   - Se o repositório não aparecer: **Adjust GitHub App Permissions** e dá-lhe acesso.
2. Não mexas em Framework, Build Command nem Output Directory — o `vercel.json` do
   repositório já traz a configuração certa.
3. **Deploy**. A primeira publicação vai correr; ignora-a por agora, ainda não tem base de
   dados nem login.

## 3. Criar a base de dados

1. No projeto → separador **Storage** → **Create Database** → **Neon** (Postgres) →
   **Continue**.
2. Região: **Europe (Frankfurt)** ou a mais próxima disponível. Plano gratuito serve.
3. **Connect** ao projeto `esDEVCRM`, para os ambientes **Production**, **Preview** e
   **Development**.

Isto cria a variável `DATABASE_URL` sozinha. As tabelas são criadas na primeira ligação — não
há migrações para correr.

## 4. Definir as variáveis de ambiente

Projeto → **Settings** → **Environment Variables**. Acrescenta quatro, todas com o ambiente
**Production** (e Preview, se quiseres):

| Nome | Valor |
|---|---|
| `GOOGLE_CLIENT_ID` | o ID do cliente do passo 1 |
| `GOOGLE_CLIENT_SECRET` | o segredo do cliente do passo 1 |
| `SESSAO_SECRET` | uma cadeia aleatória longa (ver abaixo) |
| `EMAILS_PERMITIDOS` | `geral@esdev.pt` |

Para gerar o `SESSAO_SECRET`, no teu PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Guarda-o em sítio seguro: mudá-lo termina todas as sessões abertas.

## 5. Ligar o subdomínio

1. Projeto → **Settings** → **Domains** → **Add** → `crm.esdev.pt` → **Add**.
2. O DNS do `esdev.pt` já está na Vercel, por isso o registo é criado automaticamente e o
   certificado HTTPS emitido em um ou dois minutos.

## 6. Republicar e entrar

1. Separador **Deployments** → nos três pontos da publicação mais recente →
   **Redeploy** (as variáveis de ambiente só entram numa publicação nova).
2. Abre `https://crm.esdev.pt`. Deves ver o ecrã **Área reservada**.
3. **Entrar com Google** → escolhe `geral@esdev.pt` → entras no dashboard.

Se o Google responder `redirect_uri_mismatch`, o URI do passo 1.4 não está exatamente igual —
tem de ser `https://crm.esdev.pt/api/auth/callback`, com `https` e sem barra no fim.

---

## Depois de estar no ar

**Dados de exemplo.** Se quiseres ver o sistema preenchido antes de meteres clientes reais,
no teu PC, com a `DATABASE_URL` da Neon (copia-a da Vercel em Storage → Neon → `.env.local`):

```powershell
$env:DATABASE_URL="postgresql://..."
npm run dados-exemplo
```

Para limpar tudo outra vez: `npm run limpar-dados -- --sim` com a mesma variável definida.

**Instalar como aplicação.** No Chrome, em `crm.esdev.pt`, menu de três pontos → **Transmitir,
guardar e partilhar** → **Instalar página como aplicação**. Fica com ícone e janela próprios,
no computador e no telemóvel (no Android, *Adicionar ao ecrã principal*).

**Cópias de segurança.** A Neon faz *point-in-time recovery* nos planos pagos; no gratuito, o
histórico é curto. Uma exportação periódica não faz mal:

```powershell
# precisa do pg_dump instalado (vem com o PostgreSQL)
pg_dump "postgresql://..." -f "backup-esdev-$(Get-Date -Format yyyyMMdd).sql"
```

**Alterações ao código.** Cada push para a `main` publica sozinho. As branches abrem
publicações de pré-visualização, com endereços próprios — como o Google só aceita o
redirecionamento de `crm.esdev.pt`, o login não funciona nessas pré-visualizações. É de
propósito: mantém os dados fora de endereços temporários. Para testar uma branch, corre-a
localmente.

**Continuar a usar no PC.** Sem `DATABASE_URL`, o CRM continua a funcionar em modo local com o
ficheiro `data/esdev.db`, e sem pedir login. São duas bases de dados distintas: o que
escreveres localmente não aparece online.

## Segurança, em resumo

- O acesso exige a conta Google `geral@esdev.pt`. O `proxy.ts` fecha a aplicação toda antes de
  qualquer página ser servida.
- A sessão é um cookie assinado com HMAC-SHA256, válido 30 dias, `httpOnly` e `secure`.
- `robots.txt` e o cabeçalho `X-Robots-Tag` mantêm o endereço fora dos motores de busca.
- O `vercel.json` bloqueia a incorporação em iframes e ativa HSTS.
- Nenhum dado de clientes está no Git: a pasta `data/` está ignorada.
- Estás a alojar dados pessoais de terceiros. O RGPD aplica-se — vale a pena o registo de
  tratamento de dados que o §20 do teu documento operacional já prevê.
