# N · Nuevo en España

Guías paso a paso de los trámites de las personas recién llegadas o recién regularizadas en España, en castellano,
árabe, francés, inglés, rumano, chino y ucraniano (interfaz también en catalán). Cada guía tiene documentos, plazos,
tasas, errores frecuentes, diferencias por comunidad, fuentes oficiales citadas y fechadas, una lista de comprobación
interactiva y recordatorios de plazos por correo. Es información pública: **no es asesoramiento legal, no gestiona
citas y no tramita nada en nombre de nadie** (lo dice cada página, el pie, los correos y las condiciones).

| Gratis | De pago |
|---|---|
| Guía completa de **empadronamiento** (con lista y recordatorios) y el resumen + datos clave + fuentes de todas | Las 8 guías completas, listas y recordatorios: **4,99 €/mes** (cancelable) o **pack 19,90 €** (12 meses, sin renovación) |

Guías de la versión 1: empadronamiento · renovación de la autorización de residencia (incluida la modificación de
las autorizaciones del Real Decreto 316/2026) · número de la Seguridad Social · tarjeta sanitaria · cuenta bancaria ·
homologación de títulos · carnet de conducir (canje y teórico) · nacionalidad (2 y 10 años, CCSE y DELE A2).

## Pila
Next.js 15 (App Router) + TypeScript + Tailwind 4 · Postgres (Neon) con Prisma · Stripe Checkout + webhooks ·
Resend · PWA con service worker (guías visitadas disponibles sin conexión) · TWA para Google Play en `twa/`.
Analítica sin cookies con Plausible (opcional por variable de entorno).

## Estructura
```
config/paises/es.json         país: idiomas, precios, guía gratis, orden, titular (nada de esto está en el código)
content/es/<idioma>/guias/    una guía por archivo JSON (esquema en content/ESQUEMA-GUIA.md)
content/es/<idioma>/preguntas/ páginas SEO (una por búsqueda real, en su idioma)
content/ui/<idioma>.json      textos de la interfaz (si falta una clave, se usa el castellano)
content/legal/                aviso legal, privacidad, cookies, condiciones (castellano, vinculantes)
app/[idioma]/...              páginas (estáticas salvo «Mi cuenta»)
app/api/...                   guía protegida, checkout, webhook, acceso, recordatorios, cron, cuenta
marketing/                    guiones de vídeo, fichas de Google Play, comunidades
scripts/                      validar contenido, prueba e2e, Stripe simulado, revisar fuentes, iconos
```

## Despliegue
Lo ejecuta la sesión con los secretos del entorno siguiendo **`DESPLIEGUE.md`** (proyecto de Vercel con Root Directory
= esta carpeta, proyecto de Neon `cartera-n-nuevo-en-espana`, productos y webhook de Stripe en la cuenta Numi Mates
creados por `scripts/stripe-configurar.mjs`, migraciones con `prisma migrate deploy`). Variables en `.env.example`.
El cron de recordatorios está en `vercel.json`. Si `STRIPE_PRICE_*` no está definido, Checkout crea el precio al vuelo
con el mismo nombre de producto, así que la web funciona igual.

## Pruebas
```bash
npm install
npm run validar            # esquema de las guías y coherencia de traducciones (mismos id, mismos días)
npm run check && npm run build
# Prueba de punta a punta (Postgres local + Stripe simulado, sin red):
unset RESEND_API_KEY                          # la prueba nunca envía correos reales
npm run stripe:simulado &                     # simulador mínimo de la API de Stripe en :12111
export STRIPE_SECRET_KEY=sk_test_simulado STRIPE_API_BASE=http://localhost:12111 STRIPE_WEBHOOK_SECRET=whsec_prueba_local
npx next start -p 3000 & npm run prueba:e2e   # 43 comprobaciones: idioma, muro, pago, webhooks, recordatorios, cron, cancelación, pack, enlace mágico
```
`STRIPE_API_BASE` solo existe para las pruebas. Los webhooks de la prueba se firman con la librería oficial de Stripe.

## Marca
Ficha `n-nuevo-en-espana` de `MARCAS.md` y `marcas/tokens.json`: logotipo en línea (`components/Logo.tsx`, mismo
trazado que `marcas/logos/n-nuevo-en-espana.svg`), icono en `public/marca/`, colores terracota `#D9603B`, azul noche
`#1F2A44`, crema `#FBF5EC` y oliva `#7A8F3C`, Outfit + Noto Sans (con Noto Sans Arabic y SC) servidas desde el propio
dominio con `next/font`. Botones y enlaces usan la terracota oscura `#B9472A` para llegar al contraste AA con texto
blanco (la de marca da 3,7:1). Sello común en el pie, en la pantalla de precio y en los correos.

## Decisiones tomadas (regla 4 de SESIONES.md)
- **A (CCSE) no existía** al construir N. N nace con la marca «Nuevo en España» y una base reutilizable: cuando se
  construya A, debe vivir en la misma app (otra sección `/[idioma]/ccse`) o copiar `components/`, `lib/` y `app/globals.css`.
- **Guía gratis = empadronamiento** (no la de renovación): es la puerta de entrada de todos los trámites y la más
  buscada sin pago; la de renovación es el producto estrella que JUICIO.md pide vender (19,90 € para la ola de abril–junio de 2027).
- **Pack 19,90 € = 12 meses de acceso** a todo, pago único sin renovación: cubre la renovación y la nacionalidad
  sin el miedo a una suscripción. La suscripción se cancela desde «Mi cuenta» (cancela al final del periodo).
- **Sin contraseñas:** se entra al volver de Stripe (cookie firmada) o con un enlace mágico de 30 minutos al correo de pago.
- **Datos mínimos:** solo correo, plan, fechas e ids de Stripe. La lista de comprobación vive en el navegador.
  Recordatorios con doble confirmación y baja en un clic. No se pregunta nacionalidad ni situación legal.
- **Las guías de pago no están en el HTML** (se piden a `/api/guia` con sesión); el resumen, los datos clave y las
  fuentes sí, para SEO y para que se vea el valor antes de pagar.
- **Consentimiento de desistimiento** (art. 103.m TRLGDCU) obligatorio antes del pago, más una garantía propia de
  devolución en 7 días (coste casi nulo, quita miedo a pagar).
- **Catalán:** interfaz traducida (regla de SESIONES); las guías en catalán muestran el castellano con aviso.
- **30 páginas SEO repartidas por idioma** según volumen de búsqueda (es 9, ar 5, fr 5, en 3, ro 3, uk 3, zh 2),
  cada una en el idioma en que se busca, en vez de 30 por idioma: mejor 30 páginas buenas que 210 traducidas.
- **Textos legales vinculantes solo en castellano**; en los demás idiomas se muestra arriba el aviso traducido.
- **Fuera de la versión 1:** generador de documentos, alertas de cambio normativo por guía, versión para ayuntamientos
  (B2G, ver `MARKETING.md`) y abogados colaboradores.

## Estado de la verificación de datos (28/10/2026)
La red de la sesión de construcción bloqueaba boe.es, inclusion.gob.es, dgt.es y otras sedes oficiales. Los datos se
contrastaron con búsquedas limitadas a esos dominios, no leyendo cada página entera. Donde un importe o plazo no se
pudo confirmar, la guía dice «comprueba el importe vigente» y enlaza la sede. La tarea programada semanal
(`TAREA-PROGRAMADA.md`) repasa todo esto. Pendientes concretos: tasas 790-052 y 790-012 de 2026, precio del DELE A2,
tasa DGT 2.1/2.3 de 2026, umbrales de gratuidad de la cuenta de pago básica, plazo del NUSS.
