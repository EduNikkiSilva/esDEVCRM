# Instalação do esDEV CRM no Windows.
#
#   Executar dentro da pasta do projeto:
#       powershell -ExecutionPolicy Bypass -File .\instalar.ps1
#
# Instala dependências, compila a aplicação e cria atalhos "esDEV CRM" no
# Ambiente de Trabalho e no menu Iniciar. Avisa se a pasta estiver sincronizada
# com o OneDrive, porque a base de dados não deve viver numa pasta sincronizada.

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $raiz

Write-Host ""
Write-Host "  esDEV CRM — instalação" -ForegroundColor Cyan
Write-Host "  Pasta: $raiz"
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "  Node.js não encontrado. Instala a versão LTS em https://nodejs.org e repete." -ForegroundColor Red
  exit 1
}
Write-Host "  Node.js $(node -v)" -ForegroundColor Green

Write-Host "  A instalar dependências..." -ForegroundColor Yellow
npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) { Write-Host "  Falhou a instalação de dependências." -ForegroundColor Red; exit 1 }

Write-Host "  A compilar..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "  Falhou a compilação." -ForegroundColor Red; exit 1 }

# --- Atalhos ---------------------------------------------------------------
$lancador = Join-Path $raiz "esdev-crm.bat"
$shell = New-Object -ComObject WScript.Shell
$destinos = @(
  (Join-Path ([Environment]::GetFolderPath("Desktop")) "esDEV CRM.lnk"),
  (Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\esDEV CRM.lnk")
)

foreach ($destino in $destinos) {
  $pasta = Split-Path -Parent $destino
  if (-not (Test-Path $pasta)) { New-Item -ItemType Directory -Path $pasta -Force | Out-Null }
  $atalho = $shell.CreateShortcut($destino)
  $atalho.TargetPath = $lancador
  $atalho.WorkingDirectory = $raiz
  $atalho.Description = "CRM interno da esDEV"
  $atalho.WindowStyle = 7   # minimizado: a consola não incomoda
  $atalho.Save()
  Write-Host "  Atalho criado: $destino" -ForegroundColor Green
}

# --- Avisos ----------------------------------------------------------------
Write-Host ""
if ($raiz -match "OneDrive|Dropbox|Google Drive") {
  Write-Host "  ATENÇÃO: esta pasta parece estar sincronizada com a nuvem." -ForegroundColor Yellow
  Write-Host "  A base de dados é escrita continuamente e a sincronização pode corrompê-la."
  Write-Host "  Recomendação: guarda os dados fora da pasta sincronizada, definindo ESDEV_DB."
  Write-Host "  Exemplo (uma vez, permanente para o teu utilizador):" -ForegroundColor Cyan
  Write-Host '    [Environment]::SetEnvironmentVariable("ESDEV_DB", "C:\esDEV\data\esdev.db", "User")'
  Write-Host ""
}

$bd = if ($env:ESDEV_DB) { $env:ESDEV_DB } else { Join-Path $raiz "data\esdev.db" }
Write-Host "  Base de dados: $bd"
Write-Host "  Faz cópia deste ficheiro para teres backup de tudo."
Write-Host ""
Write-Host "  Pronto. Abre o CRM pelo atalho 'esDEV CRM' ou com .\esdev-crm.bat" -ForegroundColor Cyan
Write-Host ""
