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
| Imprenta | Gelato, producto fotolibro tapa dura 200 × 200 mm, 28 páginas (`src/config/paises/es-ES.json`) |
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
| `CORREO_REMITENTE` | `Lunilla <noreply@algorithmicslleida.com>` |
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
Ejecutado el: (pendiente; lo rellena la sesión del Mac)
