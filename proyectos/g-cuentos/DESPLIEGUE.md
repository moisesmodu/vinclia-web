# Despliegue de G · Lunilla (para la sesión del Mac)

Resultado de `node scripts/comprobar-entorno.mjs` en la sesión de construcción (28/10/2026): **red bloqueada**
(api.stripe.com, api.vercel.com, console.neon.tech, api.resend.com) y **ningún secreto** en el entorno. Por eso no se
desplegó desde la nube. Esta es la receta exacta, según `DESPLIEGUES.md` §3. Todo se ejecuta desde la raíz del repo,
en la rama `claude/g-cuentos` (PR #5), salvo que se diga otra cosa.

## Datos

| Concepto | Valor |
|---|---|
| Proyecto de Vercel | `lunilla` (equipo `$VERCEL_TEAM_ID`), Root Directory `proyectos/g-cuentos`, framework Next.js |
| Proyecto de Neon | `cartera-g-cuentos`, región `aws-eu-west-2` (nombre y región de `DESPLIEGUES.md` §3) |
| Productos de Stripe (cuenta Numi Mates) | `Cartera · Cuentos · PDF 7,90 €` y `Cartera · Cuentos · Tapa dura 36,90 €` (lo crea el script) |
| Webhook de Stripe | `https://<url>/api/stripe/webhook`, eventos `checkout.session.completed` y `checkout.session.async_payment_succeeded` |
| Imprenta | Gelato, producto fotolibro tapa dura 200 × 200 mm (8 × 8"), 30 páginas interiores, un único PDF (cubierta + guarda + interior + blanca), sangrado 3 mm (`src/config/paises/es-ES.json`) |
| Cron | `vercel.json`: `/api/cron/procesar` cada 5 minutos (necesita plan Pro) |

Nota de precio: la estrategia nombra la tapa dura a 34,90 €. Se ha subido a 36,90 € con envío incluido porque, con la
estimación de Gelato (17,60 € + 6 € de envío), 34,90 € dejaba ≈9,20 € de margen y la regla de la sesión era subir el
precio si bajaba de 9 €. El paso 6 lo confirma con la cotización real; si sale más barato, se vuelve a 34,90 € cambiando
`precios.tapaDura` en `es-ES.json` y repitiendo el paso 5.

## Variables de entorno (production y preview)

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `connection_uri` del proyecto Neon (pooled) |
| `DATABASE_URL_UNPOOLED` | la misma sin `-pooler` |
| `STRIPE_SECRET_KEY` | `$STRIPE_TEST_SECRET_KEY` hasta el lanzamiento; `$STRIPE_SECRET_KEY` (real) al lanzar |
| `STRIPE_WEBHOOK_SECRET` | lo imprime el paso 5 |
| `STRIPE_PRICE_PDF`, `STRIPE_PRICE_TAPA_DURA` | los imprime el paso 5 (hay que repetirlo con la clave real al lanzar) |
| `RESEND_API_KEY` | `$RESEND_API_KEY` |
| `CORREO_REMITENTE` | `Lunilla <noreply@numimates.com>` |
| `CORREO_SOPORTE` | `$LEGAL_EMAIL` |
| `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL`, `LEGAL_ADRECA` | los del entorno |
| `GELATO_API_KEY` | del alta en Gelato (paso 2) |
| `GELATO_MODO` | `borrador` (cambiar a `produccion` solo después del paso 7 correcto) |
| `ANTHROPIC_API_KEY` | opcional; sin ella el texto sale de la plantilla |
| `ADMIN_TOKEN` | `openssl rand -hex 24` (guardarlo también como secreto del entorno de las tareas programadas) |
| `URL_BASE` | la URL de producción, p. ej. `https://lunilla.vercel.app` |
| `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET` | los crea Vercel (pasos 3 y 4) |

## Pasos

```bash
cd proyectos/g-cuentos

# 1. Neon
curl -s -X POST https://console.neon.tech/api/v2/projects \
  -H "Authorization: Bearer $NEON_API_KEY" -H "Content-Type: application/json" \
  -d '{"project":{"name":"cartera-g-cuentos","region_id":"aws-eu-west-2","pg_version":17}}' > /tmp/neon-g.json
jq -r '.connection_uris[0].connection_uri' /tmp/neon-g.json   # → DATABASE_URL_UNPOOLED; con "-pooler" en el host → DATABASE_URL

# 2. Gelato (necesita la sesión del navegador de Moisés: solo «abre esta página»)
#    https://dashboard.gelato.com/signup → cuenta de empresa a nombre de LEGAL_NOM → Developer → API keys → Create.
#    Sin tarjeta: los pedidos de prueba son borradores y no se cobran. Guardar como GELATO_API_KEY (también como
#    secreto del entorno en la nube, DESPLIEGUES.md §1).

# 3. Vercel: proyecto, Blob y variables
vercel project add lunilla --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
vercel link --yes --project lunilla --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
#    Root Directory = proyectos/g-cuentos (Settings → General, o al hacer link desde esta carpeta)
vercel blob store add lunilla-archivos --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID   # y conectarlo al proyecto
for v in DATABASE_URL DATABASE_URL_UNPOOLED RESEND_API_KEY CORREO_REMITENTE CORREO_SOPORTE LEGAL_NOM LEGAL_NIF \
         LEGAL_EMAIL LEGAL_ADRECA GELATO_API_KEY GELATO_MODO ADMIN_TOKEN URL_BASE; do
  printf '%s' "${!v}" | vercel env add $v production --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
  printf '%s' "${!v}" | vercel env add $v preview --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
done
printf '%s' "$STRIPE_TEST_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY production --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID

# 4. Primer despliegue (el build aplica el esquema con prisma db push)
vercel deploy --prod --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID

# 5. Stripe (modo prueba): productos, precios y webhook; pegar en Vercel lo que imprime y redesplegar
STRIPE_TEST_SECRET_KEY=$STRIPE_TEST_SECRET_KEY URL_BASE=$URL_BASE node scripts/stripe-configurar.mjs
#    → vercel env add STRIPE_PRICE_PDF / STRIPE_PRICE_TAPA_DURA / STRIPE_WEBHOOK_SECRET (production) y
vercel deploy --prod --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID

# 6. Precio real de impresión y envío (ajusta es-ES.json si el margen baja de 9 €)
GELATO_API_KEY=$GELATO_API_KEY npm run cotizar

# 7. Prueba de punta a punta en producción: pago con tarjeta 4242 en Stripe Checkout (Playwright) y pedido a Gelato en
#    borrador. Hace de taller con las ilustraciones de las muestras.
URL_BASE=$URL_BASE ADMIN_TOKEN=$ADMIN_TOKEN npm run prueba:e2e
#    Comprobar en https://dashboard.gelato.com que aparece el pedido en borrador con cubierta e interior correctos
#    (tipos de archivo, sangrado de 4 mm, lomo). Si Gelato pide otros tipos de archivo, cambiar GELATO_TIPOS_ARCHIVO.

# 8. Comprobación tras desplegar
curl -s -o /dev/null -w "%{http_code}\n" $URL_BASE/                      # 200
curl -s -o /dev/null -w "%{http_code}\n" $URL_BASE/ca/muestras/la-martina-i-els-secrets-de-lleida   # 200
curl -s -H "x-admin-token: $ADMIN_TOKEN" $URL_BASE/api/admin/resumen     # JSON con ventas e incidencias
#    /admin?t=$ADMIN_TOKEN debe mostrar: stripe «prueba», imprenta «borrador», correo «Resend», almacén «Vercel Blob».

# 9. Anotar la URL en panel/data/proyectos.json (ficha g-cuentos: enlaces.demo; estado «lanzado» solo tras el paso 7)
#    y añadir al final de este archivo la línea «Ejecutado el <fecha>».
```

## Al lanzar (cambio a cobros reales)

1. `STRIPE_KEY=$STRIPE_SECRET_KEY URL_BASE=$URL_BASE node scripts/stripe-configurar.mjs` y sustituir en Vercel
   `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*` y `STRIPE_WEBHOOK_SECRET` por los del modo real.
2. `GELATO_MODO=produccion` y añadir un medio de pago en Gelato (lo hace Moisés en su panel: es su tarjeta).
3. Crear las tres tareas programadas de `TAREA-PROGRAMADA.md` con `URL_BASE` y `ADMIN_TOKEN` en su entorno.

---

## Cómo se ejecutó (sesión del Mac, 28-10-2026)
- Vercel: proyecto `lunilla` creado con el CLI ya autenticado en el Mac (sin `VERCEL_TOKEN`), Root Directory
  `proyectos/g-cuentos`. El equipo ya es Pro, así que el cron de 5 minutos funciona. URL: https://lunilla.vercel.app
- Neon: recurso `cartera-g-cuentos` (región `lhr1`, Londres, plan gratis) creado con la integración de Neon del equipo
  de Vercel (sin `NEON_API_KEY`). El build sincronizó el esquema (`prisma db push`).
- Blob: almacén público `lunilla-archivos` en `cdg1` (París) conectado al proyecto; `BLOB_READ_WRITE_TOKEN` lo pone Vercel.
- Stripe: recurso `numi-mates` de la integración de Stripe del equipo conectado al proyecto. Pone `STRIPE_SECRET_KEY`
  (`sk_test_`) del «Entorno de prueba de Numi Mates» (`acct_1UKvWA9ds25vHCsF`, sandbox). `scripts/stripe-configurar.mjs`
  creó ahí los dos productos, sus precios y el webhook; `STRIPE_PRICE_PDF`, `STRIPE_PRICE_TAPA_DURA` y
  `STRIPE_WEBHOOK_SECRET` están en Vercel.
- `ADMIN_TOKEN` está como variable **no sensible**, para que se pueda leer en Vercel y copiar a las tareas programadas.
  El resto de variables que se añaden con el CLI quedan como sensibles (no se pueden volver a leer).
- Next.js subido de 15.5.6 a 15.5.28: Vercel bloquea el despliegue de 15.5.6 por el CVE-2025-66478.
- Comprobado en producción: `/` y `/ca/muestras/la-martina-i-els-secrets-de-lleida` dan 200; `/api/admin/resumen` da el
  JSON; `/admin` muestra stripe «prueba», imprenta «simulado», texto «plantilla (sin IA)» y almacén «Vercel Blob»;
  `/api/cron/procesar` responde.
- Faltan (Moisés): alta en Gelato y `GELATO_API_KEY` (pasos 2, 6 y 7); `LEGAL_*`, `CORREO_SOPORTE` y `RESEND_API_KEY`
  en Vercel → lunilla → Settings → Environment Variables; y el pago de prueba con la tarjeta 4242.

Ejecutado el 2026-10-28

## Pendiente tras el despliegue (sesión de construcción, 28-10-2026, 02:45)

- **Redesplegar** desde la rama `claude/g-cuentos` (commit `29ba301` o posterior): lleva la identidad de marca (colores,
  Baloo 2 + Nunito, logotipo, sello, pantalla de precio, Lunilla con bufanda en portadas y frase final para decir juntos).
  Producción todavía sirve la versión anterior (título «Lunilla · Cuentos personalizados con nombre»).
  `vercel deploy --prod` desde `proyectos/g-cuentos`. Comprobar que el `<title>` dice «Un cuento donde el protagonista eres tú».
- Si no está ya: conectar el repositorio en Vercel (Settings → Git) con *Production Branch* = la rama base, para que
  los siguientes cambios se publiquen solos al fusionar.
- `LEGAL_*`, `CORREO_SOPORTE` y `RESEND_API_KEY` ya existen como secretos del entorno: copiarlos a Vercel (no es tarea de Moisés).
- Pago de prueba con la tarjeta 4242: `URL_BASE=https://lunilla.vercel.app ADMIN_TOKEN=… npm run prueba:e2e` (usa Playwright
  en Stripe Checkout; si los selectores de Stripe han cambiado, hacerlo a mano una vez y anotarlo aquí).

### Redespliegue (sesión del Mac, 28-10-2026, 04:09)
Publicados la identidad de marca y la portada nueva (commit 6b3d3e0) en https://lunilla.vercel.app; el título es «Lunilla · Un cuento donde el protagonista eres tú». `LEGAL_*`, `CORREO_SOPORTE` (= `LEGAL_EMAIL`) y `RESEND_API_KEY` copiados en Vercel desde el proyecto ccse-en-tu-idioma; remitente `Lunilla <noreply@numimates.com>`. No se ha conectado el repositorio a Vercel: con commits de «Claude», Vercel bloquearía los despliegues automáticos. Pendiente: alta en Gelato y `GELATO_API_KEY` (Moisés) y el pago de prueba con la tarjeta 4242.

Ejecutado el 2026-10-28

### Pendiente: redesplegar libros de 18/22 páginas (b61da1b, 28-10-2026)
Libros de 18 y 22 páginas por edad, creador con avatar, texto editable antes de pagar y portada con «Para cada edad» y
«Tú decides». Sin cambios en el esquema de Prisma (los campos nuevos van dentro de `datos`, que es JSON) ni variables
nuevas: basta con `vercel --prod` desde `proyectos/g-cuentos`. Comprobación: `/crear` muestra los 4 pasos y
`/muestras/leo-y-la-luz-de-la-luna` tiene 18 páginas.

### Redespliegue (sesión del Mac, 28-10-2026, 04:49)
`LEGAL_EMAIL` y `CORREO_SOPORTE` = `hola@numimates.com` (DESPLIEGUES.md §6) y redesplegado (commit 30ad8b8): el aviso legal y la portada ya no muestran el correo personal. Esta rama aún no lleva el commit del correo de la base (e5a9cea); cuando lo fusione, conviene redesplegar.

Ejecutado el 2026-10-28

### Formato de imprenta de Gelato (31-10-2026) — comprobar con la clave
El libro impreso es el fotolibro de tapa dura de **20 × 20 cm (8 × 8")** con **30 páginas interiores** (Gelato admite
30–200 y el precio base incluye 30; antes eran 28 y lo habría rechazado). Se envía **un único PDF** (`type: "default"`):
pliego de cubierta · guarda en blanco · 30 páginas de 206 × 206 mm (200 + 3 mm de sangrado) · página final en blanco.
Al dar de alta `GELATO_API_KEY`, antes del primer pedido real:
1. `GELATO_API_KEY=… npm run cotizar`: debe dar precio para `pageCount: 30` y mostrar «Cubierta (fuente): gelato».
   Si dice «reserva (respuesta inesperada)», ajustar `leerDimensiones()` en `src/lib/imprenta/gelato.ts` con la
   respuesta que imprime (hoy se leen `wraparoundEdgeSize`, `contentBackSize`, `jointBackSize`, `spineSize`,
   `jointFrontSize`, `contentFrontSize`).
2. Un pedido en borrador (`GELATO_MODO=borrador`) y mirar la vista previa en el panel de Gelato: cubierta centrada,
   título dentro del cartón, 30 páginas en orden. Si su equipo pide cubierta e interior por separado, poner
   `GELATO_ARCHIVOS=separados` (manda `cover` + `content`).
