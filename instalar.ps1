# Instalação do esDEV CRM no Windows.
#
#   powershell -ExecutionPolicy Bypass -File .\instalar.ps1
#
# O que faz, por esta ordem:
#   1. Cria C:\Users\<tu>\Documents\esDEVCRM (ou o -Destino que indicares).
#   2. Copia o projeto para lá, se ainda não estiver.
#   3. Instala dependências e compila.
#   4. Cria atalhos "esDEV CRM" no Ambiente de Trabalho e no menu Iniciar.
#   5. Arranca o CRM.
#
# Exemplos:
#   .\instalar.ps1
#   .\instalar.ps1 -Destino "D:\esDEVCRM"
#   .\instalar.ps1 -NaoArrancar

param(
  [string]$Destino = (Join-Path $env:USERPROFILE "Documents\esDEVCRM"),
  [switch]$NaoArrancar
)

$ErrorActionPreference = "Stop"
$origem = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  esDEV CRM - instalacao" -ForegroundColor Cyan
Write-Host "  Origem:  $origem"
Write-Host "  Destino: $Destino"
Write-Host ""

# --- 1 e 2. Pasta de destino ------------------------------------------------
$mesmaPasta = $false
if (Test-Path $Destino) {
  $a = (Resolve-Path $origem).Path.TrimEnd("\")
  $b = (Resolve-Path $Destino).Path.TrimEnd("\")
  $mesmaPasta = ($a -eq $b)
}

if (-not $mesmaPasta) {
  if (-not (Test-Path $Destino)) {
    New-Item -ItemType Directory -Path $Destino -Force | Out-Null
    Write-Host "  Pasta criada." -ForegroundColor Green
  }

  Write-Host "  A copiar o projeto..." -ForegroundColor Yellow
  # node_modules e .next sao reconstruidos a seguir; copiar isso seria lento e inutil.
  robocopy $origem $Destino /E /XD node_modules .next /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) {
    Write-Host "  Falhou a copia dos ficheiros (robocopy $LASTEXITCODE)." -ForegroundColor Red
    exit 1
  }
  Write-Host "  Projeto copiado para $Destino" -ForegroundColor Green
}

Set-Location $Destino

# --- 3. Dependencias e compilacao -------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host ""
  Write-Host "  Node.js nao encontrado. Instala a versao LTS em https://nodejs.org e repete." -ForegroundColor Red
  exit 1
}
$versao = (node -v).TrimStart("v")
$partes = $versao.Split(".")
$maior = [int]$partes[0]
$menor = [int]$partes[1]
if ($maior -lt 22 -or ($maior -eq 22 -and $menor -lt 13)) {
  Write-Host ""
  Write-Host "  Node.js $versao e demasiado antigo. E necessario 22.13 ou superior" -ForegroundColor Red
  Write-Host "  (o CRM usa o SQLite embutido no Node, que nao existe em versoes anteriores)."
  Write-Host "  Instala a versao LTS:  winget install --id OpenJS.NodeJS.LTS -e" -ForegroundColor Cyan
  exit 1
}
Write-Host "  Node.js $versao" -ForegroundColor Green

Write-Host "  A instalar dependencias (pode levar 1-2 minutos)..." -ForegroundColor Yellow
npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) { Write-Host "  Falhou a instalacao de dependencias." -ForegroundColor Red; exit 1 }

Write-Host "  A compilar..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "  Falhou a compilacao." -ForegroundColor Red; exit 1 }

# --- 4. Atalhos --------------------------------------------------------------
$lancador = Join-Path $Destino "esdev-crm.bat"
$shell = New-Object -ComObject WScript.Shell
$atalhos = @(
  (Join-Path ([Environment]::GetFolderPath("Desktop")) "esDEV CRM.lnk"),
  (Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\esDEV CRM.lnk")
)

foreach ($caminho in $atalhos) {
  $pasta = Split-Path -Parent $caminho
  if (-not (Test-Path $pasta)) { New-Item -ItemType Directory -Path $pasta -Force | Out-Null }
  $atalho = $shell.CreateShortcut($caminho)
  $atalho.TargetPath = $lancador
  $atalho.WorkingDirectory = $Destino
  $atalho.Description = "CRM interno da esDEV"
  $atalho.WindowStyle = 7   # minimizado: a consola nao incomoda
  $atalho.Save()
  Write-Host "  Atalho criado: $caminho" -ForegroundColor Green
}

# --- 5. Avisos e arranque ----------------------------------------------------
$bd = if ($env:ESDEV_DB) { $env:ESDEV_DB } else { Join-Path $Destino "data\esdev.db" }

Write-Host ""
if ($Destino -match "OneDrive|Dropbox|Google Drive") {
  Write-Host "  ATENCAO: esta pasta esta sincronizada com a nuvem." -ForegroundColor Yellow
  Write-Host "  A base de dados e escrita continuamente e a sincronizacao pode corrompe-la."
  Write-Host "  Manda apenas os dados para fora da nuvem, uma vez:" -ForegroundColor Cyan
  Write-Host '    [Environment]::SetEnvironmentVariable("ESDEV_DB", "C:\esDEV\data\esdev.db", "User")'
  Write-Host "  Depois fecha e reabre o PowerShell."
  Write-Host ""
}

Write-Host "  Base de dados: $bd"
Write-Host "  Copia este ficheiro para teres backup de tudo: leads, propostas, projetos e faturas."
Write-Host ""
Write-Host "  Instalacao concluida." -ForegroundColor Cyan
Write-Host "  Abre o CRM pelo atalho 'esDEV CRM' no Ambiente de Trabalho."
Write-Host ""

if (-not $NaoArrancar) {
  Write-Host "  A arrancar..." -ForegroundColor Yellow
  Start-Process -FilePath $lancador -WorkingDirectory $Destino
}
