# Medición: de la visita al euro, por canal y por proyecto

> Si no se mide, no se decide. Cada lunes la tarea semanal rellena la tabla de la sección 4 y el panel. Hoy (31/10) la
> medición de visitas está **incompleta** en A, B y M (sin analítica activa); los pagos sí se miden en todos (Stripe).

## 1. Convención de enlaces (obligatoria en toda pieza)

`?utm_source=<canal>&utm_medium=<tipo>&utm_campaign=<id de pieza en minúsculas>`

| Campo | Valores |
|---|---|
| `utm_source` | `facebook`, `telegram`, `whatsapp`, `reddit`, `forocoches`, `mediavida`, `infoautonomos`, `instagram`, `tiktok`, `youtube`, `pinterest`, `x`, `bluesky`, `itch`, `discord`, `phaser`, `correo`, `a-ccse` (venta cruzada), `search` (solo para pruebas) |
| `utm_medium` | `grupo`, `respuesta`, `post`, `dm`, `correo`, `formulario`, `articulo`, `pin`, `video`, `devlog`, `cruzada` |
| `utm_campaign` | el ID de la pieza: `a-01`, `b-03`, `g-01`… Una pieza, un ID, para siempre |

Además: A usa `?ref=<codigo>` para afiliados (cookie de 60 días, se guarda en Stripe como `metadata.afiliado`); G usa
`/r/<codigo>` para afiliadas (cookie de 30 días con consentimiento). Nunca se mezclan `ref` y `utm_campaign` en el
mismo enlace salvo que la pieza sea de un afiliado.

## 2. Dónde se lee cada cosa

| Proyecto | Visitas y origen | Pasos del embudo | Pagos y clientes | Estado hoy |
|---|---|---|---|---|
| A · CCSE | Vercel Web Analytics (activado en Vercel el 31/10; el código lo carga desde el commit SEO de la rama `claude/a-ccse`, pendiente de redesplegar) | `Usuario.checkoutIniciado` en la base de datos | Stripe, `metadata.proyecto=a-ccse`; `Usuario.recuperacionEnviada` | 🟡 visitas desde el redespliegue |
| N · Nuevo en España | Vercel Web Analytics (código en `claude/n-nuevo-en-espana`, pendiente de redesplegar); Plausible opcional | Eventos `checkout` y `pago`; `/precios?desde=guia-gratis` | Stripe, `metadata.proyecto=n-nuevo-en-espana` | 🟡 visitas desde el redespliegue |
| B · Plaça | Vercel Web Analytics (código en `claude/proyecto-b-oposiciones`, pendiente de redesplegar) | Tests gratis terminados y clics en «Desbloquejar» (base de datos) | Stripe, `metadata.proyecto=b-oposiciones`; bajas | 🟡 visitas desde el redespliegue |
| G · Lunilla | Vercel Web Analytics (sin cookies) | `GET /api/admin/resumen?dias=7`: borradores, vistas previas, checkouts, pagos, recordatorios, afiliadas | Stripe + panel `/admin` | ✅ completo |
| P · Claro | Umami (páginas vistas por calculadora) + Search Console cuando haya dominio | Clics en los bloques de afiliación (`AFILIADO_*`) | AdSense (RPM, ingresos) y paneles de afiliados (Xolo, Qonto, Quipu) | ⚠️ Search Console y AdSense esperan al dominio |
| Juegos · Nuvolet | Panel de desarrollador de CrazyGames, Poki, GameDistribution, GameMonetize; itch.io (vistas, descargas, propinas); Vercel para la web propia | Partidas, minutos medios, retención D1, valoración | Informes mensuales de cada portal (Moisés los deja en `proyectos/juegos/datos/`) | ⚠️ hasta que CrazyGames decida |
| M · Aprova | Vercel Web Analytics (código en `claude/m-catala`, pendiente de redesplegar) | Diagnósticos empezados y acabados (base de datos) | Stripe (modo prueba hasta la validez) | ⏸ tras la validez |

Stripe de toda la cartera: cuenta Numi Mates, filtro por `metadata.proyecto`. El conector de Stripe de la sesión madre
lee sin problema; con eso se rellena la columna «Pagos» de todos los proyectos cada lunes sin pedir nada a nadie.

## 3. Analítica de visitas: hecha en el código, pendiente de redesplegar (31/10)

Vercel Web Analytics (gratuito en Pro, sin cookies, captura `utm_*` y la ruta) está **activado en los 8 proyectos de
Vercel** y la sesión de marketing ha añadido su carga al código de las 7 webs en sus ramas (`@vercel/analytics` en los
layouts de Next.js; el script `/_vercel/insights/script.js` en los HTML estáticos de P y Juegos). Empieza a contar en
cuanto la sesión del Mac redespliegue cada proyecto (comandos en `SEO.md` §4). Hasta entonces, la medición de la
semana 1 se hace con lo que hay: pagos (Stripe), checkouts abiertos (base de datos de A, N y B), vistas previas (G) y
visitas totales de Vercel (todos). Los paneles se leen en vercel.com → proyecto → Analytics (Moisés) o por la API de
Vercel con `VERCEL_TOKEN` (la tarea semanal).

## 4. Tabla semanal (la rellena la tarea del lunes; una fila por proyecto y semana)

| Semana | Proyecto | Visitas | Canal que más trae (utm) | Paso intermedio* | Checkouts | Pagos | Ingresos | Clientes activos | Decisión |
|---|---|---|---|---|---|---|---|---|---|
| 2–8/11 | A | — | — | tests gancho: — | — | 0 | 0 € | 0 | — |
| 2–8/11 | N | — | — | abren precios: — | — | 0 | 0 € | 0 | — |
| 2–8/11 | B | — | — | tests gratis acabados: — | — | 0 | 0 € | 0 | — |
| 2–8/11 | G | — | — | vistas previas: — | — | 0 | 0 € | 0 | — |
| 2–8/11 | P | — | — | clics afiliación: — | — | — | 0 € | — | — |
| 2–8/11 | Juegos | partidas: — | portal: — | retención D1: — | — | — | 0 € | — | — |
| 2–8/11 | M | — | — | diagnósticos: — | — | 0 | 0 € | 0 | — |

\* El paso intermedio es el que manda en cada producto: si las visitas llegan pero el paso intermedio no, el problema es
la página; si el paso intermedio llega pero no el pago, el problema es la oferta o el precio.

## 5. Reglas de decisión (las mismas de PLAN.md §5, en números)

| Señal | Decisión |
|---|---|
| Un canal con menos de 20 visitas en 2 semanas | Se sustituye por el siguiente de la lista de comunidades del proyecto |
| Un canal con un pago | Se duplica la frecuencia (dentro del límite de una publicación por comunidad y semana) |
| Más de 100 visitas y 0 pagos el 11/11 (A, N, B, G) | Revisar texto y momento de la oferta; probar el precio de entrada previsto en cada MONETIZACION.md (N: pack a 14,90 €; B: 7 días por 0,99 €) |
| Menos de 100 visitas el 11/11 | Problema de tráfico: adelantar las piezas de la semana 2 y aplazar P y Juegos |
| Página con más de 100 impresiones y CTR < 2 % en Search Console | Cambiar título y meta esa semana |
| Afiliada de G sin ninguna venta en 30 días | No se insiste; se busca otra |
| Conversión vista previa → compra en G por debajo del 5 % | Revisar la vista previa (más páginas, mejor ilustración) antes de buscar tráfico |

## 6. Qué va al panel cada lunes

En `panel/data/proyectos.json`, por proyecto: `ingresosMes`, `clientes`, una acción con fecha
«Marketing: <visitas> visitas, <pagos> pagos, canal que funciona: <canal>» y, si procede, la acción «Primer euro
cobrado». En `panel/data/cartera.json`, la decisión pendiente de la semana (aprobar `APROBAR.md`).
