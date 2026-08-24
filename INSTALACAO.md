# Instalar o esDEV CRM no teu computador

Guia para Windows (que é o teu caso). No fim há uma nota para macOS e Linux.

O CRM corre **inteiramente no teu computador**. Não há servidor na internet, não há
subscrição, não há conta. É um programa que arranca, abre numa janela e guarda tudo num
ficheiro teu.

---

## 1. Onde guardar a pasta

Destino escolhido:

```
C:\Users\eduar\Documents\esDEVCRM
```

O nome da pasta é livre: nada no código depende dele.

**Verifica primeiro se os teus Documentos estão no OneDrive.** No PowerShell:

```powershell
[Environment]::GetFolderPath("MyDocuments")
```

Se a resposta incluir `OneDrive` (por exemplo `C:\Users\eduar\OneDrive\Documentos`), a
pasta é sincronizada. A aplicação funciona lá, mas a base de dados SQLite é escrita
continuamente enquanto trabalhas e a sincronização pode bloqueá-la ou corrompê-la a meio de
uma escrita. Nesse caso mantém o projeto em Documentos e põe só os **dados** fora da nuvem,
uma vez:

```powershell
[Environment]::SetEnvironmentVariable("ESDEV_DB", "C:\esDEV\data\esdev.db", "User")
```

Fecha e reabre o PowerShell depois disto. O `instalar.ps1` deteta e avisa-te se a pasta
estiver sincronizada.

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
git clone <url-do-repositorio> "$env:USERPROFILE\Documents\esDEVCRM"
cd "$env:USERPROFILE\Documents\esDEVCRM"
```

Sem Git: descarrega o repositório como ZIP e extrai para
`C:\Users\eduar\Documents\esDEVCRM`.

Se já tiveres a pasta noutro sítio, move-a e muda-lhe o nome de uma vez:

```powershell
Move-Item "C:\esDEV\crm" "$env:USERPROFILE\Documents\esDEVCRM"
```

## 4. Instalar e arrancar

Corre uma vez, a partir de onde tiveres os ficheiros (a pasta do ZIP extraído serve):

```powershell
powershell -ExecutionPolicy Bypass -File .\instalar.ps1
```

O script faz tudo: cria `C:\Users\eduar\Documents\esDEVCRM`, copia o projeto para lá,
instala as dependências, compila, cria os atalhos **esDEV CRM** no Ambiente de Trabalho e no
menu Iniciar, e arranca o CRM. Se preferires outro destino:

```powershell
.\instalar.ps1 -Destino "D:\esDEVCRM"
```

A partir daí é sempre pelo atalho **esDEV CRM** (ou duplo clique em `esdev-crm.bat` dentro da
pasta). Se o CRM já estiver a correr, o lançador reaproveita o servidor em vez de abrir um
segundo.

Na primeira vez ele instala as dependências e compila a aplicação (1 a 3 minutos, com
mensagens no ecrã). Nas vezes seguintes arranca em poucos segundos. Depois:

- Abre o CRM numa **janela própria**, sem barra de endereço, como uma app normal (usa o
  Chrome ou o Edge que já tens instalado).
- Fica uma janela de consola minimizada chamada **esDEV CRM (servidor)**. É o motor. Fecha
  essa janela quando quiseres desligar o CRM.

### Afixar na barra de tarefas

O `instalar.ps1` já cria os atalhos. Para os afixar: botão direito no atalho **esDEV CRM** →
**Afixar em Iniciar**, ou arrasta-o para a barra de tarefas. Para mudar o ícone: botão
direito → **Propriedades** → **Mudar ícone**.

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
C:\Users\eduar\Documents\esDEVCRM\data\esdev.db
```

**Cópia de segurança:** copia esse ficheiro. É o sistema todo. Duas formas:

- Manual, antes de mexidas grandes: copia `data\esdev.db` para onde guardas backups.
- Automática, uma vez por dia: cria um ficheiro `backup.bat` com a linha abaixo e agenda-o
  no Agendador de Tarefas do Windows.

```bat
copy /Y "%USERPROFILE%\Documents\esDEVCRM\data\esdev.db" "C:\Users\eduar\OneDrive\Backups\esdev-%date:~-4%%date:~3,2%%date:~0,2%.db"
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
cd "$env:USERPROFILE\Documents\esDEVCRM"
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

Guarda a pasta em `~/Documents/esDEVCRM` e faz backup de `~/Documents/esDEVCRM/data/esdev.db`
da mesma forma.
