# Auditoría SEO, AdSense y front end · NetoClaro e ImpuestoClaro (01/11/2026)

Sitios: https://netoclaro.app (`SITIO=nomina`, 754 páginas es/ca) e https://impuestoclaro.es (`SITIO=impuestos`, 332
páginas). AdSense en revisión con `ca-pub-1805394669180486`. Medido en vivo con curl y Playwright (390 px), Lighthouse
móvil sobre 28 páginas de muestra y `npm run comprobar` sobre la compilación.

## Resumen

La base técnica es muy buena: HTML estático, Lighthouse móvil 100/100/100/100 en todas las páginas de muestra (LCP
1,1–1,5 s, CLS 0, TBT 0), canónica y `hreflang` es/ca/x-default correctas, sitemap con alternativas, `ads.txt` y la
metaetiqueta `google-adsense-account` en su sitio, autor, fuentes oficiales y fecha en cada calculadora. Los puntos
débiles estaban en **qué búsqueda ataca cada título**, en **señales de frescura falsas**, en **detalles legales que
contradicen lo que hace el sitio con AdSense activo** y en **la primera pantalla del móvil**.

| # | Hallazgo | Gravedad | Estado |
|---|---|---|---|
| 1 | Las calculadoras con selector de año se titulaban «… 2027» (año provisional). En noviembre y diciembre la búsqueda grande es «… 2026» («sueldo neto 2026», «IRPF 2026», «paro 2026»), y la página ya calcula los dos años | Alta | Corregido: 68 títulos y sus H1 «2026 y 2027» (es/ca) |
| 2 | `*.vercel.app` servía el sitio completo con 200 (contenido duplicado; solo lo mitigaba la canónica) | Alta | Corregido: 308 a netoclaro.app / impuestoclaro.es en `vercel.json` |
| 3 | La portada decía «Sin registro ni cookies de seguimiento» con AdSense activo (Google usa cookies con consentimiento): afirmación falsa ante el revisor de AdSense | Alta | Corregido: con anuncios dice «Gratis, sin registro y en tu navegador» |
| 4 | Privacidad y cookies decían «usamos Umami», pero el sitio carga Vercel Web Analytics (Umami sin ID) | Alta (RGPD/AdSense) | Corregido: el texto describe la analítica que de verdad se carga |
| 5 | Sin página de **Contacto** (solo un correo dentro de «Quiénes somos»). Los revisores de AdSense la buscan en el pie | Media | Corregido: `/contacto/` y `/ca/contacte/` en el pie y el sitemap |
| 6 | `dateModified`, «Actualizado el» y `lastmod` del sitemap eran la **fecha de compilación**: cada despliegue «actualizaba» 1.000 páginas sin cambios. Google ignora el `lastmod` de los sitios que hacen esto | Media | Corregido: fecha de revisión de datos (`sitio.json → revisado`) y la de cada texto |
| 7 | Enlazado entre las dos webs: solo el pie «Familia Claro» a la portada. Ningún enlace contextual de sueldo neto → IRPF de la renta ni al revés | Media | Corregido: bloque «Sigue en la familia Claro» en 15 calculadoras (`sitio.json → enlacesFamilia`) |
| 8 | Metadescripciones de las páginas por salario con decimal inglés («Retención del 16.41 %») | Baja | Corregido: «16,41 %» |
| 9 | En una misma tabla convivían «1956,00 €» y «23.121,00 €» (Intl es-ES no agrupa cuatro cifras) | Baja (UX) | Corregido: importes siempre con punto de miles |
| 10 | Móvil: la calculadora empezaba a ~700 px (icono grande, cuatro «chips» y un aviso de cinco líneas) | Media (UX) | Corregido: el formulario asoma en la primera pantalla (ver abajo) |
| 11 | `familia.json` y `sitio.json` con *.vercel.app / netoclaro.es | — | Ya estaba bien en la rama (933681a): netoclaro.app e impuestoclaro.es |

## 1. SEO técnico

- **Core Web Vitals**: 100 en las cuatro categorías de Lighthouse móvil en 28 páginas (calculadoras, fichas, páginas
  por salario y comunidad, calendario, productos). CSS en línea, fuentes propias con `font-display: optional`, AdSense
  diferido hasta la primera interacción o 3 s después de `load`. No hay nada que ganar aquí; vigilar que los bloques de
  anuncio reserven altura cuando haya `ADSENSE_SLOT_*` (CLS).
- **Canónica y dominios**: canónica absoluta al dominio propio en todas las páginas. `www.` redirige con 308. Desde
  este despliegue, también `netoclaro.vercel.app` e `impuestoclaro.vercel.app`.
- **hreflang**: es, ca y x-default (→ es) en `<head>` y en el sitemap; recíprocos. Correcto.
- **Sitemap**: 708 URL (NetoClaro) y 288 (ImpuestoClaro) con alternativas; `robots.txt` lo declara. `lastmod` ya es real.
- **Datos estructurados** (validados a mano contra schema.org):
  - Calculadoras: `WebApplication` (FinanceApplication, `offers` 0 €, autor `Person`, editor, `dateModified`),
    `FAQPage` y `BreadcrumbList`. Válidos.
  - Fichas: `Dataset` con licencia CC BY 4.0 y `DataDownload` CSV (aptos para Google Dataset Search).
  - Páginas por combinación: `WebPage` (ahora con `publisher`), `FAQPage` y `BreadcrumbList`.
  - **HowTo: no se añade.** Google retiró los resultados enriquecidos de HowTo en 2023 y limita los de FAQ a webs
    oficiales y de salud; el marcado FAQ sigue siendo válido y útil para los resúmenes de IA, pero no dará estrellas.
- **Títulos**: 11 títulos pasan de 65 caracteres tras añadir «2026 y»; Google corta por píxeles y la palabra clave va
  delante, así que se deja como aviso.

## 2. Cobertura de búsquedas

| Búsqueda | Página | Comentario |
|---|---|---|
| sueldo neto 2026 / 2027, calculadora sueldo neto | `/calculadora-sueldo-neto/` | Título ya con los dos años |
| sueldo neto 30.000 € (por salario) | `/sueldo-neto-{bruto}-euros-brutos/` (57 por idioma) | Calculadas con 2027 provisional |
| sueldo neto por comunidad | `/sueldo-neto-{ccaa}/` y salario × comunidad (144 por idioma) | Bien |
| paga extra (Navidad 2026) | `/calculadora-paga-extra/` | Guía de Navidad 2026: es su momento |
| calendario laboral 2027 | 46 páginas por comunidad y municipio (por idioma) | **Pico de búsqueda en noviembre-diciembre** |
| IRPF 2026 / tramos IRPF / IRPF por comunidad | `/calculadora-irpf/`, `/irpf-{ccaa}/`, `/irpf-{bruto}-euros-brutos/` | Bien |
| finiquito, despido, paro, baja, autónomos | calculadoras y páginas por tramo/años | Bien |
| **renta 2026 (ejercicio 2025)** | — | **Hueco**: no hay parámetros de 2025 con fuente. Pendiente antes de marzo de 2027 |
| **salario mínimo 2027** | ficha SMI | Cifra provisional hasta el real decreto (enero 2027) |

## 3. E-E-A-T

Bien resuelto: autor con nombre y bio (Moisés Mora, Lleida), página «Quiénes somos y método» con financiación y uso de
IA declarados, fuentes del BOE/AEAT/Seguridad Social enlazadas en cada calculadora, método paso a paso con ejemplo,
fecha de actualización con `<time>`, años provisionales marcados. Mejoras pendientes (no de código): foto del autor y
perfil de LinkedIn en «Quiénes somos», y menciones o enlaces desde gestorías (B2B.md) para la autoridad del dominio.

## 4. Políticas de AdSense

- Contenido suficiente y propio: cada página calcula sus cifras (nada de plantillas vacías); 0 errores en `comprobar`.
- Aviso legal, privacidad, cookies, condiciones de venta y ahora **contacto**, enlazados en el pie de todas las páginas.
- Consentimiento: gtag consent mode v2 en «denied» por defecto y Funding Choices (TCF 2.2). **Pendiente de Moisés**:
  crear y publicar el mensaje de consentimiento RGPD en AdSense → Privacidad y mensajes para los dos dominios; sin él,
  en el EEE solo se sirven anuncios limitados.
- Afirmaciones veraces: corregidas la de «sin cookies de seguimiento» y la de la analítica.
- `ads.txt` correcto en los dos dominios: `google.com, pub-1805394669180486, DIRECT, f08c47fec0942fa0`.

## 5. UX móvil de la calculadora

Antes, en un iPhone de 390 px, la primera pantalla era título, icono de 48 px, cuatro píldoras y un aviso de cinco
líneas; el primer campo aparecía a ~700 px. Ahora: sin icono en el móvil, autor y fecha en una línea de texto, el
enlace «Pon esta calculadora en tu web» (venta B2B) va debajo del resultado, y el aviso de año provisional es una
línea plegable («Cifras de 2027 provisionales; las de 2026, oficiales. Elige el año en la calculadora.»). El selector
de año y el salario quedan en la primera pantalla. La barra fija con el resultado ya existía y se mantiene. Cifras y
símbolos (€, %) ya no se separan al final de línea.

## 6. Pendientes con fecha

1. **Antes del 01/01/2027**: cuando se publique el SMI 2027 y la orden de cotización, actualizar `params/es/2027`,
   quitar `provisional` y, en enero, volver los títulos a «2027» solo (o «2027 y 2026»).
2. **Antes de marzo de 2027**: parámetros del ejercicio 2025 con fuente oficial y página «Renta 2026 (ejercicio 2025)»
   en ImpuestoClaro: es la búsqueda fiscal más grande del año (abril-junio).
3. Moisés: mensaje RGPD en AdSense; Search Console con los dos sitemaps (si no está); foto y LinkedIn del autor.
4. Cuando AdSense apruebe: crear los bloques «bajo-resultado» y «fin-contenido» y poner `ADSENSE_SLOT_*` en Vercel.
5. Redesplegar `chequeclaro` y `hogarclaro`, que también reciben la página de contacto y los textos legales corregidos.
