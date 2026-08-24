@echo off
setlocal enabledelayedexpansion
title esDEV CRM
cd /d "%~dp0"

rem ---------------------------------------------------------------------------
rem  esDEV CRM — arranque com um clique no Windows.
rem
rem  Instala dependencias na primeira vez, compila se necessario, arranca o
rem  servidor local e abre a aplicacao numa janela propria (sem barra de
rem  endereco), como se fosse uma app de desktop.
rem
rem  A base de dados fica em .\data\esdev.db. Para a guardar noutro sitio,
rem  define a variavel ESDEV_DB antes de correr este ficheiro.
rem ---------------------------------------------------------------------------

set PORTA=43127
set URL=http://localhost:%PORTA%

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js nao encontrado.
  echo   Instala a versao LTS em https://nodejs.org e volta a correr este ficheiro.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo.
  echo   Primeira utilizacao: a instalar dependencias. Pode levar 1-2 minutos...
  echo.
  call npm install || goto :erro
)

if not exist ".next\BUILD_ID" (
  echo.
  echo   A compilar a aplicacao...
  echo.
  call npm run build || goto :erro
)

rem Se ja estiver a correr, nao arranca um segundo servidor.
curl -s -o NUL %URL% && (
  echo   esDEV CRM ja estava a correr. A abrir a janela...
  goto :abrir
)

echo.
echo   esDEV CRM a arrancar em %URL%
echo   A janela "esDEV CRM (servidor)" fica minimizada. Fecha-a para desligar.
echo.

start "esDEV CRM (servidor)" /min cmd /c "npm start"

rem Espera que o servidor responda antes de abrir a janela da app.
for /l %%i in (1,1,40) do (
  ping -n 2 127.0.0.1 >nul
  curl -s -o NUL %URL% && goto :abrir
)

:abrir
set NAVEGADOR=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set NAVEGADOR=%ProgramFiles%\Google\Chrome\Application\chrome.exe
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set NAVEGADOR=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set NAVEGADOR=%LocalAppData%\Google\Chrome\Application\chrome.exe
if "!NAVEGADOR!"=="" if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set NAVEGADOR=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe
if "!NAVEGADOR!"=="" if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set NAVEGADOR=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe

if "!NAVEGADOR!"=="" (
  start "" %URL%
) else (
  start "" "!NAVEGADOR!" --app=%URL% --window-size=1440,900
)

echo   Aplicacao aberta. Esta janela pode ficar minimizada.
echo   Para desligar o CRM, fecha a janela "esDEV CRM (servidor)".
echo.
timeout /t 5 >nul
exit /b 0

:erro
echo.
echo   Falhou. Le a mensagem acima e tenta de novo.
echo.
pause
exit /b 1
