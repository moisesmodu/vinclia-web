#!/usr/bin/env bash
# Publica un .rbxl en un place de Roblox con la API Open Cloud (sin Roblox Studio).
#
#   ROBLOX_API_KEY=... bash scripts/publish.sh build.rbxl <universeId> <placeId>
#
# Endpoint: POST https://apis.roblox.com/universes/v1/{universeId}/places/{placeId}/versions?versionType=Published
# Si falta la clave o algún ID, avisa y sale con 0 (la CI no falla mientras Moisés no haya creado la experiencia).
set -euo pipefail

FILE="${1:-build.rbxl}"
UNIVERSE_ID="${2:-}"
PLACE_ID="${3:-}"

if [ -z "${ROBLOX_API_KEY:-}" ] || [ -z "$UNIVERSE_ID" ] || [ -z "$PLACE_ID" ]; then
  echo "::notice::Publicación omitida: falta ROBLOX_API_KEY, el universeId o el placeId (ver DESPLIEGUE.md)."
  exit 0
fi
if ! [[ "$UNIVERSE_ID" =~ ^[0-9]+$ && "$PLACE_ID" =~ ^[0-9]+$ ]]; then
  echo "::error::universeId y placeId deben ser números (universe='$UNIVERSE_ID', place='$PLACE_ID')."
  exit 1
fi
if [ ! -s "$FILE" ]; then
  echo "::error::No existe $FILE o está vacío."
  exit 1
fi

URL="https://apis.roblox.com/universes/v1/${UNIVERSE_ID}/places/${PLACE_ID}/versions?versionType=Published"
OUT="publish-response.json"

for attempt in 1 2 3 4; do
  status=$(curl -sS -o "$OUT" -w '%{http_code}' -X POST "$URL" \
    -H "x-api-key: ${ROBLOX_API_KEY}" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@${FILE}") || status="000"
  if [ "$status" = "200" ]; then
    echo "Publicado en el place ${PLACE_ID}: $(cat "$OUT")"
    exit 0
  fi
  echo "Intento ${attempt}: HTTP ${status} $(cat "$OUT" 2>/dev/null || true)"
  case "$status" in
    429|500|502|503|504|000) sleep $((attempt * 15)) ;;
    401|403) echo "::error::La clave no tiene permiso (universe-places:write) sobre este universo o su IP no está permitida."; exit 1 ;;
    *) exit 1 ;;
  esac
done
echo "::error::No se pudo publicar tras 4 intentos."
exit 1
