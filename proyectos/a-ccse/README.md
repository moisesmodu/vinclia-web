# A · CCSE en tu idioma

Web y app (PWA + Android) para aprobar la prueba CCSE de nacionalidad española. Tiene las 300 preguntas oficiales del
Instituto Cervantes, con la explicación de cada respuesta en castellano, árabe, francés, inglés, rumano, chino y
ucraniano. La interfaz también está en catalán. Pertenece a la marca **Nuevo en España**, que comparte con el proyecto N.

**Fuente de las preguntas:** [Manual de preparación de la prueba CCSE 2026](https://examenes.cervantes.es/sites/default/files/manual-ccse-2026-def.pdf),
Instituto Cervantes. Se cita en el pie de todas las páginas y en cada pregunta, con la página del manual.

## Qué hace
- **Test por tema** (5 tareas) con corrección al momento. Muestra la pregunta en español, la traducción y la explicación en el idioma del usuario, la página del manual y la lectura en voz alta.
- **Simulacro** como el examen real: 25 preguntas (10/3/2/3/7), 45 minutos y apto con 15. Da la nota y deja revisar las respuestas. Al final aparece la tarjeta **"Siguiente paso: tus trámites"**, que apunta a la guía de nacionalidad de Nuevo en España (https://tuspapeles.app) con `utm_source=a-ccse` (venta cruzada medible).
- **Repaso espaciado** de las preguntas falladas con FSRS (`ts-fsrs`, MIT).
- **Progreso**: índice "listo para el examen", acierto por tema, historial de simulacros y cuenta atrás hasta la convocatoria.
  Sin cuenta se guarda en el dispositivo. Con cuenta de correo se sincroniza en Neon y se fusiona sin perder datos.
- **Gratis:** 25 preguntas fijas, con el mismo reparto que el examen, y 1 simulacro. **Pago único de 9,99 € por 90 días** con Stripe Checkout.
- Página **"Cómo es el examen"** en 8 idiomas, 22 guías SEO (con `FAQPage`), 300 páginas indexables (una por pregunta) y un sitemap con hreflang. **URL pública: https://ccsefacil.com** (canonical); `ccse-en-tu-idioma.vercel.app` sigue sirviendo sin redirección por la app Android y el webhook. Analítica sin cookies con Vercel Web Analytics.
- PWA instalable y sin conexión, más la app Android (TWA) en `android/`.

## Desplegar
Lo hace una sesión de Claude, no Moisés. Los pasos exactos (proyecto de Vercel `ccse-en-tu-idioma` con Root Directory
`proyectos/a-ccse`, el proyecto de Neon `cartera-a-ccse`, el producto y el webhook de Stripe de la cuenta Numi Mates, las variables y los comandos) están en
**[DESPLIEGUE.md](DESPLIEGUE.md)**. Las reglas comunes están en `../../DESPLIEGUES.md`.

- **Stripe:** el producto `CCSE Fácil — Acceso 3 meses` y su precio se crean por API la primera vez, de forma idempotente (por `lookup_key`).
  El webhook lo crea `scripts/stripe-configurar.mjs` o, si falta, la propia app en el primer pago. Aunque el webhook fallara,
  la página de vuelta del pago confirma la sesión con Stripe y da el acceso igual. `STRIPE_MODO=test` usa `STRIPE_TEST_SECRET_KEY`, y `live` usa `STRIPE_SECRET_KEY`.
- **Base de datos:** `npm run build` aplica `prisma/migrations` si hay `DATABASE_URL`, y sigue sin ella.
- **Datos legales:** `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL` y `LEGAL_ADRECA` se leen en cada petición. Si falta alguno, el texto legal muestra «[falta LEGAL_…]».

## Comandos
```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # build de producción (limpio)
npm run revisar      # revisión lógica del banco: 300 preguntas × 7 lenguas
npm run unir         # une content/explicaciones/bloque-*.json → content/i18n/<lengua>.json
node scripts/iconos.mjs                       # PNG de iconos desde los SVG
node pruebas/e2e-api.mjs   # 30 pruebas de API (necesita la app en :3100 con .env.test y Postgres)
node pruebas/e2e-movil.mjs # 15 pruebas en navegador con pantalla de Pixel 7
```

## Contenido
- `content/preguntas.json`: banco oficial (id, tarea, texto, opciones, respuesta, página del manual).
- `content/explicaciones/bloque-NN.json`: fuente de las explicaciones y traducciones (7 lenguas) y la revisión lógica de cada pregunta.
- `content/i18n/<lengua>.json`: lo que sirve la API, generado con `npm run unir`. Es contenido de pago. Solo se lee en el servidor (`/api/banco`) y no llega al navegador sin acceso, salvo las 25 preguntas gratis. Se ha comprobado que no aparece en el bundle.
- `content/revision.json`: 20 preguntas con `ok: false`, en las que la respuesta oficial está desfasada o simplificada (por ejemplo, el «Ejército del Aire» o el voto al alcalde). Llevan una «nota» en las 7 lenguas: para el examen vale la respuesta del manual. Las respuestas oficiales nunca se cambian.
- `content/examen/<locale>.md`, `content/guias/<locale>/*.md`, `content/legal/*.md`: páginas en Markdown. `{{FECHAS}}` inserta la tabla de convocatorias desde `config/paises/es.json`.
- `config/paises/es.json`: precio, días de acceso, plan gratis, formato del examen, tasa y fechas de convocatoria. **Todo lo que cambia por país está aquí** (regla 8). Para el segundo mercado (examen de ciudadanía de EE. UU. en español) se añade `config/paises/us.json` y otro banco.

## Revisión de las explicaciones
1. 12 lotes de 25 preguntas, redactados con IA según un encargo único: frases cortas de nivel A2–B1, la palabra clave en español entre comillas, una revisión lógica por pregunta y la prohibición de cambiar la respuesta oficial.
2. `npm run revisar` comprueba que hay 300 × 7 lenguas, el número de opciones, la escritura de cada lengua (árabe, chino, cirílico), las longitudes y la ausencia de duplicados. También comprueba que cada explicación nombra la opción correcta, que las de verdadero/falso dicen lo mismo que la respuesta oficial y que las revisiones negativas llevan nota. Resultado: **0 errores y 0 avisos**. Se probó metiendo fallos a propósito, y los detecta.
3. Pendiente y recomendado: que un nativo revise por muestreo el árabe y el chino antes de invertir en marketing en esos idiomas.

## Identidad de marca
Ficha `proyectos.a-ccse` de `marcas/tokens.json` y `MARCAS.md`: **CCSE en tu idioma**, por Nuevo en España. Promesa: «Aprueba el examen de nacionalidad en tu idioma», en los 8 idiomas.
- **Colores:** terracota `#D9603B` para formas, y `#B4492A` en botones y texto pequeño porque el terracota de la marca solo da 3,7:1 sobre blanco. Azul noche `#1F2A44`, crema `#FBF5EC` y oliva `#7A8F3C`.
- **Tipografía:** Outfit en títulos y Noto Sans en el texto, cargadas de Google Fonts. Noto Sans Arabic y Noto Sans SC se cargan solo en esos idiomas.
- **Logotipo e iconos:** se usan sin cambios. Están en `public/marca/logo.svg` y `public/icons/icon.svg`, y la variante adaptable (maskable) solo añade margen.
- **Sello común en el pie y pantalla de precio con la estructura común.** «Cancela en un clic» es literal: no hay suscripción y la cuenta se borra con un botón (`DELETE /api/auth/cuenta`). La cuenta se anonimiza, y los pagos se guardan 6 años por obligación fiscal.

## Decisiones tomadas (y por qué)
- **Las preguntas salen de un banco ya extraído, no del PDF directamente.** La red de la sesión bloquea `examenes.cervantes.es`. Se tomaron solo los datos oficiales (enunciado, opciones, respuesta y página) del repositorio `combimauri/ccse-estudio`, extraídos del manual 2026. Sus explicaciones no se copiaron: todas las de aquí son propias. El reparto por tareas coincide con el oficial (120/36/24/36/84). La tarea programada debe contrastarlo con el PDF oficial (ver TAREA-PROGRAMADA.md).
- **Cuenta con correo y contraseña** (scrypt + cookie JWT firmada), sin enlace mágico. Así no hace falta abrir Resend para que funcione. Si se añade `RESEND_API_KEY`, funciona la recuperación de contraseña por correo. Sin ella, se recupera por soporte.
- **i18n propio** (diccionarios JSON y rutas `/[locale]`) en lugar de next-intl. Son 8 idiomas con unas 150 cadenas, todo estático, sin dependencia. El árabe va en `dir="rtl"`.
- **El catalán tiene interfaz, pero las explicaciones son en castellano.** Casi ningún candidato al CCSE estudia en catalán, y la regla de "castellano y catalán siempre" se cumple en la interfaz.
- **Las páginas por pregunta** solo están en español. Muestran el enunciado, la respuesta y la página del manual. La explicación solo aparece en las 25 gratis, para no regalar el contenido de pago.
- **Precio de 9,99 € por 90 días**, como pidió Moisés. El análisis del líder proponía 12 meses: queda como experimento para cuando haya datos.
- **Garantía de aprobado** (devolución si suspendes habiendo hecho 3 simulacros), del plan del líder. Su coste es casi nulo con un 98 % de aprobados. Está en las condiciones de venta.
- **Desistimiento:** Checkout muestra el aviso del art. 103.m TRLGDCU antes de pagar, y la página de precio también.
- **Afiliados:** `?ref=código` se guarda 60 días y llega a Stripe en `metadata.afiliado`. Checkout acepta códigos promocionales.
- **Lectura en voz alta** con la voz del dispositivo (Web Speech API): coste cero. ElevenLabs queda para los vídeos.
- **Sin analítica todavía.** Se activa con `NEXT_PUBLIC_UMAMI_SRC` y `NEXT_PUBLIC_UMAMI_ID` cuando haya un Umami. No hay cookies de seguimiento, así que no hace falta banner.
- **Fuentes del sistema** en vez de Google Fonts: es más rápido y no depende de la red al compilar.

## Android (TWA)
- `android/twa-manifest.json` es la configuración, y `android/proyecto/` el proyecto Gradle, generado con `@bubblewrap/core` (`node android/generar.mjs <node_modules>`). El paquete es `es.nuevoenespana.ccse` y el dominio `ccse-en-tu-idioma.vercel.app`.
- La compilación se hace en GitHub Actions (`.github/workflows/a-ccse-android.yml`), porque esta sesión no puede descargar el SDK de Android. Sale un AAB sin firmar, que se firma fuera de GitHub con la clave de subida. **La clave nunca entra en el repo, que es público.**
- `/.well-known/assetlinks.json` se genera con la variable `TWA_SHA256`: la huella de la clave de subida más la de firma de Google Play, separadas por comas. Sin ella, la app funciona igual pero muestra la barra de dirección.

## Probado y no probado
- Probado aquí: `npm run build` limpio y `tsc` sin errores. **30/30 pruebas de API** contra Postgres 16 real: registro, sesión, fusión del progreso, muro de pago, límite de simulacros, producto y precio creados por API sin duplicados, Checkout, webhook firmado con la librería oficial de Stripe, 90 días de acceso, idempotencia, afiliados y datos legales en tiempo de ejecución. **15/15 pruebas en navegador móvil** (Pixel 7): test en árabe RTL con su explicación, simulacro completo con la tarjeta del proyecto N, muro, alta de cuenta y botón de pago hacia Stripe, sin errores de JavaScript ni scroll horizontal.
- **No probado contra Stripe real.** La red de la sesión bloquea `api.stripe.com`, así que se probó con un doble local de la API. La primera prueba real es el paso 6 de DESPLIEGUE.md, con la tarjeta 4242 4242 4242 4242.
- No probado en un Android físico. El AAB se compila en CI y no se ha instalado en ningún teléfono.
