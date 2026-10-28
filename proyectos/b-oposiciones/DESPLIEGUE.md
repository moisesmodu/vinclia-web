# Despliegue de B · Aprova (para la sesión del Mac, DESPLIEGUES.md §4)

Esta sesión no tenía `VERCEL_TOKEN`, `NEON_API_KEY`, claves de Stripe, `RESEND_API_KEY` ni `LEGAL_*`, así que deja los pasos
exactos. Se ejecutan en orden desde la raíz del repositorio, en la rama `claude/estrategia-ingresos-recurrentes-tx0rvw`
(o en la del PR de B si aún no está fusionado: `claude/proyecto-b-oposiciones`).

## Datos
| Qué | Valor |
|---|---|
| Proyecto de Vercel | `aprova-oposicions` (equipo `$VERCEL_TEAM_ID`) |
| Root Directory | `proyectos/b-oposiciones` · Framework: Next.js · Node 22 |
| URL resultante | `https://aprova-oposicions.vercel.app` (dominio propio cuando Moisés lo compre) |
| Proyecto de Neon | `cartera-b-oposiciones`, región `aws-eu-west-2` |
| Stripe | cuenta Numi Mates · productos `Cartera · Oposiciones · Mensual / Trimestral / Anual`, `metadata.proyecto=b-oposiciones` · precios 9,99 € al mes, 23,97 € cada 3 meses y 71,88 € al año, IVA incluido · lookup_key `b-oposiciones_es_<plan>_<importe>` |
| Webhook | `https://aprova-oposicions.vercel.app/api/stripe/webhook` · eventos `checkout.session.completed`, `customer.subscription.created/updated/deleted/paused/resumed` |
| Correo | Resend, remitente `Aprova <noreply@algorithmicslleida.com>` (recuperación de contraseña) |

## Variables de entorno (production y preview)
| Variable | Valor |
|---|---|
| `DATABASE_URL` | `connection_uri` del proyecto de Neon (con pooler) |
| `DATABASE_URL_UNPOOLED` | la misma sin `-pooler` en el host (la usa Prisma para crear las tablas) |
| `STRIPE_TEST_SECRET_KEY` | `$STRIPE_TEST_SECRET_KEY` (desarrollo y pruebas) |
| `STRIPE_SECRET_KEY` | `$STRIPE_SECRET_KEY` (clave real restringida; necesita además permiso de escritura en **Customer portal** para el botón «Factures i targeta») |
| `STRIPE_MODO` | `prueba` hasta el lanzamiento; `real` para cobrar de verdad |
| `STRIPE_WEBHOOK_SECRET` | la línea que imprime el paso 4 |
| `RESEND_API_KEY` | `$RESEND_API_KEY` |
| `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL`, `LEGAL_ADRECA` | los del entorno |
| `AUTH_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_URL` | `https://aprova-oposicions.vercel.app` |

## Comandos
```bash
cd proyectos/b-oposiciones

# 1. Neon: crear el proyecto y leer la cadena de conexión
curl -s -X POST https://console.neon.tech/api/v2/projects \
  -H "Authorization: Bearer $NEON_API_KEY" -H "Content-Type: application/json" \
  -d '{"project":{"name":"cartera-b-oposiciones","region_id":"aws-eu-west-2","pg_version":17}}' > /tmp/neon-b.json
DB=$(jq -r '.connection_uris[0].connection_uri' /tmp/neon-b.json)
DB_POOL=$(echo "$DB" | sed -E 's/(@ep-[^.]+)/\1-pooler/')

# 2. Vercel: crear y enlazar el proyecto
vercel project add aprova-oposicions --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
vercel link --yes --project aprova-oposicions --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
#    En vercel.com → Project → Settings → General: Root Directory = proyectos/b-oposiciones (si el CLI no lo fija)

# 3. Variables (repetir con "preview")
for ENTORNO in production preview; do
  printf '%s' "$DB_POOL" | vercel env add DATABASE_URL $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
  printf '%s' "$DB"      | vercel env add DATABASE_URL_UNPOOLED $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
  printf '%s' "$STRIPE_TEST_SECRET_KEY" | vercel env add STRIPE_TEST_SECRET_KEY $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
  printf '%s' "$STRIPE_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
  printf 'prueba' | vercel env add STRIPE_MODO $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
  printf '%s' "$RESEND_API_KEY" | vercel env add RESEND_API_KEY $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
  for V in LEGAL_NOM LEGAL_NIF LEGAL_EMAIL LEGAL_ADRECA; do printf '%s' "${!V}" | vercel env add $V $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID; done
  printf '%s' "$(openssl rand -hex 32)" | vercel env add AUTH_SECRET $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
  printf 'https://aprova-oposicions.vercel.app' | vercel env add NEXT_PUBLIC_URL $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
done

# 4. Stripe (modo prueba): productos, precios y webhook. Guarda la última línea como STRIPE_WEBHOOK_SECRET.
npm install
SECRETO=$(STRIPE_TEST_SECRET_KEY=$STRIPE_TEST_SECRET_KEY node scripts/stripe-preparar.mjs https://aprova-oposicions.vercel.app | sed -n 's/^STRIPE_WEBHOOK_SECRET=//p')
for ENTORNO in production preview; do printf '%s' "$SECRETO" | vercel env add STRIPE_WEBHOOK_SECRET $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID; done

# 5. Desplegar (el build crea las tablas: scripts/db-preparar.mjs hace "prisma db push")
vercel deploy --prod --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID

# 6. Prueba de punta a punta en producción (modo prueba de Stripe: tarjeta 4242 4242 4242 4242)
BASE=https://aprova-oposicions.vercel.app OP=mossos-esquadra node scripts/e2e.mjs /tmp/e2e-b
```
El paso 6 completa el pago en Stripe Checkout solo si se hace a mano con la tarjeta de prueba. El script automático
llega hasta la página de Checkout y comprueba el resto del flujo.

## Al lanzar (cobro real)
`STRIPE_MODO=real` en Vercel, repetir el paso 4 con `STRIPE_MODO=real STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY` y redeploy.

## Después
Anotar en `panel/data/proyectos.json` (ficha `b-oposiciones`): `enlaces.demo` = la URL, `estado` = `lanzado`, y push a la
rama base. Crear la tarea programada con el prompt de `TAREA-PROGRAMADA.md`.
