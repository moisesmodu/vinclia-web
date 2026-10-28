# Marketing orgánico · Aprova (proyecto M)

Todo preparado, **nada publicado** (SESIONES.md, regla 1). Escenario S1 de VIABILIDAD: orgánico desde el día 1; anuncios de búsqueda de
100 €/mes solo desde el mes 2 y con aprobación mensual de Moisés.

## 1. Hecho en esta sesión
| Pieza | Dónde | Estado |
|---|---|---|
| **30 páginas SEO** en catalán y castellano (una por examen, por cuerpo y nivel, guías de errores, calendario e inscripción) | `contenido/seo/*.json` → `/ca/guia/<slug>` y `/es/guia/<slug>`, índice en `/ca/guia`, sitemap con `hreflang`, FAQ con datos estructurados | publicadas en https://aprova-catala.vercel.app/ca/guia |
| **Calendario de convocatorias 2027** con alerta por correo (DPL, universidades CIFALC, EOI) | `/ca/convocatories` (`config/convocatories.json`, tabla `Alerta`); la tarea semanal verifica fechas y envía los avisos | publicado; alertas a la espera de la resolución oficial |
| **10 guiones de vídeo corto** en catalán (error típico → por qué → forma correcta → diagnóstico) | `marketing/videos.md` | listos para grabar (voz: ElevenLabs solo en demo; Higgsfield para vídeo) |
| **Ficha de Google Play** (ca, es, en) con textos de capturas, palabras clave y declaración de IA | `marketing/google-play.md`; iconos en `public/icons/` (512 y maskable) | lista; la TWA se empaqueta en la sesión 2 (Android) |
| **Campaña de búsqueda** «Aprova · Cerca · Català», 100 €/mes, 3 grupos (C1 oposiciones, B2, sanidad), 45 palabras clave, 6 anuncios responsivos, 59 negativas | `marketing/google-ads/` (`CAMPANYA.md`, `palabras-clave.csv`, `anuncios.csv`, `negativas.csv`), importable en Google Ads Editor | **preparada, en pausa, sin activar** |
| **20 comunidades** donde publicar, qué y cuándo, y borrador de correo a academias de Lleida y CNL para la prueba de validez | `marketing/comunitats.md` | nada se publica sin aprobación |

Palabras clave objetivo (ca/es): «examen C1 català 2027 model», «nivell B2 català prova», «qué nivel de catalán piden las oposiciones»,
«català ICS infermeria C1», «català Mossos prova», «C2 català docents», «calendari convocatòries català 2027», «inscripció DPL gener 2027»,
«on treure el C1 Lleida», «pronoms febles en hi», «per i per a», «castellanismes examen».

## 2. Calendario de contenido (lo ejecuta la tarea semanal, Moisés aprueba lo que sale fuera)
- **Semanas 1–4 (noviembre):** indexación de las 30 páginas (Search Console cuando haya dominio o con `.vercel.app`), 2 vídeos/semana grabados y
  listos, primer contacto con academias y CNL de Lleida (prueba de validez).
- **Diciembre–enero:** pico de búsqueda por la inscripción de la DPL (20–28 de enero): páginas de inscripción y calendario actualizadas con la
  resolución oficial, alertas por correo, publicación en comunidades de opositores (con aprobación).
- **Febrero–mayo:** páginas por convocatoria universitaria (13/2, 12/6), «com aprovar el C1 en 3 mesos», simulacros gratuitos como gancho.
- **Mes 2:** decisión de Moisés sobre los anuncios (100 €/mes); parar cualquier grupo que supere 25 € por cliente al tercer mes.

## 3. Afiliados y B2B (sesión 3)
Profesores de catalán y academias: código de descuento y 20 % por alta anual (Rewardful o propio). Hospitales, ICS, colegios profesionales,
academias de oposiciones y ayuntamientos (Lleida primero): licencias de 4–6 € por asiento con panel de grupo.
