# Marketing orgánico · CCSE en tu idioma

Según VIABILIDAD.md, el margen es de 8,5 € por cliente y el CAC con anuncios de 20–30 €. **No se ponen anuncios.** Todo el crecimiento viene de Google, Google Play, vídeo corto y comunidades. Objetivo de JUICIO.md: 50 ventas o 300 €/mes con la conversión medida. Se para si a los 3 meses de publicar hay menos de 20 ventas con más de 2.000 visitas al mes.

## 1. SEO: hecho y desplegable con el código
| Pieza | Cantidad | Dónde |
|---|---|---|
| Páginas de tema ("test CCSE tarea N") | 5 | `content/guias/es/test-ccse-tarea-*.md` → `/es/guia/...` |
| Páginas "test CCSE gratis", una por idioma | 7 (es, ar, fr, en, ro, zh, uk) | `content/guias/<l>/...` |
| Guías extra (simulacro, verdadero/falso, fechas 2027, resumen del manual, nota, prueba adaptada, exentos, DELE A2 vs CCSE) | 8 | `content/guias/es/` |
| **Total de páginas SEO** | **20** | |
| "Cómo es el examen" (fechas, 85 €, inscripción) | 8 idiomas | `/<l>/examen` |
| Una página por pregunta oficial ("¿Cuántos diputados…?"), con datos estructurados `Quiz` | 300 | `/es/preguntas/<id>` |
| Páginas de test por tema, indexables | 40 (8 idiomas × 5) | `/<l>/temas/<n>` |

Técnico: sitemap con `hreflang`, `robots.txt`, canonical, FAQPage y WebApplication en la portada, Article en el examen y Quiz en cada pregunta. El HTML es estático y rápido, y no hay cookies de seguimiento.

Siguiente paso de SEO (lo hace la tarea programada): dar de alta el dominio en Google Search Console y enviar el sitemap. Tiene que hacerlo Moisés con su cuenta de Google, y está en PARA-MOISES.md. Después, publicar cada mes la página "Examen CCSE [mes] [año]: fechas y resultados", que es la búsqueda que hoy se llevan los despachos.

## 2. Google Play (ASO): fichas listas en 7 idiomas
`marketing/google-play/<l>.md` (es-ES, ar, fr-FR, en-GB, ro, zh-CN, uk) tiene el título (≤ 30), la descripción breve (≤ 80), la descripción completa (2.500–3.100 de 4.000), las novedades, los textos de las 5 capturas y 10 palabras clave. Todas las longitudes están medidas. Cada ficha declara que las explicaciones están hechas con IA y revisadas, y que la app no es oficial del Instituto Cervantes.
- Icono de 512: `public/icons/icon-512.png`. Capturas de móvil: las genera `pruebas/e2e-movil.mjs`, que guarda 7 pantallas reales en `pruebas/capturas/`.
- Recomendación: pedir la valoración en la app después de un simulacro APTO. Es el plan del líder para superar a la app oficial (4,4).

## 3. Vídeo corto: 10 guiones listos
`marketing/videos.md` tiene 3 guiones en español, 2 en árabe y 1 en francés, rumano, inglés, chino y ucraniano. Seis usan el formato "¿Sabrías responder esta pregunta del examen?" con una pregunta oficial real (se cita su número). Uno trata de las fechas y el precio, y otro de "qué hacer después de aprobar", que es el gancho del proyecto N. Cada guion lleva gancho, planos con tiempos, CTA, hashtags y una nota de producción (voz de ElevenLabs o avatar de Higgsfield). **No se ha generado ningún vídeo ni se ha gastado ningún crédito.** Se producen cuando Moisés apruebe la primera tanda y abra las cuentas de TikTok, Instagram y YouTube de la marca.

## 4. Comunidades: lista sin publicar nada
`marketing/comunidades.md` recoge 32 comunidades y canales (grupos de inmigrantes por nacionalidad, r/GoingToSpain, ONG como Accem, CEAR, Cruz Roja, Cáritas o Red Acoge, academias, centros examinadores, Parainmigrantes…). De cada uno dice qué publicar y sus normas. **Nada se publica sin la aprobación de Moisés** (regla 1).

## 5. Afiliados: código hecho
- Cualquier enlace con `?ref=codigo` guarda el código durante 60 días, y el pago lo registra en Stripe (`metadata.afiliado`). Checkout acepta además códigos promocionales de Stripe.
- La propuesta es una comisión del 30 % (≈ 3 €) para academias, ONG y creadores. Hay 3 plantillas de contacto en `marketing/comunidades.md`, pendientes de aprobación.
- Decisiones para Moisés, sin bloquear nada: si el 30 % se calcula sobre el bruto o el neto, si el código hace descuento al comprador y cuántos accesos gratis se dan a las ONG.

## 6. Calendario de las primeras 8 semanas (tras desplegar)
| Semana | Qué |
|---|---|
| 1 | Search Console y sitemap; ficha de Play enviada a revisión; primeros 3 vídeos (es, ar, ro) |
| 2–3 | 2 vídeos por semana; aportar valor en 5 comunidades con respuestas útiles; página "Examen CCSE noviembre 2026: resultados" |
| 4 | Contacto con 10 academias y ONG (plantillas aprobadas); medir la conversión visitante → pago |
| 5–8 | Ajustar las fichas de Play con datos; 3 guías nuevas al mes; decidir si se abre un segundo idioma de vídeo fuerte |
