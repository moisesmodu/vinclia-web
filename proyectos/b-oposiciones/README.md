# Plaça · tests de oposiciones catalanas (proyecto B)

Plataforma de tests para las oposiciones catalanas que las grandes apps no cubren. Versión 1 con cinco oposiciones:

| Oposición | Convocatoria citada | Formato del simulacro |
|---|---|---|
| Auxiliar administratiu de la Generalitat (C2) | Resolució PRE/212/2026 (convocatòria 870), DOGC 9595, 2/2/2026 | 75 + 7 reserva, 165 min, −1/4 |
| Auxiliar administratiu d'ajuntaments (temari comú) | Ajuntament de Barcelona 128/2026 (OP2026_1040), BOPB / DOGC 9703; RD 896/1991 art. 8 | 40 + 5, 60 min, −1/4 |
| Mossos d'Esquadra, escala bàsica | Resolució ISP/1763/2026 (convocatòria 46/26), DOGC 9681, 8/6/2026 | 30, 35 min, −1/4 |
| Bombers de la Generalitat (bomber/a de primera, C1) | Resolució ISP/3218/2026 (convocatòria 81/26), DOGC 9751, 15/9/2026; temari ISP/2428/2026 | 70 + 7, 80 min, −1/4 |
| TCAI de l'ICS | Resolució SLT/2380/2025 (convocatòria 100-2025), DOGC 9441, 26/6/2025 | 50 + 5, 90 min, −1/4 (provisional) |

Cada pregunta sale del texto legal consolidado, lleva su explicación, el artículo con enlace al BOE y un fragmento literal de
la fuente que una máquina comprueba. Tests por tema, simulacros con el formato de la convocatoria, repaso espaciado FSRS,
falladas, estadísticas por tema, ranking por percentil, historial permanente y exportable, catalán y castellano (con cambio
de idioma en cada pregunta). Gratis: 20 preguntas por oposición, sin registro. Suscripción: 9,99 €/mes (también 7,99 €/mes
en trimestral y 5,99 €/mes en anual) con acceso a **todas** las oposiciones.

## Banco de preguntas v1 (28/10/2026)

| Oposición | Temas | En la app | Cita literal comprobada por máquina | Segunda pasada: ok / corregidas / rechazadas |
|---|---|---|---|---|
| Auxiliar Generalitat | 15 | 359 | 336 | 344 / 15 / 1 |
| Auxiliar ayuntamientos | 24 | 330 | 322 | 314 / 16 / 0 |
| Mossos d'Esquadra | 21 | 346 | 262 | 334 / 12 / 0 |
| Bombers | 34 | 350 | 138 | 345 / 5 / 1 |
| TCAI ICS | 16 | 352 | 272 | 341 / 11 / 0 |
| **Total** | **110** | **1.737** | **1.330** | **1.678 / 59 / 2** |

- Generadas en esta sesión en modo sesión (IA, a partir del texto vigente de cada norma). Revisadas por revisores distintos de los
  autores, pregunta a pregunta con el artículo delante. Auditoría manual adicional de 24 preguntas al azar: 24 correctas.
- Las preguntas sin cita (temas técnicos de Bombers y de cuidados de TCAI, geografía e historia de Mossos, ofimática) solo
  tienen la segunda pasada y se marcan como "fuente web".
- Exámenes oficiales anteriores: ninguno en la v1 (ver decisiones).
- Gratis: 20 por oposición, repartidas entre temas (100 en total).

## Estructura
```
app/                 Next.js (App Router): páginas por idioma /ca y /es, API en app/api
components/          Practica.tsx (el motor de tests en el navegador), páginas y formularios
lib/                 datos, i18n, auth (email + contraseña con scrypt), pagos (Stripe), progreso (FSRS)
config/paises/es.json  moneda, IVA, planes y precios, textos legales, diarios oficiales (regla 8: varios países)
config/marca.json    nombre y dominio
oposiciones/<slug>/  oposicion.json (convocatoria, examen, temario y fuentes) · preguntas/tema-XX.json · revision/ · verificacion.json
motor/               el motor (ver abajo)
generado/            banco compilado que lee la app (lo escribe motor/compilar.mjs)
contenido/convocatorias.json  página "Convocatorias 2027" (la actualiza la tarea semanal)
marketing/           campaña de búsqueda para Google Ads Editor (sin activar)
android/             configuración TWA (Bubblewrap) para Google Play
scripts/e2e.mjs      prueba de punta a punta en móvil con Playwright
```

## El motor: una oposición nueva = un archivo de configuración + el PDF de la convocatoria
Esto es lo que reutiliza el proyecto L.
1. Crear `oposiciones/<slug>/oposicion.json` (esquema en `motor/ESQUEMA.md`; basta con nombre, convocatoria y examen) y dejar
   el PDF en `oposiciones/<slug>/convocatoria.pdf` (o su URL en `convocatoria.pdfUrl`).
2. **Modo API** (`ANTHROPIC_API_KEY`): `npm run motor -- <slug>` → `motor/temario.mjs` lee el PDF y trocea el temario
   (Sonnet 5.5) → `motor/generar.mjs` escribe las preguntas de cada tema a partir del texto vigente de sus normas (Haiku 5.5) y
   descarta las que no tengan una cita literal → `motor/revisar.mjs` hace la segunda pasada (Sonnet 5.5, con respaldo
   automático si el modelo rechaza) → `motor/verificar.mjs` → `motor/compilar.mjs`. Probado contra un servidor simulado de la API
   (no hay clave real en esta sesión).
3. **Modo sesión** (sin clave de API, lo que usa la tarea semanal): una sesión de Claude Code sigue
   `motor/INSTRUCCIONES-GENERACION.md` y valida cada archivo con `node motor/comprobar.mjs`. Así se generó el banco v1.
4. La app descubre la oposición sola: página SEO, páginas por tema, simulacro con su formato, sitemap.

**Verificación en dos pasadas.** (a) Máquina: `motor/verificar.mjs` descarga la norma consolidada y exige que la `cita` esté
literalmente en el artículo citado, además de comprobar la forma (4 opciones distintas, catalán y castellano completos).
(b) Segunda lectura: un revisor distinto del generador lee la pregunta con el artículo delante y decide si la marcada es la
única correcta (`revision/*.json`). `motor/compilar.mjs` solo deja entrar en la app las que pasan las dos. Las de temas sin
ley (técnica de bomberos, cuidados, geografía) solo tienen la segunda pasada y se marcan como "fuente web".

**Fuente de los textos legales:** el espejo abierto `legalize-dev/legalize-es` (texto consolidado del BOE en Markdown,
reutilizado conforme a las condiciones del BOE). `motor/ley.mjs` lo descarga y lo trocea por artículos. Se eligió porque
boe.es y dogc.gencat.cat no son accesibles desde la red de estas sesiones; el contenido es el mismo texto consolidado.

## Desplegar (Vercel + Neon + Stripe)
Lo hace la sesión del Mac sin pedir nada a Moisés: pasos exactos en `DESPLIEGUE.md` (reglas en `DESPLIEGUES.md` de la raíz).
Resumen: proyecto de Vercel `placa-oposicions` con Root Directory `proyectos/b-oposiciones`; Neon `cartera-b-oposiciones`; Stripe
de la cuenta **Numi Mates** (`STRIPE_TEST_SECRET_KEY` para desarrollar, `STRIPE_SECRET_KEY` + `STRIPE_MODO=real` para cobrar);
productos `Cartera · Oposiciones · <Plan>` creados por API, idempotentes (`scripts/stripe-preparar.mjs`, que también registra el
webhook); Resend para recuperar contraseñas; `LEGAL_*` para los textos legales. En el build, `scripts/db-preparar.mjs` crea las
tablas. Variables en `.env.example`. En local: Postgres, `cp .env.example .env`, `npm install && npm run build && npm start`.

**Sin claves la app ya funciona:** páginas, test gratis y progreso en el navegador. Las cuentas necesitan Neon y los pagos
necesitan Stripe. Con `PAGO_DEMO=1` (o fuera de producción) el pago se simula para probar el flujo entero.

## Qué se ha probado (28/10/2026)
- `npm run build` limpio (270 páginas estáticas) y `tsc` sin errores.
- `scripts/e2e.mjs` en un Pixel 7 emulado (Playwright) contra `next start` y Postgres 16 local, **en las cinco oposiciones**,
  en modo de pago demo: redirección por idioma, página de oposición y de tema, la API solo entrega las 20 gratuitas sin
  suscripción, test por tema con corrección, artículo y cita, aviso de plan gratuito, registro, pago, banco completo, simulacro
  completo con el formato real (30, 45, 55, 77 y 82 preguntas con reserva) y nota con penalización, estadísticas, progreso
  sincronizado en el servidor, cancelación en un clic, sin errores de JavaScript.
- Stripe contra `stripe-mock` (simulador oficial de la API): cliente, producto «Cartera · Oposiciones · <Plan>» y precio
  idempotentes, sesión de Checkout de suscripción, portal de cliente, cancelación al final del periodo, sincronización cada
  12 h, webhook firmado (válido → suscripción activa; falso → 400) y `scripts/stripe-preparar.mjs`.
- Motor en modo API contra un servidor simulado de la API de Anthropic (generación con Haiku 5.5, revisión con Sonnet 5.5 y
  respaldo automático, descarte de citas inventadas, compilación).
- **Producción** (https://placa-oposicions.vercel.app, con la marca Plaça; el dominio anterior aprova-oposicions.vercel.app sigue
  activo): la prueba de punta a punta pasa hasta el pago (páginas, API, test gratis, registro en Neon) y la API crea sesiones
  reales de Stripe Checkout en modo prueba (`cs_test_…`); el webhook rechaza peticiones sin firma.
- **Sin probar:** introducir la tarjeta 4242 en checkout.stripe.com (bloqueado desde esta sesión), el correo de recuperación
  con Resend real (falta `RESEND_API_KEY` en Vercel) y los datos legales en el aviso legal (faltan `LEGAL_*` en Vercel; ver `DESPLIEGUE.md`).

## Decisiones tomadas (y por qué)
- **Identidad de marca: Plaça** (familia Exámenes, `MARCAS.md` §4 y `marcas/tokens.json`): promesa «Treu plaça. Tests per a la
  teva oposició, per fi.», índigo `#3B3FD8`, tinta `#14142B`, papel `#F6F6FB`, verde aprobado `#19B36B`, Space Grotesk (títulos)
  e IBM Plex Sans (texto), logotipo e icono de `marcas/logos/` sin redibujar, sello «Fet a Lleida · Preu clar · Cancel·la amb un
  clic» en el pie y en la pantalla de precio. El nombre provisional anterior («Aprova») queda para el proyecto M. Dominio:
  `placa-oposicions.vercel.app` gratis hasta comprar `placa.cat` o `treuplaca.cat`.
- **Fuentes alojadas en la propia app** (paquetes `@fontsource`) en vez de pedirlas a Google Fonts en cada visita: mismo
  tipo de letra, sin enviar la IP del visitante a Google (cargar Google Fonts desde sus servidores ha sido sancionado en la UE
  por el RGPD) y sin depender de la red en el build.
- **Temario dominado:** la pantalla de práctica y las estadísticas muestran el porcentaje de preguntas de todo el banco de la
  oposición cuya última respuesta fue correcta, en total y por tema (voz de la marca).
- **Un precio para todas las oposiciones** y tres duraciones (9,99 · 7,99 · 5,99 €/mes): el opositor catalán se presenta a
  varias administraciones; el líder cobra por oposición (lista `mejorar` y `copiar` del análisis del líder).
- **20 preguntas gratuitas fijas por oposición**, repartidas entre temas y sin registro; las demás nunca salen del servidor
  sin suscripción.
- **Cuentas con correo y contraseña** (scrypt). Recuperación de contraseña por correo con Resend (enlace firmado que caduca en
  1 hora y deja de valer al cambiar la contraseña); sin `RESEND_API_KEY`, se resuelve por el formulario de contacto.
- **Sin webhook obligatorio:** la suscripción se guarda al volver de Checkout y se refresca contra Stripe cada 12 h; el
  webhook es opcional. Una variable menos para Moisés.
- **Historial permanente y exportable**, también tras cancelar (diferencial frente al líder, que lo borra).
- **Bombers:** la categoría de bomber/a de l'escala bàsica está extinguida (DT 12a de la Llei 5/1994, consolidada); el turno
  libre actual es bomber/a de primera (C1), convocatoria 81/26. Se prepara esa.
- **TCAI ICS:** las bases no fijan aún el número de preguntas ni el tiempo; el simulacro usa 50 + 5 en 90 minutos con −1/4,
  marcado como provisional en la página.
- **Generalitat C2:** el examen tiene 40 preguntas prácticas; cada tema incluye casos prácticos breves resueltos con el artículo.
- **Exámenes oficiales anteriores: no incluidos en la v1.** Hay URLs anotadas en cada `oposicion.json`, pero los PDF no son
  accesibles desde esta sesión; la tarea semanal los incorporará con `origen: "examen-oficial"` cuando pueda leerlos.
- **Analítica:** ninguna en la v1 (Umami autoalojado exige un servidor más; Plausible es de pago). La conversión se mide en
  Stripe. Sin cookies que no sean técnicas, así que no hace falta banner.
- **Google Play:** la TWA está configurada, pero Google exige Play Billing para vender contenido digital dentro de la app. La
  primera versión de Play irá en modo gratuito y la suscripción se contrata en la web.
- **Varios países (regla 8):** precios, moneda, IVA, idiomas y textos legales en `config/paises/es.json`; oposiciones con
  campo `pais`. Segundo mercado previsto: concorsi pubblici (Italia) con el mismo motor, cuando España tenga datos.
