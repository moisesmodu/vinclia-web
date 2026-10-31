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

## Variables nuevas tras la auditoría de seguridad (30/10/2026)
| Variable | Obligatoria | Para qué |
|---|---|---|
| `AUTH_SECRET` | **Sí, en producción** (32+ caracteres aleatorios: `openssl rand -hex 32`). La app lanza un error al arrancar si falta. | Firma de la cookie de sesión, de la cookie anónima `aprova_anon`, de los enlaces de recuperación y de baja de alertas. Cambiarla cierra todas las sesiones. |
| `VALIDESA_CODIS` | No (sin ella se aceptan `V01`–`V20`) | Lista separada por comas de los códigos de candidato válidos en `/api/validesa` (una por tanda). |
| `CRON_SECRET` | Correos de la prueba de 7 días | Vercel la envía como `Authorization: Bearer` al cron diario `/api/cron/prova` (vercel.json). Creada desde la sesión. |
| `VALIDESA_CLAU` | Para la prueba de validez | Clave que el profesor escribe en el formulario para enviar sus notas; también autoriza `DELETE /api/validesa` (borrado de textos). Sin ella no se aceptan notas de profesor. |
| `LEGAL_NIF` | **Antes de `STRIPE_MODO=real`** | NIF del titular en aviso legal y privacidad; si falta se muestra «(pendent)», que incumple el art. 10 LSSI mientras se cobre. |
| `PAGO_DEMO_PERMES` | No (solo pruebas) | En producción, `PAGO_DEMO=1` solo activa el modo demo (premium sin cobrar) si además `PAGO_DEMO_PERMES=1`. Fuera de producción el modo demo sigue activo sin claves de Stripe. |

Esquema de base de datos: la auditoría añadió las tablas `Limit` (límite de peticiones compartido entre instancias) y `Pagament` (idempotencia de
Checkout y del webhook) y los campos `Usuari.sessioVersio`, `Us.diagnostics`, `Us.correccionsSim` y `Validesa.esborrarEl`. El build de Vercel
ejecuta `prisma db push` (`scripts/db-preparar.mjs`) y los crea solos; no hay que hacer nada a mano. Al desplegar, las sesiones abiertas caducan
(el token de sesión cambia de formato): los usuarios vuelven a entrar una vez.

Webhook de Stripe: además de `checkout.session.completed` y `customer.subscription.*`, suscribir `charge.refunded` y `charge.dispute.created`
(revocan el premium). Enlace de baja de alertas: `enllacBaixa(urlBase(), email)` de `lib/auth.ts` → `/api/alerta/baixa?e=…&t=…`; la tarea
semanal debe incluirlo en cada correo de alerta.

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

**Aviso:** un despliegue lanzado por error desde `proyectos/m-catala` (en vez de la raíz) creó un segundo proyecto de Vercel llamado `m-catala` (https://m-catala.vercel.app), sin base de datos ni variables. No se usa: Moisés puede borrarlo en vercel.com → m-catala → Settings → Delete (la sesión no tuvo permiso para borrarlo). El bueno es `aprova-catala`.

Ejecutado el 2026-10-28

## SEO y medición (31/10/2026, sesión de marketing)

- Dominio: sigue en `aprova-catala.vercel.app`; `aprova.cat` pendiente de compra (MARCAS.md). Cuando exista: `NEXT_PUBLIC_URL`
  al dominio y redespliegue; el `.vercel.app` no se redirige mientras el webhook de Stripe apunte a él.
- Search Console: con la propiedad de tipo Dominio basta el TXT en los DNS; si se verifica por etiqueta, variable
  `GOOGLE_SITE_VERIFICATION=<token>` en Vercel y redespliegue (el layout la emite solo si existe).
- Vercel Web Analytics está activado en el proyecto y el código carga `@vercel/analytics` (sin cookies): visitas por
  `utm_campaign` en Vercel → Analytics tras el redespliegue.
- Contenido nuevo: guía `suspes-c1-catala-que-fer` (ca/es), título del diagnóstico con «test de nivell gratis» y enlace a
  los tests de Plaça (`utm_source=aprova`) al final de las guías de Mossos, TCAI, Generalitat y Bombers. Requiere
  `npm run compilar` (lo hace el build).


### Redespliegue SEO (sesión del Mac, 31-10-2026, 05:15)
Publicado el commit 3301ad8 en https://aprova-catala.vercel.app (proyecto `aprova-catala`, desde la raíz del repo): `/ca/guia/suspes-c1-catala-que-fer` responde. `@vercel/analytics` va en el código. Pendiente (Moisés): el dominio aprova.cat y Search Console.

Ejecutado el 2026-10-31
