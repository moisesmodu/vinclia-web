# Auditoría de Tus Papeles (tuspapeles.app) · 01/11/2026

Revisión de SEO, conversión, confianza, velocidad, móvil, accesibilidad, marca y analítica sobre producción
(`https://tuspapeles.app`, despliegue de c643540) y el código de `claude/n-nuevo-en-espana`. Prioridad: **P1** frena
ingresos o indexación, **P2** resta, **P3** detalle. «Hecho» = arreglado en esta sesión.

## Resumen

La base es buena: contenido serio y prudente, fuentes fechadas, 7 idiomas reales, muro sin el contenido de pago en el
HTML, consentimiento de desistimiento bien hecho y garantía de 7 días. Lo que fallaba era de **marca** (la web seguía
diciendo «Nuevo en España» en el logo, títulos, correos y avisos), de **SEO por intención** (títulos de guía que nadie
busca, ninguna página para «cita previa NIE/TIE», catalán duplicando el castellano), de **conversión** (el muro no decía
qué te pierdes, la etiqueta «4,99 €» en cada guía hacía pensar que se paga guía a guía, dos botones de pago con las
casillas lejos) y de **analítica** (el script de Vercel Web Analytics devolvía 404: el proyecto se activó después del
último despliegue, así que no se ha medido nada).

## 1. Marca

| # | Hallazgo | Prioridad | Estado |
|---|---|---|---|
| M1 | Logo, `<title>`, Open Graph, pie, aviso legal, condiciones, manifiesto PWA y los 8 diccionarios decían «Nuevo en España». | P1 | Hecho: «Tus Papeles» en todo (Stripe ya estaba en 0335a6c). Logo nuevo con el mismo arco de puerta: «Tus» en azul noche y «Papeles» en terracota. |
| M2 | Remitente de los correos (`CORREO_REMITENTE` en Vercel) = «Nuevo en España <noreply@numimates.com>». | P1 | Hecho: cambiado a «Tus Papeles <noreply@numimates.com>» (producción y preview). |
| M3 | `config.dominio` = nuevoenespana.app; TWA apuntando a nuevoenespana.app. | P2 | Hecho: tuspapeles.app. `packageId` de la TWA se mantiene (cambiarlo crea otra app en Play). |
| M4 | Sin imagen para compartir (WhatsApp/Telegram es el canal principal de este público). | P2 | Hecho: `opengraph-image` 1200×630 por idioma (texto latino: Padrón · NIE · TIE · Residencia…). |
| M5 | MARCAS.md y `marcas/logos/` del repositorio general siguen con «Nuevo en España» como nombre de N. | P3 | Pendiente (fuera de esta rama; la familia puede seguir llamándose así). |

## 2. SEO

| # | Hallazgo | Prioridad | Estado |
|---|---|---|---|
| S1 | Ninguna página para «cita previa NIE», «cita huellas TIE», «NIE o TIE»: las búsquedas de trámite con más volumen del público. | P1 | Hecho: `/es/preguntas/cita-previa-nie-tie-huellas` (gratis, FAQPage, plazos comprobados en el BOE: 1 mes para la TIE, 3 meses para el registro UE) y primera en «Lo más buscado» de la portada. |
| S2 | Títulos de guía descriptivos, no de búsqueda («Cómo empadronarte en España · Nuevo en España»). | P1 | Hecho: `tituloSeo` y `descripcionSeo` (opcionales, ≤ 60/155) en las 8 guías en castellano: «Empadronamiento en España: cita, documentos y volante», «Renovar la residencia y la TIE: plazos, tasas y cita», etc. |
| S3 | `/ca/guias/*` muestra el castellano con canonical propio: 8 páginas duplicadas que compiten con `/es`. | P1 | Hecho: canonical a `/es/guias/…`, fuera de hreflang y del sitemap. |
| S4 | Sin `x-default` en hreflang; `/precios` y `/preguntas` sin hreflang ni descripción. | P2 | Hecho. |
| S5 | Páginas de pregunta heredaban el `og:title` de la portada; guías sin `og:image`. | P2 | Hecho: Open Graph propio con imagen. |
| S6 | Portada sin datos estructurados de sitio. | P3 | Hecho: `WebSite` + `Organization` (Lleida). Artículos con `author` y `logo`. |
| S7 | `tituloSeo` solo en castellano. En francés, árabe e inglés el título sigue siendo el de la guía. | P2 | Pendiente: escribir los de fr/ar/en con la búsqueda real de cada idioma (p. ej. «rendez-vous NIE», «موعد البصمة»). |
| S8 | Faltan páginas de pregunta de alto volumen: «NIE para ciudadanos de la UE (certificado de registro)», «volante vs certificado de empadronamiento», «cita previa NIE» en fr/ar/en. | P2 | Pendiente (siguiente tanda de contenido; misma plantilla JSON). |
| S9 | Search Console sin verificar (SEO.md). | P1 | Pendiente de Moisés: TXT de DNS o `GOOGLE_SITE_VERIFICATION` y enviar el sitemap. |

## 3. Conversión (gratis → pago)

| # | Hallazgo | Prioridad | Estado |
|---|---|---|---|
| C1 | El muro decía «el resto es para suscriptores» sin concretar. | P1 | Hecho: muestra cuánto trae la guía completa (n.º de pasos, documentos, errores frecuentes y puntos de la lista), el precio y la garantía de devolución. Las cifras salen del propio JSON. |
| C2 | Cada guía de pago tenía la etiqueta «4,99 €»: parece precio por guía. | P1 | Hecho: candado + «Con suscripción». |
| C3 | Precios: tarjeta «gratis» arriba, dos botones «Pagar» y casillas que solo avisaban al pulsar. | P1 | Hecho: un solo flujo (elige plan → casillas → «Pagar con tarjeta · 19,90 €»); pack preseleccionado (es el producto para la renovación), el aviso se quita al marcar. |
| C4 | La garantía de 7 días (condiciones §, coste casi nulo) no se veía en ningún sitio antes de pagar. | P1 | Hecho: en precios y en la banda de precios de la portada, en los 8 idiomas. |
| C5 | Portada: tres tarjetas iguales y CTA secundario como botón fantasma. | P2 | Hecho: vista previa real de la lista de la guía gratis, idiomas visibles con su nombre nativo, «Lo más buscado» enlazando a las páginas SEO, guías en dos columnas, banda de precio con garantía. |
| C6 | No hay captación de correo para quien no paga (recordatorios solo en la guía gratis). | P2 | Pendiente: ofrecer el recordatorio de caducidad de la TIE como imán gratuito (ya existe la tabla y la doble confirmación). |
| C7 | Sin prueba social. | P3 | No se inventa: cuando haya opiniones reales de clientes, añadirlas con permiso. |

## 4. Confianza y contenido legal

- Bien: aviso de «no es asesoramiento» en cada página, fuentes fechadas, datos que no se pudieron confirmar dicen
  «comprueba el importe vigente». La página nueva sigue esa regla (no da importes de la tasa 790-012).
- Pendiente (P2): importes 2026 de las tasas 790-052 y 790-012, DELE A2 y DGT (ya listados en README).

## 5. Velocidad y móvil

- HTML estático (SSG) para todo salvo cuenta y APIs; JS común 103 kB; fuentes propias con `next/font` (árabe y chino
  sin precarga). Portada ≈ 70 kB de HTML. Sin imágenes pesadas: la ilustración de la portada es HTML/CSS.
- Móvil comprobado a 390 px sin desbordamiento horizontal; botones de 48 px; selector de idioma compacto.
- Muro: antes «Cargando…» y salto de diseño; ahora esqueleto con la misma altura.

## 6. Accesibilidad

| # | Hallazgo | Estado |
|---|---|---|
| A1 | Números de paso y del selector con terracota de marca + texto blanco (3,7:1). | Hecho: terracota oscura (AA) y texto oscuro en modo oscuro. |
| A2 | Selector «¿Por dónde empiezo?» con `role=radiogroup` sin flechas de teclado. | Hecho: botones con `aria-pressed`. |
| A3 | Enlace de salto decía «Inicio». | Hecho: «Saltar al contenido» en 8 idiomas. |
| A4 | `a { color: inherit }` fuera de capa anulaba los colores de Tailwind en enlaces. | Hecho: movido a `@layer base`. |
| A5 | Plan de pago con botones sueltos. | Hecho: `fieldset` + `legend` + radios; error con `role=alert`. |

## 7. Analítica

- `@vercel/analytics` estaba montado, pero `/_vercel/insights/script.js` daba **404**: Web Analytics se activó en el
  proyecto después del último despliegue. Se arregla con este despliegue (comprobado en vivo, ver abajo).
- Eventos nuevos (`track`): `muro_ver_precios` (guía, idioma) y `checkout_iniciado` (plan, idioma). Los eventos
  personalizados solo se guardan con plan Pro de Vercel; en Hobby se ignoran sin error. Las visitas y los `utm_*` sí.
- Embudo a mirar cada semana: visitas a guía de pago → `muro_ver_precios` → `checkout_iniciado` → pagos en Stripe.

## 8. Qué cambia en el objetivo de 3.000 €/mes

N aporta en el plan ≈ 50 suscriptores (con A). Con 4,99 €/mes o 19,90 € de pack, cada 100 € de ingreso mensual son
≈ 20 suscriptores o 5 packs al mes. Lo que mueve la aguja aquí es tráfico orgánico a páginas de trámite con intención
(S1, S7, S8), Search Console (S9) y medir el embudo (§7) antes de tocar precios.

## 9. Verificación en producción (01/11/2026)

Despliegue `dpl_Dn4bcvFMrfixz2yBspXFZLwXM42U` (commit 68cf7cb) en tuspapeles.app. Comprobado: títulos y canonical
nuevos, `/ca/guias/*` con canonical a `/es`, sitemap de 112 URL sin guías en catalán, `og:image` en todas las páginas,
`/_vercel/insights/script.js` responde 200 (antes 404), ninguna mención a «Nuevo en España» en el HTML, y el flujo
portada → guía de pago → precios → Checkout con Playwright a 390 px (sin errores de consola).
