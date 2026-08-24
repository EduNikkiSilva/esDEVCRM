#!/usr/bin/env bash
# esDEV CRM — arranque com um comando em macOS ou Linux.
#
# Instala dependências na primeira vez, compila se necessário, arranca o
# servidor local e abre a aplicação no browser.
#
# A base de dados fica em ./data/esdev.db. Define ESDEV_DB para a guardar
# noutro sítio (por exemplo numa pasta sincronizada).

set -euo pipefail
cd "$(dirname "$0")"

PORTA=43127
URL="http://localhost:${PORTA}"
# O SQLite embutido no Node ainda é marcado como experimental; o aviso não interessa aqui.
export NODE_OPTIONS="--disable-warning=ExperimentalWarning"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instala a versão LTS em https://nodejs.org"
  exit 1
fi

[ -d node_modules ] || { echo "Primeira utilização: a instalar dependências…"; npm install; }
[ -f .next/BUILD_ID ] || { echo "A compilar a aplicação…"; npm run build; }

echo "esDEV CRM a arrancar em ${URL} — Ctrl+C para desligar."
npm start &
SERVIDOR=$!
trap 'kill "$SERVIDOR" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  sleep 1
  if curl -sf -o /dev/null "$URL"; then break; fi
done

if command -v open >/dev/null 2>&1; then
  open -a "Google Chrome" --args --app="$URL" 2>/dev/null || open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || true
fi

wait "$SERVIDOR"
