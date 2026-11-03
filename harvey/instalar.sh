#!/usr/bin/env bash
# Copia la configuración de la cartera en una instalación de Harvey (https://github.com/ethanplusai/harvey).
# Uso: bash harvey/instalar.sh <placa|ccse|lunilla> <carpeta donde está clonado harvey>
set -euo pipefail
INST="${1:-}"; DEST="${2:-}"
[ -z "$INST" ] || [ -z "$DEST" ] && { echo "Uso: bash harvey/instalar.sh <placa|ccse|lunilla> <carpeta de harvey>"; exit 2; }
AQUI="$(cd "$(dirname "$0")" && pwd)"
[ -d "$AQUI/instancias/$INST" ] || { echo "Instancia desconocida: $INST"; exit 2; }
[ -f "$DEST/pyproject.toml" ] || { echo "En $DEST no hay un clon de Harvey (falta pyproject.toml). Clónalo: git clone https://github.com/ethanplusai/harvey.git $DEST"; exit 2; }
cp "$AQUI/instancias/$INST/harvey.local.yaml" "$DEST/harvey.local.yaml"
cp "$AQUI/instancias/$INST/skills/"*.md "$DEST/skills/"
cp "$AQUI/skills/email_rules.md" "$DEST/skills/email_rules.md"
[ -f "$DEST/.env" ] || cp "$AQUI/.env.plantilla" "$DEST/.env"
if [ ! -d "$DEST/.venv" ]; then
  PY=$(command -v python3.13 || command -v python3)
  (cd "$DEST" && "$PY" -m venv .venv && . .venv/bin/activate && pip install -q -e .)
fi
echo "Instancia $INST copiada en $DEST."
echo "Siguiente: edita $DEST/.env (buzón y verificador), pon compliance.postal_address y persona.email en $DEST/harvey.local.yaml,"
echo "y ejecuta: cd $DEST && source .venv/bin/activate && harvey status --check && harvey signals --confirm free"
