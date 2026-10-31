# Despliegue · N Nuevo en España

> Para la sesión que tenga los secretos del entorno (`DESPLIEGUES.md` §1): la sesión del Mac de Moisés o cualquier
> sesión en la nube con `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `NEON_API_KEY`, `STRIPE_TEST_SECRET_KEY`, `RESEND_API_KEY`
> y `LEGAL_*`. Se ejecuta tal cual, en orden, desde la raíz del repositorio en la rama
> `claude/estrategia-ingresos-recurrentes-tx0rvw` (una vez fusionado el PR #3). No hay que pedirle nada a Moisés.

## Qué se crea

| Pieza | Valor |
|---|---|
| Proyecto de Vercel | `nuevo-en-espana` (si el nombre está cogido: `cartera-nuevo-en-espana`) en el equipo `$VERCEL_TEAM_ID` |
| Root Directory | `proyectos/n-nuevo-en-espana` · framework Next.js · build `npm run build` (ya en `vercel.json`) |
| Cron | `/api/cron/recordatorios` cada día a las 08:00 UTC (ya en `vercel.json`) |
| Proyecto de Neon | `cartera-n-nuevo-en-espana`, región `aws-eu-west-2`, Postgres 16 |
| Stripe (cuenta Numi Mates, **modo prueba** hasta lanzar) | Producto `Cartera · Nuevo en España · Mensual 4,99 €` con precio 4,99 € mensual · Producto `Cartera · Nuevo en España · Pack 19,90 €` con precio 19,90 € pago único · ambos `metadata.proyecto=n-nuevo-en-espana`, IVA incluido |
| Webhook de Stripe | `https://<dominio>/api/stripe/webhook` con `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `customer.subscription.deleted`, `charge.refunded` |
| Remitente de correo | `Nuevo en España <noreply@numimates.com>` (Resend, dominio numimates.com verificado) |

## Variables de entorno en Vercel (production y preview)

| Variable | Valor u origen |
|---|---|
| `NEXT_PUBLIC_URL` | **`https://tuspapeles.app`** (dominio propio desde el 31/10/2026; es lo que sale en canonical, hreflang, sitemap y robots) |
| `GOOGLE_SITE_VERIFICATION` | opcional: el valor `google-site-verification=…` de Search Console si se verifica por meta; la alternativa es un registro TXT en los DNS de Vercel del dominio |
| `DATABASE_URL` | Neon, cadena **con pooling** (host `ep-…-pooler…`) |
| `DATABASE_URL_UNPOOLED` | Neon, cadena directa |
| `STRIPE_SECRET_KEY` | `$STRIPE_TEST_SECRET_KEY` mientras se prueba; `$STRIPE_SECRET_KEY` al lanzar |
| `STRIPE_WEBHOOK_SECRET` | lo imprime `scripts/stripe-configurar.mjs` |
| `STRIPE_PRICE_MENSUAL`, `STRIPE_PRICE_PACK` | los imprime `scripts/stripe-configurar.mjs` |
| `RESEND_API_KEY` | `$RESEND_API_KEY` |
| `CORREO_REMITENTE` | `Nuevo en España <noreply@numimates.com>` |
| `SECRETO_SESION` | `openssl rand -base64 32` |
| `CRON_SECRET` | `openssl rand -hex 24` |
| `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL`, `LEGAL_ADRECA` | los del entorno (salen en aviso legal y condiciones) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | vacío por ahora |

## Comandos, en orden

```bash
set -euo pipefail
cd proyectos/n-nuevo-en-espana
npm ci
V="--token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID"
DOMINIO=https://nuevo-en-espana.vercel.app

# 1. Neon: proyecto y cadenas de conexión
RESP=$(curl -sS -X POST https://console.neon.tech/api/v2/projects \
  -H "Authorization: Bearer $NEON_API_KEY" -H "Content-Type: application/json" \
  -d '{"project":{"name":"cartera-n-nuevo-en-espana","region_id":"aws-eu-west-2","pg_version":16}}')
DIRECTA=$(echo "$RESP" | python3 -c 'import json,sys;print(json.load(sys.stdin)["connection_uris"][0]["connection_uri"])')
POOL=$(echo "$DIRECTA" | python3 -c 'import sys,re;print(re.sub(r"@(ep-[^.]+)\.",r"@\1-pooler.",sys.stdin.read().strip(),1))')
# Si el proyecto ya existía: GET /api/v2/projects?search=cartera-n-nuevo-en-espana y
# GET /api/v2/projects/<id>/connection_uri?database_name=neondb&role_name=neondb_owner[&pooled=true]

# 2. Tablas
DATABASE_URL="$DIRECTA" DATABASE_URL_UNPOOLED="$DIRECTA" npx prisma migrate deploy

# 3. Stripe (modo prueba): productos, precios y webhook. Idempotente.
STRIPE_SECRET_KEY="$STRIPE_TEST_SECRET_KEY" node scripts/stripe-configurar.mjs "$DOMINIO" | tee /tmp/stripe-n.txt
# Guarda STRIPE_WEBHOOK_SECRET: Stripe solo lo enseña al crear el webhook.

# 4. Vercel: proyecto, Root Directory y variables
npx vercel@latest project add nuevo-en-espana $V
PID=$(curl -sS "https://api.vercel.com/v9/projects/nuevo-en-espana?teamId=$VERCEL_TEAM_ID" -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')
curl -sS -X PATCH "https://api.vercel.com/v9/projects/$PID?teamId=$VERCEL_TEAM_ID" -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" -d '{"rootDirectory":"proyectos/n-nuevo-en-espana","framework":"nextjs"}'
cd ../..   # el enlace se hace desde la raíz del repositorio para que respete el Root Directory
npx vercel@latest link --yes --project nuevo-en-espana $V
pon() { for e in production preview; do printf '%s' "$2" | npx vercel@latest env add "$1" $e $V --force >/dev/null; done; }
pon NEXT_PUBLIC_URL "$DOMINIO"
pon DATABASE_URL "$POOL"
pon DATABASE_URL_UNPOOLED "$DIRECTA"
pon STRIPE_SECRET_KEY "$STRIPE_TEST_SECRET_KEY"
pon STRIPE_PRICE_MENSUAL "$(grep ^STRIPE_PRICE_MENSUAL /tmp/stripe-n.txt | cut -d= -f2)"
pon STRIPE_PRICE_PACK "$(grep ^STRIPE_PRICE_PACK /tmp/stripe-n.txt | cut -d= -f2)"
pon STRIPE_WEBHOOK_SECRET "$(grep ^STRIPE_WEBHOOK_SECRET /tmp/stripe-n.txt | cut -d= -f2)"
pon RESEND_API_KEY "$RESEND_API_KEY"
pon CORREO_REMITENTE "Nuevo en España <noreply@numimates.com>"
pon SECRETO_SESION "$(openssl rand -base64 32)"
pon CRON_SECRET "$(openssl rand -hex 24)"
pon LEGAL_NOM "$LEGAL_NOM"; pon LEGAL_NIF "$LEGAL_NIF"; pon LEGAL_EMAIL "$LEGAL_EMAIL"; pon LEGAL_ADRECA "$LEGAL_ADRECA"

# 5. Desplegar
npx vercel@latest deploy --prod --yes $V
```

Si Vercel asigna otra URL (nombre cogido), repite con ese dominio los pasos 3 (el webhook va a la URL nueva) y la
variable `NEXT_PUBLIC_URL`, y vuelve a desplegar.

## Comprobación en producción (modo prueba)

1. `https://<dominio>/` redirige a `/es`; `/ar` se ve de derecha a izquierda; `/es/guias/empadronamiento` completa.
2. `/es/guias/renovacion-residencia` muestra el resumen y el candado.
3. `/es/precios` → marcar las dos casillas → Suscripción → pagar con la tarjeta de prueba `4242 4242 4242 4242`,
   fecha futura, CVC 123 → vuelve a `/es/gracias` con «Ya tienes acceso» → la guía de renovación se ve completa.
4. En Stripe (modo prueba) → Webhooks → el evento `checkout.session.completed` aparece con respuesta 200.
5. Activar un recordatorio en una guía con tu correo → llega el correo de confirmación desde noreply@numimates.com.
6. `curl -H "Authorization: Bearer <CRON_SECRET>" https://<dominio>/api/cron/recordatorios` → `{"revisados":…,"enviados":…}`.
7. «Mi cuenta» → «Cancelar la suscripción» → 200.
8. `/es/legal/aviso-legal` muestra el NIF y el correo de `LEGAL_*`.

Después: anotar la URL en `panel/data/proyectos.json` (ficha `n-nuevo-en-espana`, `enlaces.demo`, estado `lanzado` solo
cuando el paso 3 haya funcionado) y hacer push a la rama base.

## Al lanzar con cobros reales
Repetir el paso 3 con `STRIPE_SECRET_KEY` (modo real) y cambiar en Vercel `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*` y
`STRIPE_WEBHOOK_SECRET` por los de modo real; volver a desplegar.

## Cómo se ejecutó (sesión del Mac, 28-10-2026)
- Vercel: proyecto `nuevo-en-espana` creado con el CLI ya autenticado en el Mac (sin `VERCEL_TOKEN`), Root Directory
  `proyectos/n-nuevo-en-espana`. URL de producción: https://nuevo-en-espana.vercel.app
- Neon: recurso `cartera-n-nuevo-en-espana` (región `lhr1`, Londres, plan gratis) creado con la integración de Neon del
  equipo de Vercel (sin `NEON_API_KEY`); `DATABASE_URL` y `DATABASE_URL_UNPOOLED` las pone la integración. Migración
  `0001_inicial` aplicada.
- Stripe: recurso `numi-mates` de la integración de Stripe del equipo conectado al proyecto. Pone `STRIPE_SECRET_KEY`
  del «Entorno de prueba de Numi Mates» (`acct_1UKvWA9ds25vHCsF`, sandbox). `scripts/stripe-configurar.mjs` creó
  productos, precios y webhook ahí; `STRIPE_PRICE_*` y `STRIPE_WEBHOOK_SECRET` están en Vercel.
- Next.js subido de 15.5.6 a 15.5.28: Vercel bloquea el despliegue de 15.5.6 por el CVE-2025-66478.
- Faltan (los pone Moisés en Vercel → nuevo-en-espana → Settings → Environment Variables): `LEGAL_NOM`, `LEGAL_NIF`,
  `LEGAL_EMAIL`, `LEGAL_ADRECA` y `RESEND_API_KEY`. Falta también el pago de prueba con la tarjeta 4242 en producción.

Ejecutado el 2026-10-28

Completado el 28/10/2026 desde la sesión del Mac: `LEGAL_*`, `RESEND_API_KEY` y `CORREO_REMITENTE` (noreply@numimates.com, sin Algorithmics) en production y preview; redesplegado en https://nuevo-en-espana.vercel.app (aviso legal con NIF comprobado). Pendiente: pago de prueba con la tarjeta 4242.

## Estado tras la sesión de N (28/10/2026, noche)
- **Identidad de marca aplicada en el código** (commit `54351fe` y siguientes, PR #3), **sin publicar todavía**: el
  despliegue a producción desde la sesión en la nube lo bloqueó el control de permisos. Para publicarla, desde la raíz
  de una copia limpia de la rama (`git archive HEAD | tar -x -C <dir>`):
  `npx vercel@latest link --yes --project nuevo-en-espana` y `npx vercel@latest deploy --prod --yes` (con
  `--token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID` si no hay sesión del CLI). No hace falta tocar variables ni Stripe.
- **Comprobado en producción** (versión anterior a la marca): portada y guías en 7 idiomas, sitemap y manifiesto 200;
  guía de pago sin sesión 401; webhook sin firma 400; cron sin secreto 401; `/api/checkout` devuelve una sesión
  `cs_test_` de Stripe para la suscripción y para el pack; aviso legal con los datos de `LEGAL_*`.
- **Pendiente:** completar el pago con la tarjeta 4242. La red de la sesión en la nube no deja abrir
  `checkout.stripe.com` (solo `api.stripe.com`); hacerlo desde el navegador del Mac o añadir ese dominio a la red del entorno.

### Redespliegue (sesión del Mac, 28-10-2026, 04:09)
Publicada la identidad de marca (commit 0938832) en https://nuevo-en-espana.vercel.app. Sin cambios de variables ni de Stripe. Pendiente: pago de prueba con la tarjeta 4242.

Ejecutado el 2026-10-28

### Redespliegue (sesión del Mac, 28-10-2026, 04:49)
Publicado el commit 9c07f95 (monetizar primero y recuperación). `LEGAL_EMAIL=hola@numimates.com` (DESPLIEGUES.md §6): el aviso legal y la portada ya no muestran el correo personal. `/api/checkout` sigue devolviendo sesiones `cs_test_`.

Ejecutado el 2026-10-28

### Dominio propio y SEO (sesión de marketing, 31-10-2026)
- URL pública: **https://tuspapeles.app** (y `www.tuspapeles.app` → apex). `NEXT_PUBLIC_URL` apunta ahí, así que canonical,
  `hreflang`, `sitemap.xml` y `robots.txt` ya salen con el dominio propio.
- `nuevo-en-espana.vercel.app` **se mantiene sin redirección**: el webhook de Stripe está registrado en esa URL y Stripe no
  sigue redirecciones. La etiqueta canonical evita el contenido duplicado. Cuando el webhook se registre en el dominio
  propio, se puede redirigir el `.vercel.app` con un 308 desde la configuración de dominios de Vercel.
- Search Console: propiedad de tipo **Dominio** `tuspapeles.app`. Verificación por TXT en los DNS de Vercel (API de
  dominios, `scripts/search-console-txt.mjs` del repositorio) o por la meta `GOOGLE_SITE_VERIFICATION`. Después, enviar
  `https://tuspapeles.app/sitemap.xml`.
- Analítica: Vercel Web Analytics está activado en el proyecto y el código carga `@vercel/analytics` (sin cookies; recoge
  ruta y `utm_*` de cada pieza de marketing). Plausible sigue siendo opcional.
- Contenido nuevo: pregunta `empadronarse-en-lleida`, variante «En Lleida» en la guía gratis, variante de los 2 años
  ampliada en la guía de nacionalidad con tarjeta «Prepara el CCSE» (enlace medido a ccsefacil.com), y «¿NIE o TIE?» en
  la de renovación (es, en). Redesplegar para publicarlo: desde la raíz del repositorio en esta rama,
  `npx vercel@latest deploy --prod --yes --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID` con el proyecto `nuevo-en-espana`
  enlazado (Root Directory `proyectos/n-nuevo-en-espana`).

### Redespliegue SEO (sesión del Mac, 31-10-2026, 05:15)
Publicado el commit c643540 en https://tuspapeles.app (canónica y sitemap con el dominio). `@vercel/analytics` va en el código. Pendiente (Moisés): verificación de Search Console.

Ejecutado el 2026-10-31
