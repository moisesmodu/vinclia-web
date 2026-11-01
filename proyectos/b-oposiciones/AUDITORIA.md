# Auditoría · B · Oposita (oposita.digital) · 01/11/2026

Objetivo de la cartera: 3.000 €/mes entre todos los proyectos en 6 meses. Para B eso significa unos 300–400 €/mes
(30–40 suscriptores de 9,99 €) en mayo de 2027. El cuello de botella no es el producto (está completo y cobra con Stripe
real): es **tráfico orgánico** y **medir el embudo**. Esta auditoría ordena los hallazgos por impacto en ese objetivo.

Leyenda: ✅ arreglado en este cambio · 🔧 pendiente (con quién y cómo).

## 1. Resumen
| Área | Estado antes | Después | Prioridad restante |
|---|---|---|---|
| Marca | «Plaça» en la web, «Oposita» en el dominio y en Stripe: tres nombres para un producto | Una sola marca, **Oposita**, en web, logo, iconos, correos, Stripe y metadatos | — |
| SEO por oposición | Bien: título con año y nº de preguntas, FAQPage, breadcrumbs, 220 páginas de tema | + imagen social, siteName; portada con Organization/WebSite/FAQ | Páginas por convocatoria (🔧) |
| SEO por convocatoria | Una sola página-lista (35 procesos) sin URL propia por proceso | Igual | **Alta** (🔧, ver §3) |
| Conversión gratis → pago | Oferta tras el test (bien); precio fijo «9,99» en código; sin bloque de pago en la página de oposición | Precio desde la configuración, bloque de pago en la oposición, CTA fijo en móvil, plan correcto en el registro | Prueba de 7 días (🔧) |
| Confianza | Sin muestra visible de cómo es una pregunta antes de entrar | Pregunta real del banco con la cita literal en la portada, cifras reales, FAQ honesta («no son exámenes oficiales») | Opiniones reales (🔧, cuando existan) |
| Velocidad | Estático (SSG), 103 kB JS compartido, TTFB ~0,15–0,35 s | Igual (sin dependencias nuevas) | — |
| Móvil | Sin desbordes; botones de 44 px | CTA fijo abajo en oposición y tema; plan anual primero en móvil | — |
| Accesibilidad | Sin enlace «ir al contenido», sin foco visible propio, estados de botones sin ARIA | ✅ (ver §6) | Página 404 propia (🔧) |
| Analítica | `<Analytics />` montado pero el script daba 404 (Web Analytics se activó en Vercel después del último despliegue) y ningún evento de embudo | Redesplegado: el script responde 200; eventos de embudo instrumentados | Comprobar que los eventos se guardan (🔧) |

## 2. Marca
**Decisión:** «Oposita» como marca paraguas. Motivos: coincide con el dominio comprado (oposita.digital), ya era el nombre
de los productos y del Checkout en Stripe (`MARCA_PAGO`), se entiende en catalán y en castellano y no ata el producto a
Cataluña, así que sirve tal cual para añadir oposiciones estatales (AGE, Correos, Justicia, policías locales de otras CCAA).
El contenido sigue siendo catalán primero: lo que diferencia el producto es el catalán, no el nombre.

- ✅ `config/marca.json`: nombre «Oposita», lema «Tests d'oposicions amb la llei al costat» / «Tests de oposiciones con la
  ley al lado» (la promesa real del producto: cada respuesta con el artículo). «Treu plaça…» se queda como titular de portada.
- ✅ Logotipo nuevo: «oposita» en minúscula (como el dominio) y la O como casilla de respuesta marcada (anillo blanco y punto
  verde sobre el índigo de la familia Exámenes). `public/marca/*.svg`, `app/icon.svg`, PNG de PWA/Play regenerados,
  `marcas/logos/b-oposiciones*.svg`, `marcas/tokens.json` y `MARCAS.md`.
- ✅ Correos (recuperar contraseña y pago a medias) firmados «Oposita · oposita.digital» y con «d'Oposita» bien apostrofado
  (antes «d'Plaça»).
- ✅ Imagen social 1200×630 generada en el build con la marca y las cifras reales del banco.
- 🔧 Variable `CORREO_REMITENTE` en Vercel: si tiene «Plaça <…>», cambiarla a `Oposita <noreply@numimates.com>`.
- 🔧 Nombre del proyecto en Vercel (`placa-oposicions`) y ficha de Google Play (`android/`): renombrar cuando se publique.
- Las claves de `localStorage` siguen siendo `placa:*` a propósito: cambiarlas borraría el progreso de quien ya practica.

## 3. SEO
**Bien hecho:** URL por oposición y por tema (≈ 230 por idioma), hreflang ca/es con x-default, sitemap con fechas,
canónicas, FAQPage y BreadcrumbList, títulos con año y número de preguntas, robots que excluye cuenta/práctica.

- ✅ Portada: JSON-LD `Organization` + `WebSite` + `FAQPage`; `og:title`/`og:description` propios.
- ✅ `og:image` y `twitter:card=summary_large_image` en todas las páginas (antes ninguna tenía imagen al compartir en
  WhatsApp o Telegram, que es por donde se mueven los grupos de opositores).
- ✅ Precios: meta description (no tenía) y FAQPage.
- 🔧 **Alta · una URL por convocatoria** (`/ca/convocatorias/<id>`): «oposicions mossos 2027 places», «convocatòria auxiliar
  administratiu ajuntament de X» son búsquedas con intención y poca competencia. Los 35 procesos de
  `contenido/convocatorias.json` ya tienen datos para una página cada uno (plazas, plazos, examen, fuente) con `Event` o
  `ItemList` y enlace al test. Hacerlo solo con datos verificados en el diario oficial.
- 🔧 **Alta · ayuntamientos concretos:** el temario común de auxiliar sirve para decenas de ayuntamientos. Una página por
  ayuntamiento con convocatoria abierta (Lleida, Girona, Tarragona, Reus, Sabadell, Terrassa…) que reutilice el banco.
- 🔧 Media · blog: 1 artículo. Ritmo recomendado: 2 por semana sobre fechas y formato de examen (lo que se busca).
- 🔧 Media · `/` redirige 307 según `Accept-Language` (Googlebot recibe `/es`) mientras x-default apunta a `/ca`.
  Aceptable; si Search Console muestra problemas de canónica, servir `/ca` en `/` sin redirección.
- 🔧 Search Console: enviar `sitemap.xml` de oposita.digital y revisar cobertura a los 14 días.

## 4. Conversión (test gratis → suscripción)
Embudo: página de oposición/tema → «Fes un test gratis» → 10 preguntas → resultado con oferta → registro → Stripe.
Es corto y está bien pensado (dos pantallas entre «lo quiero» y «pagado»).

- ✅ Precio de la oferta leído de `config/paises/es.json` (antes «9,99» escrito a mano en el componente).
- ✅ El aviso del registro decía «9,99 €/mes» aunque se hubiera elegido el plan anual; ahora muestra el plan elegido.
- ✅ Bloque de suscripción en cada página de oposición con lo que desbloquea (nº de preguntas, simulacro con su formato)
  y el precio con IVA; CTA fijo en móvil en oposición y tema.
- ✅ Enlace a los planes trimestral y anual desde la oferta del resultado (antes solo mensual).
- ✅ Precios: ahorro calculado (20 % trimestral, 40 % anual), plan anual primero en móvil, FAQ (qué incluye, cancelar,
  pago, probar antes) y bloque «gratis» con enlace a empezar.
- 🔧 **Prueba de 7 días** en el plan anual (Stripe `trial_period_days`): suele subir la conversión a pago en suscripciones
  de estudio. Requiere cambiar Checkout en Stripe; no se ha tocado (instrucción: no cambiar Stripe).
- 🔧 Guardar el progreso del test gratis al registrarse ya se hace (fusiona local y servidor); decirlo en el registro
  («no pierdes lo que has hecho») cuando haya datos de abandono en ese paso.

## 5. Confianza
- ✅ Portada con una **pregunta real** del banco (Mossos, tema 3) con la respuesta, el artículo enlazado al BOE y la cita
  literal: enseña el producto sin pedir nada.
- ✅ Cifras reales calculadas del banco (1.737 preguntas, 1.330 con cita literal comprobada, 5 oposiciones, 110 temas).
- ✅ FAQ honesta: las preguntas no son de exámenes oficiales; están generadas con IA y comprobadas contra la fuente.
- ✅ Enlace a la fe de erratas pública desde la portada.
- 🔧 Opiniones: **ninguna inventada**. Cuando haya suscriptores, pedir una frase con nombre y oposición tras el primer
  simulacro aprobado.
- 🔧 «Quién hay detrás»: una línea con el titular (Moisés Mora, Lleida) en la portada aumentaría la confianza; está en el
  aviso legal.

## 6. Accesibilidad (WCAG 2.2 AA)
- ✅ Enlace «Ves al contingut / Ir al contenido» y `main#contenido`.
- ✅ Foco visible propio (`:focus-visible`, 3 px índigo) en toda la web.
- ✅ Test: opciones con `aria-pressed`, corrección en región `aria-live`, botón de idioma con etiqueta y `lang`, mapa del
  simulacro con `aria-label` y `aria-current`; selector 10/20/30 con `aria-pressed`; estado de carga con `role=status`.
- ✅ Registro: pestañas crear/entrar con `aria-pressed`, errores con `role=alert`.
- ✅ `prefers-reduced-motion` respetado; `text-wrap: balance` en titulares.
- ✅ Las clases de componentes (`.boton`, `.tarjeta`…) pasan a `@layer components`: antes las utilidades que intentaban
  ajustarlas (`p-4`, `min-h-9`) no tenían efecto en Tailwind 4.
- 🔧 Página 404 propia con enlaces a las oposiciones (requiere layout raíz; hoy sale la 404 por defecto de Next).

## 7. Velocidad
Todo estático (SSG) salvo API; 103 kB de JS compartido; fuentes autoalojadas (`@fontsource`, 3 archivos). Sin cambios de
peso en este trabajo: no se añadieron dependencias. 🔧 Medir Core Web Vitals reales cuando Web Analytics/Speed Insights
estén activos.

## 8. Analítica
- ✅ Web Analytics: estaba activado en el proyecto `placa-oposicions`, pero el despliegue en producción era anterior y
  `/_vercel/insights/script.js` respondía 404, así que **no se medía nada**. Tras el redespliegue del 01/11 responde 200.
- ✅ Eventos de embudo (`lib/evento.ts`): `test_inicio`, `test_fin`, `oferta_clic`, `plan_clic`, `registro_ok`/`entrar_ok`,
  `checkout_ir`, con oposición y plan. Los eventos personalizados solo se guardan en planes de Vercel que los incluyen;
  si el plan no los guarda, las llamadas no hacen nada y no rompen nada.
- 🔧 Revisar cada lunes (tarea programada) visitas por oposición → `test_inicio` → `test_fin` → `checkout_ir` → altas en
  Stripe, y anotarlo en `MONETIZACION.md`.

## 9. Crecimiento a oposiciones nacionales (siguiente paso)
El motor ya admite una oposición nueva con `oposicion.json` + PDF. Orden recomendado por volumen de búsqueda y temario
mayoritariamente legal (lo que el motor verifica mejor): Auxiliar Administrativo del Estado (AGE), Administrativo del
Estado, Tramitación Procesal (Justicia), Policía Local de Cataluña (enlaza con lo catalán), Correos (temario no legal:
solo segunda pasada). Para no diluir lo catalán: secciones `/es/estado/...` y mantener `/ca` como portada principal.

## 10. Verificación de este cambio
- `npm run check` (tsc) y `npm run build` sin `DATABASE_URL`: OK.
- Playwright (Chromium headless) en móvil 390×844 y escritorio 1280×900: portada → Mossos → test gratis de 10 preguntas →
  resultado con oferta → precios. Sin errores de consola (salvo el script de analítica, que en local no existe) y sin
  desbordamiento horizontal.
