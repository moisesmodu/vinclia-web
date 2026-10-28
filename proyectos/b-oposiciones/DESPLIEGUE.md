# Despliegue de B · Plaça (para la sesión del Mac, DESPLIEGUES.md §4)

Al final de la sesión, `node scripts/comprobar-entorno.mjs` dio los 10 secretos presentes, pero `api.stripe.com`,
`api.vercel.com`, `console.neon.tech` y `api.resend.com` seguían bloqueados por la red de esta sesión (ENOTFOUND). Por eso
no se ha desplegado desde aquí y se dejan los pasos exactos. Se ejecutan en orden desde la raíz del repositorio, en la rama `claude/estrategia-ingresos-recurrentes-tx0rvw`
(o en la del PR de B si aún no está fusionado: `claude/proyecto-b-oposiciones`).

## Datos
| Qué | Valor |
|---|---|
| Proyecto de Vercel | `placa-oposicions` (equipo `$VERCEL_TEAM_ID`) |
| Root Directory | `proyectos/b-oposiciones` · Framework: Next.js · Node 22 |
| URL resultante | `https://placa-oposicions.vercel.app` (dominio propio cuando Moisés lo compre) |
| Proyecto de Neon | `cartera-b-oposiciones`, región `aws-eu-west-2` |
| Stripe | cuenta Numi Mates · productos `Cartera · Oposiciones · Mensual / Trimestral / Anual`, `metadata.proyecto=b-oposiciones` · precios 9,99 € al mes, 23,97 € cada 3 meses y 71,88 € al año, IVA incluido · lookup_key `b-oposiciones_es_<plan>_<importe>` |
| Webhook | `https://placa-oposicions.vercel.app/api/stripe/webhook` · eventos `checkout.session.completed`, `customer.subscription.created/updated/deleted/paused/resumed` |
| Correo | Resend, remitente `Plaça <noreply@numimates.com>` (recuperación de contraseña) |

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
| `NEXT_PUBLIC_URL` | `https://placa-oposicions.vercel.app` |

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
vercel project add placa-oposicions --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
vercel link --yes --project placa-oposicions --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
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
  printf 'https://placa-oposicions.vercel.app' | vercel env add NEXT_PUBLIC_URL $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
done

# 4. Stripe (modo prueba): productos, precios y webhook. Guarda la última línea como STRIPE_WEBHOOK_SECRET.
npm install
SECRETO=$(STRIPE_TEST_SECRET_KEY=$STRIPE_TEST_SECRET_KEY node scripts/stripe-preparar.mjs https://placa-oposicions.vercel.app | sed -n 's/^STRIPE_WEBHOOK_SECRET=//p')
for ENTORNO in production preview; do printf '%s' "$SECRETO" | vercel env add STRIPE_WEBHOOK_SECRET $ENTORNO --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID; done

# 5. Desplegar (el build crea las tablas: scripts/db-preparar.mjs hace "prisma db push")
vercel deploy --prod --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID

# 6. Prueba de punta a punta en producción (modo prueba de Stripe: tarjeta 4242 4242 4242 4242)
BASE=https://placa-oposicions.vercel.app OP=mossos-esquadra node scripts/e2e.mjs /tmp/e2e-b
```
El paso 6 completa el pago en Stripe Checkout solo si se hace a mano con la tarjeta de prueba. El script automático
llega hasta la página de Checkout y comprueba el resto del flujo.

## Al lanzar (cobro real)
`STRIPE_MODO=real` en Vercel, repetir el paso 4 con `STRIPE_MODO=real STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY` y redeploy.

## Después
Anotar en `panel/data/proyectos.json` (ficha `b-oposiciones`): `enlaces.demo` = la URL, `estado` = `lanzado`, y push a la
rama base. Crear la tarea programada con el prompt de `TAREA-PROGRAMADA.md`.

## Cómo se ejecutó (sesión del Mac, 28-10-2026)
- Vercel: proyecto `aprova-oposicions` (Node 22) creado con el CLI ya autenticado en el Mac (sin `VERCEL_TOKEN`), Root
  Directory `proyectos/b-oposiciones`. URL de producción: https://aprova-oposicions.vercel.app
- Neon: recurso `cartera-b-oposiciones` (región `lhr1`, Londres, plan gratis) creado con la integración de Neon del equipo
  de Vercel (sin `NEON_API_KEY`); `DATABASE_URL` y `DATABASE_URL_UNPOOLED` las pone la integración. Tablas creadas por el build.
- Stripe: recurso `numi-mates` de la integración de Stripe del equipo conectado al proyecto. Pone `STRIPE_SECRET_KEY` (`sk_test_`)
  del «Entorno de prueba de Numi Mates» (`acct_1UKvWA9ds25vHCsF`, sandbox), que `lib/pagos.ts` acepta con `STRIPE_MODO=prueba`.
  `scripts/stripe-preparar.mjs` creó ahí los tres precios y el webhook; `STRIPE_WEBHOOK_SECRET` está en Vercel.
- Faltan (los pone Moisés en Vercel → aprova-oposicions → Settings → Environment Variables): `LEGAL_NOM`, `LEGAL_NIF`,
  `LEGAL_EMAIL`, `LEGAL_ADRECA` y `RESEND_API_KEY`. Falta también el pago de prueba con la tarjeta 4242 (paso 6) y la
  tarea programada de `TAREA-PROGRAMADA.md`.

Ejecutado el 2026-10-28

## Pendiente tras la marca (para la sesión del Mac)
El despliegue de arriba se hizo antes de aplicar la identidad de marca. La rama ya lleva **Plaça** (MARCAS.md §4); el nombre
«Aprova» pasa al proyecto M. Pasos:
1. Renombrar el proyecto de Vercel `aprova-oposicions` a `placa-oposicions` (Settings → General → Project Name), o crear el
   dominio `placa-oposicions.vercel.app` en Settings → Domains, y poner `NEXT_PUBLIC_URL=https://placa-oposicions.vercel.app`.
2. Volver a registrar el webhook con la URL nueva: `node scripts/stripe-preparar.mjs https://placa-oposicions.vercel.app`
   (sustituye el anterior) y actualizar `STRIPE_WEBHOOK_SECRET`.
3. Poner en Vercel `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL`, `LEGAL_ADRECA` y `RESEND_API_KEY` (ya están como secretos del
   entorno; SESIONES.md regla 3: no se le piden a Moisés). Remitente: `Plaça <noreply@numimates.com>`.
4. Redesplegar (`vercel deploy --prod`) y hacer el pago de prueba con 4242 4242 4242 4242 en `/es/precios`.
5. Anotar la URL definitiva en `panel/data/proyectos.json` (ficha `b-oposiciones`, `enlaces.demo`).
Los precios ya creados en Stripe sirven: el nombre del producto es «Cartera · Oposiciones · <Plan>» y no cambia con la marca.

## Redespliegue con la marca (sesión B, 28-10-2026)
- La red no estaba bloqueada: el proxy de la sesión deja pasar Stripe, Vercel, Neon y Resend. El falso «bloqueado» venía de que
  el `fetch` de Node no usa `HTTPS_PROXY` sin `NODE_USE_ENV_PROXY=1`; `scripts/comprobar-entorno.mjs` ya lo hace solo.
- Vercel: proyecto renombrado a `placa-oposicions`, dominio `placa-oposicions.vercel.app` añadido (el antiguo
  `aprova-oposicions.vercel.app` sigue sirviendo la app, sin redirección, porque el webhook de Stripe apunta a él).
  Variables no secretas puestas: `NEXT_PUBLIC_URL=https://placa-oposicions.vercel.app`, `CORREO_REMITENTE=Plaça <noreply@numimates.com>`,
  `STRIPE_MODO=prueba`. Desplegado con `npx vercel@50.1.6 deploy --prod` desde la raíz (con `.vercelignore`). Build OK, base de
  datos en sync.
- Probado en producción: páginas con la marca, API, test gratis, registro y sesión real de Stripe Checkout (`cs_test_…`).
- **Pendiente (necesita permiso de Moisés para que esta sesión copie secretos a Vercel):** `LEGAL_NOM`, `LEGAL_NIF`,
  `LEGAL_EMAIL`, `LEGAL_ADRECA`, `RESEND_API_KEY`, `STRIPE_TEST_SECRET_KEY` (cuenta Numi Mates en modo prueba,
  `acct_1UKx8H4…`, la que pide DESPLIEGUES.md §2; hoy producción usa el sandbox `acct_1UKvWA9…` de la integración) y
  `STRIPE_LIVE_SECRET_KEY` (para `STRIPE_MODO=real`). Si se cambia a la cuenta Numi Mates: `NODE_USE_ENV_PROXY=1
  STRIPE_TEST_SECRET_KEY=… node scripts/stripe-preparar.mjs https://placa-oposicions.vercel.app` y guardar el
  `STRIPE_WEBHOOK_SECRET` que imprime.
- Pago con la tarjeta 4242: checkout.stripe.com no se abre desde las sesiones en la nube; hay que hacerlo desde un navegador normal.
