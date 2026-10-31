# Aprova · certificats oficials de català, del B1 al C2 (proyecto M)

**La app para aprobar el certificado oficial de catalán** (B1, B2, C1 y, en la sesión 2, C2) de la Direcció General de Política Lingüística,
las universidades (CIFALC), el CPNL y Salut. No enseña catalán «en general»: entrena exactamente las partes de cada examen con sus pesos,
tiempos y mínimos (`config/examens.json`) y dice cada día la probabilidad de aprobar. Producto definido en `M-CATALA-PRODUCTE.md` (raíz).

**Demo:** https://aprova-catala.vercel.app (móvil primero; PWA instalable). Interfaz en catalán (por defecto) y castellano; explicaciones de las
reglas en catalán, castellano, inglés, árabe, rumano y francés.

## Qué hace (sesión 1)
| Función | Cómo | Dónde |
|---|---|---|
| **Entrada en 3 pantallas, sin registro** (< 90 s) | certificado y convocatoria; motivo y lengua habitual; minutos al día e idioma de las explicaciones | `components/Comencar.tsx` |
| **Diagnóstico adaptativo de 12–15 min** | 12 ítems de uso de la lengua elegidos por un modelo logístico (cada ítem se ajusta a la respuesta anterior), lectura, comprensión oral (B1/B2), texto breve corregido por criterios y lectura en voz alta opcional → **probabilidad de aprobar hoy**, nota por área sobre la estructura oficial, 3 puntos débiles y 3 sonidos difíciles | `lib/motor/diagnostic.ts`, `components/Diagnostic.tsx`, `ResultatDiag.tsx` |
| **Plan hacia la convocatoria** | sesiones de 10–20 min con 40 % repaso de errores, 40 % área más débil ponderada por su peso en el examen, 20 % producción; minisimulacro semanal; simulacro la semana antes; recalibración semanal; aviso de la ventana de inscripción (14 días antes y durante) | `lib/motor/pla.ts`, `components/Avui.tsx`, `PlaVista.tsx` |
| **Práctica diaria** | huecos normativos, transformación, detección de castellanismos, dictados con audio, léxico; botón **«Per què?»** con la regla citada (Optimot/GIEC/DIEC2) y ejemplos; cada error entra en el **repaso espaciado FSRS** (`ts-fsrs`) | `components/ItemVista.tsx`, `Practica.tsx`, `lib/motor/repas.ts` |
| **Mapa de dominio** | confianza 0–100 % por punto del programa oficial (respuestas + retención FSRS), ordenado por peso en el examen | `components/Mapa.tsx`, `config/punts.json` |
| **Corrección escrita por criterios (< 60 s)** | (1) reglas propias de calcos, (2) **LanguageTool con las reglas de Softcatalà** para lo seguro, (3) modelo de lenguaje (Salamandra/ALIA del BSC vía `BSC_API_URL`, o Anthropic) para adecuación, coherencia y riqueza y los 3 errores prioritarios; **«posible error»** cuando duda. Nota en la escala del examen (C1: x/40). Sin modelo, heurísticas marcadas como orientativas | `lib/correccio/`, `components/Editor.tsx`, `Correccio.tsx`, `/api/corregir` |
| **Simulacro escrito completo B1, B2 y C1** | áreas en el orden oficial con reloj real por área, comprensión oral con audio (máximo 2 escuchas), lectura, expresión escrita corregida, uso de la lengua (30/40/45 ítems); resultado **apto/no apto estimado** con mínimos por parte y global, comparación con la cohorte de la misma convocatoria; los errores entran en el plan | `components/Simulacre.tsx`, `/api/simulacre`, `motor/compilar.mjs` (monta los simulacros) |
| **Oral básica** | lectura en voz alta con puntuación por sonido sobre el catálogo de 15 sonidos difíciles para castellanohablantes (vocal neutra, e/o abiertas, essa sonora, l·l, xeix…); reconocimiento con **Whisper catalán de AINA** si hay `WHISPER_URL`, si no el del navegador (ca-ES) | `components/Oral.tsx`, `lib/oral.ts`, `/api/oral`, `contenido/oral/` |
| **Racha desacoplada** | se mantiene con la minisesión de 2 minutos; 2 congelaciones al mes automáticas; pantalla de compromiso (7/14/30 días, sin opción preseleccionada) | `lib/motor/ratxa.ts` |
| **Gratis / Premium** | gratis: diagnóstico, 1 simulacro/mes, minisesiones, 3 correcciones y 10 min de oral al mes; premium 9,99 €/mes, 59,99 €/año (7 días de prueba) o pase de convocatoria 24,99 € (Stripe Checkout, modo prueba); aviso 7 días antes de renovar, cancelación en un clic, 14 días de devolución | `config/paises/es.json`, `lib/pagos.ts`, `/api/checkout` |
| **Voz** | TTS barato configurable (`TTS_PROVEIDOR`: navegador, google, azure, matxa); ElevenLabs solo en la demo de la landing | `lib/veu.ts`, `/api/tts`, `lib/client/veu.ts` |
| **Calendario 2027 con alertas**, 30 páginas SEO ca/es, legales (RGPD, LSSI, desistimiento), contacto, PWA | `config/convocatories.json`, `contenido/seo/`, `lib/legal.ts` |

**Lo que no se hace (a propósito):** corazones que castigan, avatares, itinerarios rígidos, gamificación por encima del aprendizaje.
**Sesión 2:** simulacro oral completo con examinador de voz, C2, liga por convocatoria, reto de 60 días, Android (TWA).

## Contenido (28/10/2026)
| | Cantidad |
|---|---|
| Reglas normativas con explicación en 6 idiomas y fuente | 30 |
| Ítems de uso de la lengua (B1 100 · B2 120 · C1 172) | **392** (127 gratis, 157 aptos para el diagnóstico) |
| Textos de comprensión lectora (B1 4 · B2 4 · C1 4) y guiones de comprensión oral (B1 5 · B2 5) | 22 |
| Tareas de expresión escrita (B1 4 · B2 6 · C1 4 argumentativas con 3 fuentes) | 14 |
| Simulacros montados con la estructura oficial | 9 (3 por nivel) |
| Sonidos del catálogo oral y lecturas en voz alta | 15 y 14 |
| Páginas SEO (ca + es) | 30 |

Generado en modo sesión (Claude escribe siguiendo `motor/ESQUEMA.md`), **validado con LanguageTool 6.8 + reglas de Softcatalà** (`motor/validar-lt.mjs`,
informe en `contenido/revisio/lt-2026-10-28.json`) y con `motor/comprobar.mjs` (forma). **Lote de 50 ítems para revisión humana por muestreo**
estratificado: `contenido/revisio/lot-2026-10-28.json`. Los modelos del BSC: no se pudieron ejecutar en esta sesión (huggingface.co bloqueado
por la red del entorno); el motor (`motor/ia.mjs`, `motor/generar.mjs`) los usa en cuanto exista `BSC_API_URL` (vLLM propio o inferencia
de HF) y, si no, Anthropic (Haiku 5.5). Hallazgos sobre el contenido: ver «Decisiones».

## Estructura
```
app/[lang]/        páginas por idioma (/ca, /es): comencar, diagnostic, avui, practica/[tipus], mapa, escriure/[tasca], simulacre/[id], oral, pla,
                   convocatories, preus, entrar, compte, legal/[doc], contacte, validesa, guia/[slug]
app/api/           auth, checkout (+confirmar), stripe/webhook, portal, subscripcio, progres, banc, us, corregir, simulacre, tts, oral, alerta, contacte, errata, validesa, yo
components/        pantallas (cliente) e ingredientes (ItemVista, Editor, Correccio, Oral…)
lib/motor/         diagnostic (adaptativo + probabilidad), pla, repas (FSRS), ratxa, avaluar (corrección de respuestas)
lib/correccio/     regles (calcos), languagetool, llm (BSC/Anthropic), index (orquestador < 60 s)
lib/               auth, pagos (Stripe), veu (TTS), oral (puntuación por sonido), estat (estado del navegador + sync), legal, i18n, datos
config/            marca, paises/es (precios, cuotas, legal), examens (estructura oficial), convocatories (2027), punts (mapa)
contenido/         regles, items/<nivell>/<tipus>.json, textos, tasques, oral, seo, revisio (lotes humanos e informes LT)
motor/             ESQUEMA.md, comprobar, validar-lt, compilar (→ generado/banc.json), generar (IA), ia, lot-revisio
scripts/           db-preparar, stripe-preparar, iconos, e2e (Playwright móvil), validesa-analitzar
marketing/         vídeos, Google Play, Google Ads (sin activar), comunidades · validesa/  consentimiento y hoja del profesor
prisma/schema.prisma  Usuari, Progres, Simulacre, Correccio, Us (cuotas y coste), Alerta, Validesa, Contacte, Ajust
```
Documentos: `MONETIZACION.md` (primer euro), `COSTES.md` (coste por usuario), `VALIDESA.md` (prueba con 20 candidatos), `MARKETING.md`,
`TAREA-PROGRAMADA.md` (semanal y mensual), `PARA-MOISES.md`, `DESPLIEGUE.md` (hecho).

## Desplegar y probar
Hecho desde la sesión (ver `DESPLIEGUE.md`): Vercel `aprova-catala` (Root Directory `proyectos/m-catala`), Neon `cartera-m-catala` por la
integración de Vercel, Stripe Numi Mates en modo prueba (`scripts/stripe-preparar.mjs`, idempotente), Resend, `LEGAL_*`. Variables en `.env.example`.
```bash
npm install && npm run check && npm run build          # prisma generate + db push (si hay DATABASE_URL) + compilar contenido + next build
env -u DATABASE_URL -u STRIPE_TEST_SECRET_KEY -u STRIPE_SECRET_KEY PAGO_DEMO=1 npx next start -p 3100   # sin claves: todo funciona, pago simulado
BASE=http://localhost:3100 node scripts/e2e.mjs        # prueba de punta a punta en Pixel 7 emulado
node motor/comprobar.mjs --resumen && LANGUAGETOOL_URL=http://localhost:8081/v2 node motor/validar-lt.mjs --resumen   # contenido
```
LanguageTool en local sin descargar de languagetool.org (bloqueado): `apache-maven` desde Maven Central y `mvn dependency:copy-dependencies`
con `org.languagetool:languagetool-server:6.8` y `language-ca:6.8`, después `java -cp "jars/*" org.languagetool.server.HTTPServer --port 8081`.
En producción se usa la API pública (`LANGUAGETOOL_URL=https://api.languagetool.org/v2`, 20 peticiones/min); autoalojarlo cuesta ≈ 5 €/mes.

## Modelo de acceso (31/10/2026)
- Diagnóstico abierto sin registro. Para crear el plan se pide cuenta (`components/RequereixCompte.tsx`): 7 días con todo abierto, sin tarjeta
  (`Usuari.provaFins`, `estatAcces()` en `lib/auth.ts`). Después, minisesión y repaso gratis para siempre; simulacros, correcciones, oral y
  sesión completa con el pase de convocatoria (oferta principal) o la suscripción. Correos del día 5 y 8 por Vercel Cron (`app/api/cron/prova`).

## Qué se ha probado (31/10/2026)
- `npm run build` limpio, `tsc` sin errores y `npm test` (17 pruebas del motor: probabilidad, θ, dictado, reglas, racha, plan).
- Auditoría completa en `AUDITORIA.md` (técnica, código, mercado, visual) con el estado de cada hallazgo en su sección 8.
- `scripts/e2e.mjs` en Pixel 7 emulado **en local (modo demo, sin claves)** y **en producción** (https://aprova-catala.vercel.app, Neon y Stripe
  de prueba): entrada en 3 pantallas, diagnóstico completo con «Per què?», resultado con probabilidad, Hoy con compromiso y racha, minisesión,
  mapa, **simulacro de C1 completo** (redacción corregida + 45 ítems) con resultado, escribir, oral, convocatorias, precios, guía SEO, castellano,
  registro en Neon y sesión real de Stripe Checkout (`cs_test_…`). Sin errores de JavaScript.
- LanguageTool sobre 1.349 textos del banco: 25 avisos restantes, todos revisados (falsos positivos documentados en `motor/validar-lt.mjs` o
  ejemplos de error citados a propósito).
- **Sin probar:** pago con la tarjeta 4242 en checkout.stripe.com (no se abre desde la sesión), correos reales de Resend, TTS y Whisper (sin
  proveedor configurado), corrección con modelo de lenguaje (sin clave) y la validez con candidatos reales (protocolo listo).

## Marca y diseño (tercera pasada, 28/10/2026)
- Identidad propia en `MARCA.md`: el **full de respostes** (papel blanco, bolígrafo azul `#2140D6`, cuadrícula de libreta, marcador
  fluorescente `#FFF056` para el error) y **en Volat**, el punt volat de la l·l con cara, como personaje (`components/Volat.tsx`, cinco
  posturas, se mueve una sola vez por pantalla). Logotipo con trazado real (Archivo Expanded ExtraBold convertido a path,
  `public/marca/logo*.svg`, `components/Logo.tsx`) con Volat sentado en la «v»; icono en `app/icon.svg` y `public/icons/*.png`.
- Una sola familia tipográfica, **Archivo variable** con eje de anchura (`@fontsource-variable/archivo/wdth.css`): titulares y números
  en Expanded ExtraBold, texto en anchura normal. Sistema en `app/globals.css`; aplicación por pantalla en `DISSENY.md`.
- Portada con la necesidad: promesa «Sabràs si aproves abans de pagar la taxa», pregunta real del examen para responder en el acto,
  cuenta atrás real de las próximas inscripciones (`config/convocatories.json`, regenerada cada día) y «Què t'hi jugues» (tasa, meses, plaza).
- Skills de diseño instaladas en `.claude/skills/` (`frontend-design` de Anthropic; `web-design-guidelines`, `react-best-practices`,
  `react-view-transitions` de Vercel Labs). Antes de tocar la interfaz, leer `MARCA.md` y esas skills.

## Decisiones tomadas (y por qué)
- **Identidad de marca: Aprova** (familia Nuevo en España, `MARCAS.md` §4): promesa «El teu certificat de català, del B1 al C2.», terracota/azul
  noche/crema con acento ocre `#E0B23A`, Outfit + Noto Sans (alojadas en la app, no en Google Fonts), logotipo e icono de `marcas/logos/`, sello
  «Fet a Lleida · Preu clar · Cancel·la amb un clic». Catalán por defecto; castellano si el navegador no tiene catalán.
- **Sin registro hasta ver el resultado:** todo el estado vive en el navegador (`lib/estat.ts`) y se sincroniza con la cuenta cuando existe; las
  cuotas gratuitas se controlan también en el servidor con una cookie técnica anónima (`aprova_anon`, tabla `Us`).
- **Probabilidad de aprobar** = producto de la probabilidad de superar cada mínimo oficial (parte escrita, parte oral, mínimos por área y global)
  con σ = 9 puntos de incertidumbre; la oral se **estima** y se marca como tal hasta la sesión 2. Es una estimación, y la app lo dice.
- **Tiempos de B2 orientativos**: la DPL no publica los minutos por área del B2 en la fuente consultada; están marcados `verificat: false` en
  `config/examens.json` y la tarea semanal los contrasta con el modelo de prueba oficial. Las fechas 2027 de la DPL son previstas (patrón 2026).
- **Simulacros originales**: no se reproducen pruebas oficiales (derechos); siguen la estructura, tiempos, número de ítems y mínimos publicados.
- **Corrección en tres capas** y «posible error» cuando la IA duda (Write & Improve); nota de corrección = media de la del modelo y la densidad de
  errores seguros (lo comprobable manda a medias). Latencia medida en producción sin modelo: 1–3 s; con Sonnet, estimada 8–20 s (< 60 s).
- **Oral de la sesión 1 = pronunciación aproximada**: la puntuación por sonido se deriva de qué palabras clave reconoce el ASR; el alineamiento
  forzado por fonema (MMS/ctc-forced-aligner sobre el Whisper catalán) llega con el servicio de voz de la sesión 2. La app lo avisa.
- **Voz del navegador por defecto** (gratis, funciona sin red en Android/iOS con voz ca-ES); Google TTS Standard (4 $/M caracteres) cuando
  Moisés añada la clave; Matxa-TTS solo si su licencia lo permite (`panel`: licencia mixta, verificar). ElevenLabs únicamente en la demo de la landing.
- **Sin analítica** (sin cookies de terceros); conversión medida en Stripe y en las tablas propias.
- **Pase de convocatoria** como pago único de 3 meses (Checkout en modo `payment`, acceso por fecha), no como suscripción: es lo que compra quien
  tiene fecha de examen y evita la queja número uno de la categoría (cobros tras la prueba).
- **Hallazgos de contenido** durante la validación: dudas normativas reales en ser/estar con localización de cosas, caiguda de preposición en
  registro coloquial, «al + infinitiu», «gaire/molt»; están anotadas en el lote de revisión humana y en los informes de los agentes de contenido.
- **Varios países (regla 8):** precios, cuotas, legal y organismos en `config/paises/es.json`; el motor sirve para vasco, gallego o portugués
  cambiando `config/examens.json`, el banco y las reglas (CARTERA, expansión).

## SEO (31/10/2026)

31 guías SEO en `contenido/seo/` (ca/es, Markdown mínimo con enlaces internos y externos); analítica sin cookies con
`@vercel/analytics`; verificación de Search Console por variable `GOOGLE_SITE_VERIFICATION`. Venta cruzada con Plaça
(tests de oposiciones) desde las guías de cuerpos. Ver DESPLIEGUE.md, «SEO y medición».

