# Despliegue de M · Aprova (hecho desde la sesión el 28/10/2026)

`node scripts/comprobar-entorno.mjs` daba los 10 secretos presentes y marcaba la red como bloqueada, pero el proxy de la sesión deja pasar
Stripe, Vercel, Neon y Resend (como anotó la sesión B): con `NODE_USE_ENV_PROXY=1` los scripts de Node salen por `HTTPS_PROXY`. Por eso
**todo el despliegue se hizo desde esta sesión** y no hace falta la sesión del Mac. Queda documentado para repetirlo o cambiarlo.

## Datos
| Qué | Valor |
|---|---|
| Proyecto de Vercel | `aprova-catala` (`prj_VC1sRwYATAuEIzz9lzYTC3RnpCh4`, equipo `$VERCEL_TEAM_ID`), Root Directory `proyectos/m-catala`, framework Next.js, Node 24 |
| URL de producción | **https://aprova-catala.vercel.app** (dominio `aprova.cat` cuando Moisés lo compre) |
| Base de datos | Neon **`cartera-m-catala`** (`store_hS3iwDeMc6HjB5Dj`), región `lhr1` (Londres), plan gratis, creada por la integración de Neon del equipo de Vercel (la organización de Neon la gestiona Vercel y rechaza la API directa: `POST /v1/integrations/billing/authorization` + `POST /v1/storage/stores/integration` + `POST /v1/storage/stores/integration/{store}/connections`) y conectada al proyecto: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_*` las pone la integración. Tablas creadas por el build (`scripts/db-preparar.mjs` → `prisma db push`) |
| Stripe | cuenta **Numi Mates** (`acct_1UKx8H4NbKzEdcfB`), modo prueba · productos `Cartera · Català · Mensual / Anual / Passi de convocatòria` (`metadata.proyecto = m-catala`), precios 9,99 €/mes, 59,99 €/año y 24,99 € único (lookup_key `m-catala_es_<plan>_<importe>`) · webhook `we_1UVOJN4NbKzEdcfBhWTkgqk5` → `https://aprova-catala.vercel.app/api/stripe/webhook` (`checkout.session.completed`, `customer.subscription.*`) |
| Correo | Resend, remitente `Aprova <noreply@numimates.com>`, respuesta `hola@numimates.com` |
| Enlace local | `.vercel/project.json` en la raíz del repositorio (ignorado por git): `{"projectId":"prj_VC1sRwYATAuEIzz9lzYTC3RnpCh4","orgId":"<VERCEL_TEAM_ID>"}` |

## Variables de entorno en Vercel (production y preview), ya puestas
`STRIPE_TEST_SECRET_KEY`, `STRIPE_SECRET_KEY` (real, restringida; no se usa hasta `STRIPE_MODO=real`), `STRIPE_MODO=prueba`, `STRIPE_WEBHOOK_SECRET`,
`RESEND_API_KEY`, `CORREO_REMITENTE`, `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL=hola@numimates.com`, `LEGAL_ADRECA`, `AUTH_SECRET`,
`NEXT_PUBLIC_URL=https://aprova-catala.vercel.app`, `LANGUAGETOOL_URL=https://api.languagetool.org/v2`, `TTS_PROVEIDOR=navegador`, más las de Neon.

**No puestas (faltan como secretos del entorno; se añaden en Vercel → aprova-catala → Environment Variables cuando existan):**
`ANTHROPIC_API_KEY` o `BSC_API_URL`+`BSC_MODEL` (corrección por criterios con modelo de lenguaje; sin ella, criterios por heurística marcados
como orientativos), `GOOGLE_TTS_API_KEY` o `AZURE_TTS_KEY`+`AZURE_TTS_REGION` con `TTS_PROVEIDOR=google|azure` (voz sintetizada; hoy la del
navegador), `WHISPER_URL` (+`WHISPER_API_KEY`) si se despliega el Whisper catalán de AINA (hoy reconocimiento del navegador),
`ELEVENLABS_API_KEY` solo para la demo de la landing.

## Comandos (repetibles)
```bash
# desde la raíz del repositorio, rama con proyectos/m-catala
cd proyectos/m-catala && npm install && npm run check && npm run build      # build limpio en local
NODE_USE_ENV_PROXY=1 node scripts/stripe-preparar.mjs https://aprova-catala.vercel.app   # idempotente; imprime STRIPE_WEBHOOK_SECRET si crea webhook
cd ../.. && npx vercel@50.1.6 deploy --prod --yes --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
BASE=https://aprova-catala.vercel.app node proyectos/m-catala/scripts/e2e.mjs /tmp/e2e-aprova     # prueba móvil contra producción
```

## Al lanzar (cobro real, solo tras la prueba de validez ≥ 80 %)
1. `STRIPE_MODO=real` en Vercel. 2. `NODE_USE_ENV_PROXY=1 STRIPE_MODO=real STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY node scripts/stripe-preparar.mjs https://aprova-catala.vercel.app`
(crea los precios en modo real y el webhook real; guardar el nuevo `STRIPE_WEBHOOK_SECRET`). 3. Redeploy. 4. Pago real reembolsado como prueba.

## Lo que se probó en producción (28/10/2026)
`scripts/e2e.mjs` en Pixel 7 emulado contra https://aprova-catala.vercel.app: redirección por idioma, entrada en 3 pantallas, diagnóstico completo
(12 ítems adaptativos con «Per què?», lectura, texto corregido con LanguageTool público, oral saltado), resultado con probabilidad, Hoy con
compromiso, minisesión, mapa, simulacro de C1 completo (redacción corregida + 45 ítems) con resultado apte/no apte, escribir, oral, convocatorias,
precios, guía SEO, versión en castellano, registro en Neon y sesión real de Stripe Checkout (`cs_test_…`). **Sin probar:** la tarjeta 4242 en
checkout.stripe.com (no se abre desde la sesión), el correo real de recuperación y de alertas (Resend configurado, no disparado), la voz
sintetizada y el Whisper (sin proveedor), y la corrección con modelo de lenguaje (sin clave).

Ejecutado el 2026-10-28
