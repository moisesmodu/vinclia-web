# Auditoría de CCSE Fácil (ccsefacil.com) · 01/11/2026

Objetivo de la cartera: 3.000 €/mes en 6 meses. A vende un pago único de 9,99 €, así que necesita unas 100 ventas al
mes para aportar ~1.000 €. Casi todo ese tráfico tiene que venir de Google («test CCSE», «examen CCSE preguntas») y la
portada tiene que convertir. Revisado en producción (curl, Playwright y axe-core) y en el código de `claude/a-ccse`.

## Lo que ya estaba bien
- El producto es sólido: 300 preguntas oficiales, explicaciones en 7 idiomas, simulacro real, repaso espaciado y muro de pago en el servidor.
- El embudo existe: test de 5 preguntas en la portada → simulacro gratis → `/precio` con cuenta → Stripe Checkout. Hay barra fija en móvil.
- Confianza: fuente oficial citada en cada página, aviso «web independiente», garantía escrita en las condiciones y aviso de desistimiento (art. 103.m). **No hay testimonios ni cifras inventadas**, y así debe seguir hasta tener reseñas reales.
- Web Analytics de Vercel ya estaba montado (`<Analytics />` en el layout).

## Hallazgos (por prioridad)

| # | Área | Hallazgo | Estado |
|---|---|---|---|
| 1 | SEO técnico | La portada `/es` y casi todas las páginas (simulacro, temas/N, precio, guías…) **no tenían canonical**. Solo unas pocas tenían hreflang, sin `x-default`; el sitemap no daba alternativas para temas/N ni guías. | Arreglado |
| 2 | Marca | La web decía «CCSE en tu idioma» y Stripe, el dominio y el extracto bancario dicen «CCSE Fácil». Quien paga ve dos nombres. | Arreglado: «CCSE Fácil» en título, logotipo, pie, manifest, textos legales, guías y correos |
| 3 | SEO de contenido | El título de la portada era el H1 largo (73 caracteres) y no incluía la marca. Simulacro, temas/N y precio no tenían descripción propia; la de temas/N era «Test CCSE Tarea N» sin más. | Arreglado: títulos y descripciones por idioma orientados a «test CCSE 2026 gratis», «simulacro examen CCSE», «test CCSE por temas» |
| 4 | Datos estructurados | Solo FAQPage y una WebApplication con una oferta sin URL. | Arreglado: WebApplication con oferta gratis y de pago (URL y disponibilidad), Organization y WebSite enlazados por `@id` |
| 5 | Conversión | El precio no se veía hasta la mitad de la portada. En la navegación no había enlace a precio. | Arreglado: sello de precio en el hero («Empieza gratis. Acceso completo: 9,99 €, pago único»), enlace «Precio» en la cabecera y en el pie |
| 6 | Confianza / legal | La garantía decía «si suspendes habiendo usado la app», pero las condiciones exigen 3 simulacros. Una promesa más amplia que la condición es un riesgo de reclamación. | Arreglado en los 8 idiomas («después de hacer al menos 3 simulacros») y enlazada a las condiciones |
| 7 | Velocidad (CWV) | Las fuentes venían de una hoja de Google Fonts que bloqueaba el render (afecta a FCP y LCP). | Arreglado: Outfit y Noto Sans autoalojadas con `next/font` (árabe y chino siguen cargando su Noto solo en esos idiomas) |
| 8 | Accesibilidad | axe: contraste 3,7:1 en la píldora «quedan N días», `aria-label` en un `div` sin rol y tabla desplazable sin foco. No había enlace para saltar al contenido ni página activa en la navegación. | Arreglado: 0 violaciones WCAG A/AA en portada, precio y temas (móvil y escritorio) |
| 9 | Móvil | La navegación se cortaba («Cóm…») sin pista de que se desplaza. | Arreglado: desvanecido lateral y cabecera fija |
| 10 | Analítica | Solo había páginas vistas: no se podía medir el embudo. | Arreglado: eventos `minitest_terminado`, `checkout_iniciado` y `pago_completado` (se ven con Vercel Pro) |

## Pendiente (fuera de código o para más adelante)
1. **Search Console**: enviar `https://ccsefacil.com/sitemap.xml` otra vez y pedir la indexación de `/es`, `/fr`, `/ar` y `/es/simulacro` para que Google lea los canonical nuevos.
2. **Reseñas reales**: pedir valoración tras `pago_completado` y tras un APTO declarado. Solo se publicarán con permiso, y entonces se podrá añadir `aggregateRating`.
3. **Contenido**: guías en ca, y una segunda guía por idioma (fr/ar/ro) para «questions examen CCSE» y «اسئلة امتحان الجنسية الاسبانية», que hoy solo cubre la del test gratis.
4. **Precio**: con datos de conversión (eventos de arriba), probar un acceso de 12 meses frente a los 90 días actuales (la propuesta del análisis inicial, ver README).
5. **Revisión nativa** del árabe y el chino antes de invertir en anuncios en esos idiomas.
6. Las pruebas de API (`pruebas/e2e-api.mjs`) necesitan Postgres local, que no había en esta sesión. No se tocó ninguna ruta de API.
