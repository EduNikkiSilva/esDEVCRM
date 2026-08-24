# Instalar o esDEV CRM no teu computador

Guia para Windows (que é o teu caso). No fim há uma nota para macOS e Linux.

O CRM corre **inteiramente no teu computador**. Não há servidor na internet, não há
subscrição, não há conta. É um programa que arranca, abre numa janela e guarda tudo num
ficheiro teu.

---

## 1. Onde guardar a pasta

Guarda o projeto numa pasta curta, tua, e **fora de pastas sincronizadas**:

```
C:\esDEV\crm
```

Porque não em OneDrive, Google Drive ou Dropbox: a base de dados SQLite é escrita
continuamente enquanto trabalhas, e os clientes de sincronização podem bloquear ou
corromper o ficheiro a meio de uma escrita. A pasta de trabalho fica no disco local; a
cópia de segurança é que vai para a nuvem (ponto 5).

Evita também o Ambiente de Trabalho e a pasta Documentos se estiverem sincronizados com o
OneDrive — em muitos PCs Windows estão, por omissão.

## 2. Instalar o Node.js (uma vez, ~2 minutos)

O CRM precisa do Node.js para correr. Vai a [nodejs.org](https://nodejs.org), descarrega a
versão **LTS** para Windows e instala com as opções por omissão.

Para confirmar, abre o **PowerShell** e escreve:

```powershell
node -v
```

Deve responder algo como `v22.14.0`. Se responder erro, reinicia o PowerShell.

## 3. Trazer o projeto para o teu PC

Com Git instalado (recomendado, porque permite receber atualizações depois):

```powershell
mkdir C:\esDEV
cd C:\esDEV
git clone <url-do-repositorio> crm
cd crm
```

Sem Git: descarrega o repositório como ZIP e extrai para `C:\esDEV\crm`.

## 4. Arrancar

Abre a pasta `C:\esDEV\crm` no Explorador e faz **duplo clique em `esdev-crm.bat`**.

Na primeira vez ele instala as dependências e compila a aplicação (1 a 3 minutos, com
mensagens no ecrã). Nas vezes seguintes arranca em poucos segundos. Depois:

- Abre o CRM numa **janela própria**, sem barra de endereço, como uma app normal (usa o
  Chrome ou o Edge que já tens instalado).
- Fica uma janela de consola minimizada chamada **esDEV CRM (servidor)**. É o motor. Fecha
  essa janela quando quiseres desligar o CRM.

### Pôr no menu Iniciar e na barra de tarefas

1. Clica com o botão direito em `esdev-crm.bat` → **Mostrar mais opções** → **Enviar para**
   → **Ambiente de trabalho (criar atalho)**.
2. No atalho criado, botão direito → **Propriedades** → **Mudar ícone** e escolhe um ícone
   à tua escolha. Muda também o nome para `esDEV CRM`.
3. Botão direito no atalho → **Afixar em Iniciar** (e, se quiseres, arrasta-o para a barra
   de tarefas).

Se preferires que arranque sozinho quando ligas o PC: pressiona `Win + R`, escreve
`shell:startup`, e copia o atalho para essa pasta.

### Se quiseres que abra sempre no Chrome como app "instalada"

Com o CRM a correr, abre `http://localhost:43127` no Chrome → menu de três pontos →
**Transmitir, guardar e partilhar** → **Instalar página como aplicação**. Fica com ícone
próprio, janela própria e entrada no menu Iniciar.

## 5. Onde ficam os teus dados (e como não os perder)

Tudo — leads, briefings, análises, propostas, projetos, faturas, contratos — vive num único
ficheiro:

```
C:\esDEV\crm\data\esdev.db
```

**Cópia de segurança:** copia esse ficheiro. É o sistema todo. Duas formas:

- Manual, antes de mexidas grandes: copia `data\esdev.db` para onde guardas backups.
- Automática, uma vez por dia: cria um ficheiro `backup.bat` com a linha abaixo e agenda-o
  no Agendador de Tarefas do Windows.

```bat
copy /Y "C:\esDEV\crm\data\esdev.db" "C:\Users\eduar\OneDrive\Backups\esdev-%date:~-4%%date:~3,2%%date:~0,2%.db"
```

Isto guarda uma cópia datada na nuvem sem a base de dados de trabalho estar dentro do
OneDrive — que é exatamente o que queremos.

**Guardar a base de dados noutro sítio:** define `ESDEV_DB` antes de arrancar. Por exemplo,
num disco externo:

```powershell
$env:ESDEV_DB="D:\esdev\esdev.db"; npm start
```

## 6. Trabalhar em mais do que um dispositivo

O CRM serve na porta 43127 do teu PC. Se quiseres abri-lo no telemóvel ou no portátil
enquanto o PC principal está ligado, na mesma rede Wi-Fi:

1. Descobre o IP do PC: `ipconfig` no PowerShell (procura *Endereço IPv4*, algo como
   `192.168.1.50`).
2. No telemóvel, abre `http://192.168.1.50:43127`.
3. Na primeira vez o Windows pergunta se permites o acesso à rede privada — aceita.

A interface é responsiva, funciona bem em telemóvel. Não abras isto para a internet sem
autenticação: qualquer pessoa com o endereço veria os teus dados.

## 7. Receber atualizações

Se clonaste com Git:

```powershell
cd C:\esDEV\crm
git pull
npm install
npm run build
```

A base de dados não é tocada por atualizações — o esquema é criado com `CREATE TABLE IF NOT
EXISTS`, portanto os teus dados mantêm-se.

## 8. Problemas comuns

| Sintoma | O que fazer |
|---|---|
| `node` não é reconhecido | O Node não está instalado ou o PowerShell não foi reiniciado depois da instalação. |
| A janela abre e fecha logo | Corre `esdev-crm.bat` a partir do PowerShell (`.\esdev-crm.bat`) para ler a mensagem de erro. |
| "Porta 43127 já em uso" | Já tens o CRM a correr. Procura a janela "esDEV CRM (servidor)" ou termina o processo `node` no Gestor de Tarefas. |
| O browser diz que não consegue ligar | O servidor ainda está a arrancar. Espera 10 segundos e recarrega. |
| Quero começar do zero | Fecha o CRM, apaga a pasta `data`, arranca outra vez. Cria uma base de dados vazia. |
| Quero os exemplos outra vez | `npm run dados-exemplo -- --forcar` (apaga o que existe e insere os exemplos). |

---

## macOS e Linux

```bash
chmod +x esdev-crm.sh
./esdev-crm.sh
```

Guarda a pasta em `~/esdev/crm` e faz backup de `~/esdev/crm/data/esdev.db` da mesma forma.
