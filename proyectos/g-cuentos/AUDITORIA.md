# Auditoría de Lunilla (lunilla.cat) · 1 de noviembre de 2026

Objetivo: que Lunilla aporte su parte a los 3.000 €/mes de la cartera en 6 meses. Lunilla no es un negocio de
anuncios (`VIABILIDAD.md`: 7–10 € de margen por venta): vive de **Navidad, orgánico y afiliadas**. En las próximas
seis semanas se juega el año. Con 30 ventas al mes en diciembre (≈ 600 € de facturación) se cumple su parte; para eso
hacen falta tráfico de búsqueda en las páginas de regalo, y que quien llega no se pierda entre la portada y el pago.

Método: revisión del código de `claude/g-cuentos`, curl de producción (cabeceras, metadatos, sitemap) y Playwright
(Chromium headless) en 360, 390 y 1366 px contra producción y contra la versión local (con Postgres embebido local y
pago simulado; nunca la base de datos de producción ni Stripe).

Leyenda: **P0** frena ventas o indexación · **P1** importante antes del 1 de diciembre · **P2** mejora.
✅ = arreglado en esta revisión.

## 1. SEO

| # | Hallazgo | Prioridad | Estado |
|---|---|---|---|
| 1.1 | La portada `/` no tenía `<link rel="canonical">` ni hreflang; `/ca` sí. Google podía tratar `/` y `lunilla.vercel.app` como duplicados. | P0 | ✅ canonical + hreflang es/ca + `x-default` |
| 1.2 | `/cuentos` y `/ca/contes` sin canonical ni hreflang; `/ca/contes` mostraba la descripción **en castellano**. | P0 | ✅ |
| 1.3 | Muestras, avisos legales y afiliadas sin canonical ni hreflang; las catalanas heredaban la descripción castellana y `og:locale=es_ES`. | P1 | ✅ con un ayudante único (`src/lib/meta.ts`) |
| 1.4 | Páginas de ideas: el hreflang solo apuntaba al otro idioma (sin autorreferencia, que Google exige). | P1 | ✅ |
| 1.5 | `<html lang="es">` también en `/ca/*` (un único layout raíz). | P1 | ✅ guion en línea que pone `lang="ca"` antes de pintar; el contenido ya iba en `<div lang="ca">` |
| 1.6 | Título de portada sin la búsqueda principal («Lunilla · Un cuento donde…»); en `/ca`, «Lunilla» repetido dos veces. | P0 | ✅ «Cuento personalizado para niños con su nombre · Lunilla» y «Conte personalitzat per a nens i nenes amb el seu nom · Lunilla» |
| 1.7 | `/crear` era `noindex` pero aparecía en el sitemap (señal contradictoria). | P2 | ✅ fuera del sitemap |
| 1.8 | «regalo navidad niño 3 años»: la página `regalo-original-nino-3-anos` era corta (2 párrafos) y no hablaba de Navidad; sin gemela catalana. | P0 | ✅ reescrita (Navidad/Reyes/cumpleaños, fechas, FAQ de precio) + gemela `/ca/contes/regal-nadal-nen-3-anys` con hreflang cruzado; enlaces desde la portada |
| 1.9 | Páginas de ideas sin migas de pan. | P2 | ✅ visibles + `BreadcrumbList` |
| 1.10 | Search Console sin verificar (falta `GOOGLE_SITE_VERIFICATION`) ni sitemap enviado. | P0 | **Pendiente (Moisés)** |
| 1.11 | Sin enlaces externos: Pinterest (búsquedas de regalo), cuentas de crianza, directorios catalanes. | P1 | Pendiente (marketing) |

Mapa de búsquedas → página (amplía `marketing/SEO.md`):

| Búsqueda | Página |
|---|---|
| cuento personalizado para niños / con nombre | `/` (título nuevo) y `/cuentos/cuento-personalizado-con-nombre` |
| regalo Navidad niño 3 años | `/cuentos/regalo-original-nino-3-anos` (reescrita) |
| regalos navidad niños 3 a 6 años | `/cuentos/regalos-navidad-ninos-3-a-6-anos-no-juguetes` |
| conte personalitzat | `/ca` (título nuevo) y `/ca/contes/conte-personalitzat-amb-nom` |
| regal Nadal nen 3 anys | `/ca/contes/regal-nadal-nen-3-anys` (nueva) |
| regal tió / Reis | `/ca/contes/regal-tio-de-nadal`, `/ca/contes/regal-reis-conte-personalitzat` |

### 1b. Datos estructurados de producto (Search Console, 2/11)
Search Console avisó (no crítico) de que faltaban `hasMerchantReturnPolicy`, `shippingDetails` y `deliveryTime` en las
ofertas, y `review`/`aggregateRating` en el producto. ✅ Las ofertas de la portada y de las páginas de ideas salen ahora de
`src/lib/schema-ofertas.ts`: tapa dura con envío incluido a ES (0 €), 5 a 7 días laborables según las condiciones de
venta (reparto fabricación 1–2 + tránsito 4–5 en `es-ES.json` → `entregaTapaDura`, a confirmar con el primer pedido real
a Gelato) y sin envío a Canarias, Ceuta ni Melilla (`doesNotShip` con prefijos de CP 35/38/51/52); PDF con entrega
digital (0 € y 0 días); política de devolución `MerchantReturnNotPermitted` en ES (producto personalizado, sin
desistimiento, art. 103.c y 103.m) con enlace a las condiciones. **`review` y `aggregateRating` no se añaden a propósito:**
no hay opiniones reales y Google prohíbe inventarlas. Se añadirán cuando haya reseñas reales de familias (pendiente 6).

## 2. Conversión (portada → crear → vista previa → pago)

Flujo probado de punta a punta en local (es y ca, 390 px): personalizador de la portada → `/crear` con nombre,
género y ciudad ya puestos → 4 pasos → vista previa → elección de formato → pago simulado. Sin errores de JavaScript
(los únicos 404 son del guion de Vercel Analytics, que solo existe en Vercel).

| # | Hallazgo | Prioridad | Estado |
|---|---|---|---|
| 2.1 | En móvil el titular quedaba **debajo** del libro y el formulario: la primera pantalla no decía qué se vende. | P0 | ✅ titular arriba, libro y formulario debajo; en escritorio no cambia |
| 2.2 | El botón «Crear cuento» de la cabecera se partía en dos líneas en móvil; a 360 px la cabecera desbordaba 5–24 px. | P1 | ✅ |
| 2.3 | **La vista previa enseña huecos con un avatar en vez de ilustraciones** en 14 de las 16 combinaciones (colección × edad × niño/niña): solo hay biblioteca para «Dormir 2–4 niño» y «Mi ciudad 5–8 niña». Si alguien pulsa «Niña» en la portada y pone 3 años, no ve ninguna ilustración. Es el punto donde más ventas se pierden. | **P0** | ✅ 56 ilustraciones en `public/biblioteca/` (commit edbdd28); el creador enseña además la portada de cada combinación en vivo |
| 2.4 | En la caja de pago no se veía la fecha límite de Navidad. | P1 | ✅ aviso «Para Navidad: pide la tapa dura hasta el 14 de diciembre…» (cambia solo a Reyes y desaparece después) |
| 2.5 | Las páginas de ideas (entrada desde Google) eran texto plano con un botón: sin aviso de campaña, sin muestra, sin barra fija en móvil. | P0 | ✅ cabecera nocturna con titular, botón y precio; tres páginas reales del cuento de muestra; cierre «listo para regalar» con fechas y garantía; barra fija en móvil |
| 2.6 | Recordatorio de carrito: existe (casilla opcional). Falta medir cuántos lo marcan. | P2 | Pendiente con analítica |

## 3. Confianza

| # | Hallazgo | Prioridad | Estado |
|---|---|---|---|
| 3.1 | Muestras reales: dos cuentos enteros, página a página. Bien. | — | — |
| 3.2 | Contradicción: la FAQ y dos páginas de ideas decían «elegís entre nuestros dos protagonistas fijos… estamos trabajando en más», mientras la portada y el formulario ya dejan diseñar piel, pelo, peinado, gafas, pecas y color. | P0 | ✅ corregido en es y ca |
| 3.3 | El sello decía «Cancela en un clic», que no aplica a una compra única (no hay nada que cancelar). | P1 | ✅ «Ves antes de pagar» en la web y «Sin suscripción» en los correos; `marcas/tokens.json` sigue con el sello común |
| 3.4 | Correo de contacto `hola@numimates.com` en una tienda llamada Lunilla, y `lunilla.cat` sin registros MX. Quien compra un regalo lo nota. | P1 | **Pendiente (Moisés)**: buzón `hola@lunilla.cat` (reenvío gratuito con ImprovMX o Cloudflare Email Routing) y cambiar `legal.email` en `src/config/paises/es-ES.json` |
| 3.5 | Plazos de la tapa dura: 14/12 Navidad y 28/12 Reyes en portada, páginas de ideas y pago; FAQ «5 a 7 días laborables». Coherente con Gelato. | — | Revisar con un pedido real de prueba antes del 15/11 |
| 3.6 | Garantía «te lo rehacemos gratis una vez» y reimpresión por defecto: visibles en portada, páginas de ideas y pago. | — | — |
| 3.7 | No hay opiniones de clientes. No se inventan: pedir una frase y permiso a las primeras 5 familias y mostrarlas con nombre de pila y ciudad. | P1 | Pendiente (tras las primeras ventas) |

## 4. Velocidad, móvil y accesibilidad

- HTML de la portada en 0,2 s (estático en Vercel); imágenes en WebP servidas por `next/image` (portada ≈ 50 kB a 828 px).
  JS compartido 103 kB. Sin problemas de velocidad que frenen ventas.
- Sin desbordamiento horizontal en 360, 390 y 1366 px en portada, índice de ideas, páginas de ideas y `/crear` (es y ca).
- Un solo `h1` por página, todas las imágenes con `alt` (decorativas con `alt=""`), foco visible en botones.
- ✅ Las opciones de formato en el pago (radios ocultos) no mostraban el foco con teclado: ahora sí.
- ✅ El aviso de fechas del pago tiene color fijo para que no pierda contraste en modo oscuro.
- P2: el carrusel «Por dentro» depende del desplazamiento horizontal; tiene flechas, pero conviene `aria-roledescription` y anunciar la página actual.

## 5. Marca

Lunilla es de las marcas más cuidadas de la cartera: paleta y tipografías de `MARCAS.md`, la luna con bufanda en
cabecera, portadas y cierre, voz tierna y sin azúcar. Cambios de esta revisión para que se sienta un regalo premium:
cabeceras nocturnas en las páginas de ideas (el «cielo» de la portada), la ilustración ligeramente girada como un libro
sobre la mesa, viñetas con la luna amarilla en el texto largo y un cierre de regalo con Lunilla. Sin cifras ni
testimonios inventados.

### 5b. Rediseño visual del 1/11 («La hora del cuento»)
La web pasa a ser una noche pintada a la gouache que se convierte en papel de libro: portada con una ilustración a sangre
(una niña y un niño leen su cuento bajo la luna, con Lunilla), estrellas que parpadean y deriva suave al hacer scroll
(solo con `prefers-reduced-motion: no-preference`), títulos en Young Serif (OFL, autoalojada) con Nunito para el texto
(Baloo 2 queda en el logotipo y el PDF), un único acento cálido (el amarillo de Lunilla), colecciones en mosaico con
escenas propias, maquetas ilustrativas de tapa dura y PDF en el precio y en la caja de pago, escena de Navidad en las
fechas y en las páginas de regalo, creador con portada de biblioteca en vivo y pasos como fases de la luna, y pie
nocturno. Sin cambios de textos legales, precios, fechas ni lógica de pedido o pago. Arreglado de paso: la marca de agua
de la vista previa chocaba con el borde curvo de las páginas (salía una franja blanca) y el botón «Comprar» de móvil se
veía también en escritorio.

## 6. Analítica

`@vercel/analytics` está en el código (`<Analytics />` en el layout). Hasta esta revisión `/_vercel/insights/script.js`
devolvía 404 en producción: Web Analytics se activó en el proyecto `lunilla` el 1/11 pero no se había vuelto a
desplegar. ✅ Tras el despliegue `dpl_5oLuEXLZyBecUF6gVd4zq8KgZtqU` el guion responde 200 y ya se mide. Mirar cada
lunes: visitas a páginas de ideas, clics a `/crear`, vistas previas creadas y pagos (estos dos ya están en `/admin`).

## 7. Pendientes ordenados

1. **P0** Search Console: `GOOGLE_SITE_VERIFICATION` en Vercel, enviar `https://lunilla.cat/sitemap.xml` y pedir indexación de `/`, `/ca` y las 6 páginas de Navidad (Moisés).
2. ✅ Biblioteca de vista previa completa (16 combinaciones).
3. **P1** Buzón `hola@lunilla.cat` y cambio de `legal.email`.
4. **P1** Pedido real de tapa dura a Gelato (no borrador) para comprobar plazo y calidad, y fotografiar el libro real en lugar de las imágenes ilustrativas.
5. **P1** Afiliadas: escribir a 20 cuentas de crianza catalanas y españolas antes del 15/11 (el programa del 20 % ya funciona).
6. **P2** Opiniones reales de las primeras familias; carrusel accesible.
