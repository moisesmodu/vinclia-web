# Auditoría de la web de Nuvolet Games · 01/11/2026

Alcance: `https://juegos-casuales.vercel.app` (portada del catálogo, 110 páginas SEO y las páginas de los 18 juegos), el generador
`scripts/build.mjs` y la marca (MARCAS.md · Nuvolet Games). Los juegos en sí y `comun/portal.ts` no se tocan. Medido con Chromium
(Pixel 7 y 1366 px), axe-core y curl sobre producción y sobre `dist/` en local.

## 1. Veredicto

La web es un escaparate correcto pero plano: una rejilla de 18 portadas sin texto, sin jerarquía y sin ninguna razón para quedarse,
con buenas bases técnicas (HTML estático, 6 KB de portada, sitemap, canonical, hreflang en la página española). Lo que de verdad
limita los ingresos no es el diseño sino que **la web propia no monetiza** (no lleva anuncios: los SDK solo van en los paquetes de
portal) y que el dominio es `*.vercel.app`. En el objetivo de 3.000 €/mes a 6 meses, los juegos aportan por los portales
(CrazyGames, Poki, GameDistribution, GameMonetize); la web sirve para posicionar la marca, recoger búsquedas de cola larga y,
cuando tenga AdSense for Games, quedarse el 100 % del tráfico directo.

## 2. Hallazgos

| Área | Hallazgo | Gravedad | Estado |
|---|---|---|---|
| Analítica | El script de Vercel Web Analytics daba **404** en todas las páginas: Web Analytics se activó en el proyecto el 01/11 a las 00:58 y el despliegue en producción era anterior. Cero datos y un error de consola por página | Alta | **Cerrado** con el redespliegue |
| Monetización | La web propia no muestra anuncios (README, MONETIZACION.md): cada partida jugada aquí vale 0 € | Alta | Pendiente (Moisés): solicitar **AdSense for Games / H5 Games Ads** para este sitio; el código del juego ya tiene `portal: 'web'` para enchufarlo |
| SEO | Títulos de los juegos sin intención de búsqueda («Egg Truck» a secas) salvo Snow Plow | Alta | **Cerrado**: «<Juego> – Play Free Online, No Download \| Nuvolet Games» cuando no hay `tituloSeo` |
| SEO | Portada con título genérico, sin Open Graph, sin datos estructurados; páginas SEO sin Open Graph | Media | **Cerrado**: OG y tarjeta grande en portada, juegos y las 110 páginas; imagen 1200×630 de marca (`seo/og-home.jpg`); `Organization` + `WebSite` + `ItemList` en portada y `VideoGame` en cada juego (gratis, navegador; sin valoraciones inventadas) |
| SEO | Dominio `*.vercel.app` | Media | Pendiente (Moisés): `nuvolet.games` (MARCAS.md) y Search Console por DNS |
| Conversión | La portada no tenía acción principal, ni texto, ni categorías visibles: 18 portadas iguales | Alta | **Cerrado**: hero con la promesa de la marca, «Play Egg Truck» y «Surprise me» (juego al azar), juego destacado, descripción y tipo en cada tarjeta, filtros por tipo con recuento |
| Marca | Logotipo con la nube azul sobre fondo claro sin presencia; lema solo en el pie; sin la «About» con Lleida en la portada (SEO.md, búsqueda 16) | Media | **Cerrado**: logo en pastilla blanca, «Tiny games, big smiles.» como titular, bloque «Made in Lleida, played everywhere», piezas «de juguete» (borde de tinta y sombra desplazada) con los cinco colores y las dos fuentes de la ficha |
| Velocidad | Las tarjetas cargaban la portada de 800×800 (2,9 MB las 18) | Media | **Cerrado**: miniaturas de 400×400 (≈ 1 MB las 18, las primeras con prioridad y el resto diferidas); `preconnect` a fonts.gstatic con `crossorigin` |
| Accesibilidad | axe: sin `main`, contenido fuera de regiones, `alt` redundante (18 nodos) | Media | **Cerrado**: `header`/`main`, enlace para saltar a los juegos, `alt=""` en portadas acompañadas del nombre, foco visible de 4 px; axe sin infracciones en portada, categorías, About y guía |
| Front | En las páginas de categoría la miniatura se estiraba (atributos de tamaño sin `height:auto`) | Baja | **Cerrado** |
| Móvil | Sin desbordamiento horizontal a 412 px; menú reducido a «About» en pantallas estrechas | — | Bien |
| Confianza | Contacto `hola@numimates.com` (otra marca) | Baja | Pendiente: buzón propio con el dominio |
| Contenido | 9 categorías tienen un solo juego (Egg, Space, Christmas…): páginas delgadas | Baja | Se enlazan como texto, no como filtro; crecerán con el catálogo |

## 3. Qué mover para los ingresos

1. **AdSense for Games en la web propia** (Moisés): es la única forma de que el tráfico de la web cuente.
2. **Portales primero**: CrazyGames y Poki pagan más por partida; la web debe enlazar a sus fichas cuando estén publicadas.
3. **Dominio `nuvolet.games`** y Search Console: las 110 páginas de cola larga («one button games», «games for chromebook») solo
   rinden con un dominio que acumule autoridad.
4. **Snow Plow destacado del 1/12 al 6/1** (cambiar `destacado` en `scripts/build.mjs`): es el único juego con búsqueda estacional.
5. Revisar en Web Analytics, a las dos semanas, qué juegos reciben clics desde la portada y subirlos al destacado.
