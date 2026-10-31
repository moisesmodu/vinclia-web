# Despliegue · Juegos (para la sesión del Mac, según DESPLIEGUES.md §3)

Comprobador del entorno en la sesión que construyó esto (28/10/2026): `api.vercel.com` bloqueado y sin
`VERCEL_TOKEN` ni `VERCEL_TEAM_ID`, así que no se pudo desplegar desde la nube.

## Qué necesita
- **Vercel:** sí, un proyecto. **Neon, Stripe y Resend:** no (juego estático, sin datos ni cobros; los portales pagan
  la publicidad).
- **Proyecto en Vercel:** `juegos-casuales`. Root Directory: `proyectos/juegos`. Framework: Other (lo lee de
  `proyectos/juegos/vercel.json`: install `npm install`, build `npm run build`, salida `dist`).
- **Variables de entorno:** ninguna obligatoria. Opcional `SITE_URL=https://juegos-casuales.vercel.app` para generar
  `sitemap.xml` con URLs absolutas (en Vercel también vale `VERCEL_PROJECT_PRODUCTION_URL`, que se pone sola).
- **Rama de producción:** `claude/estrategia-ingresos-recurrentes-tx0rvw` cuando se fusione el PR #4; hasta entonces,
  desplegar la rama `claude/juegos-primer-juego`.

## Comandos, en orden
```bash
git fetch origin claude/juegos-primer-juego && git checkout claude/juegos-primer-juego
cd proyectos/juegos
npm install && npm run build          # comprobación local: dist/egg-truck/index.html
vercel project add juegos-casuales --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
vercel link --yes --project juegos-casuales --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
# Root Directory del proyecto = proyectos/juegos (si se despliega desde la raíz del repo; desde esta carpeta no hace falta)
vercel env add SITE_URL production --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID <<< "https://juegos-casuales.vercel.app"
vercel deploy --prod --yes --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
```

## Comprobación tras desplegar
- `https://juegos-casuales.vercel.app/egg-truck/` carga el menú y se juega (pulsar el botón verde, mantener pulsado).
- `https://juegos-casuales.vercel.app/play/egg-truck/` muestra la guía con el juego incrustado.
- `https://juegos-casuales.vercel.app/sitemap.xml` y `/robots.txt` existen.

## Después
- Anotar la URL en `panel/data/proyectos.json` (ficha `juegos`, `enlaces.Web`) y en `fichas/egg-truck/FICHAS.md`
  (apartado Poki: es el enlace que se envía a Poki).
- Añadir al final de este archivo: `Ejecutado el <fecha>`.

Ejecutado el 28/10/2026 desde la sesión del Mac: https://juegos-casuales.vercel.app/egg-truck/ (proyecto Vercel `juegos-casuales`, `SITE_URL` en production).

## Redespliegue pendiente · identidad Nuvolet Games (28/10/2026, commit e21928d)
La sesión de Juegos tiene los secretos, pero su contenedor aún no llega a `api.vercel.com` (arrancó antes del cambio de
red). Hay que volver a desplegar el mismo proyecto con la rama actualizada:
```bash
git fetch origin claude/juegos-primer-juego && git checkout claude/juegos-primer-juego && git pull
cd proyectos/juegos && npm install && npm run build
vercel deploy --prod --yes --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
```
Comprobar: la pantalla de carga de `/egg-truck/` muestra la nube azul y «Nuvolet Games»; la portada del sitio lleva el
logotipo arriba y el pie «Nuvolet Games · Tiny games, big smiles.».

### Hecho (sesión del Mac, 28-10-2026)
Redesplegado `juegos-casuales` con el commit e21928d: la portada, `/egg-truck/` y `/marca/juegos.svg` llevan Nuvolet Games y
hay `sitemap.xml`. El build nuevo copia `../../marcas/logos/*.svg` desde la raíz del repo, y desplegar solo
`proyectos/juegos` fallaba (`ENOENT /marcas/logos/juegos.svg`). Por eso el proyecto de Vercel tiene ahora **Root Directory
`proyectos/juegos`** y se despliega **desde la raíz del repositorio**:
```bash
vercel link --yes --project juegos-casuales   # en la raíz del repo, no en proyectos/juegos
vercel deploy --prod --yes
```

Ejecutado el 2026-10-28

### Redespliegue (sesión del Mac, 28-10-2026, 04:49)
Publicado el commit 9ddf2ff en https://juegos-casuales.vercel.app (desde la raíz del repo, Root Directory `proyectos/juegos`): portada, `/egg-truck/` y `/bike-flip/` responden.

Ejecutado el 2026-10-28

## Redespliegue pendiente · solo juegos terminados (28/10/2026)
El redespliegue de 9ddf2ff publicó `/bike-flip/` (y el catálogo enlazaba rocket-hop y jelly-stack) cuando todavía eran la
plantilla de ejemplo. Desde este commit, `npm run build` solo publica los juegos de `juegos.json` cuyo `estado` no sea
«en desarrollo» (hoy: egg-truck y snow-plow). Volver a desplegar la rama con los comandos de arriba; comprobar que
`/bike-flip/` da 404 hasta que ese juego se marque como listo.

### Redespliegue (sesión del Mac, 28-10-2026, 05:09)
Publicado el commit 8fb4c96: solo salen los juegos terminados. Responden `/egg-truck/`, `/snow-plow/`, `/rocket-hop/` y
`/jelly-stack/`, el catálogo enlaza esos cuatro y `/bike-flip/` da 404 (sigue «en desarrollo»).

Ejecutado el 2026-10-28

## Redespliegue pendiente · 5 juegos (28/10/2026)
Bike Flip, Snow Plow, Rocket Hop y Jelly Stack están terminados y marcados como listos en `juegos.json`. Volver a
desplegar la rama: la portada debe mostrar 5 juegos y `/bike-flip/`, `/snow-plow/`, `/rocket-hop/`, `/jelly-stack/` deben
cargar su menú.

### Redespliegue (sesión del Mac, 28-10-2026, 06:40)
Publicado el commit d686ba1 con los 5 juegos: la portada enlaza Egg Truck, Bike Flip, Snow Plow, Rocket Hop y Jelly Stack, y
`/egg-truck/`, `/bike-flip/`, `/snow-plow/`, `/rocket-hop/` y `/jelly-stack/` responden 200 con su script.

Ejecutado el 2026-10-28

## Redespliegue pendiente · 11 juegos (30/10/2026)
Nuevos y listos: Hook Hop, Trick Floor, Lane Dash, Fruit Stand, Paint Grab y Penalty Season; los 5 primeros con tienda,
recompensa diaria y ×2. Volver a desplegar la rama: la portada debe mostrar 11 juegos y cada `/<juego>/` cargar su menú.

## Redespliegue pendiente · 14 juegos (30/10/2026)
Nuevos y listos desde el último despliegue: Hook Hop, Trick Floor, Lane Dash, Fruit Stand, Paint Grab, Penalty Season,
Rope Cut, Hoop Bounce y Paper Glide. Volver a desplegar la rama: la portada debe mostrar 14 juegos y cada `/<juego>/`
cargar su menú.

## Redespliegue pendiente · 18 juegos (30/10/2026)
Nuevos y listos: Pin Rescue, Tow Truck, Tiny Harbor y Jelly Merge. Volver a desplegar la rama: la portada debe mostrar 18 juegos y `/pin-rescue/`, `/tow-truck/`, `/tiny-harbor/` y `/jelly-merge/` cargar su menú.

### Redespliegue (sesión del Mac, 30-10-2026, 13:16)
Publicado el commit c7799e1 con los 14 juegos listos. Comprobado: la portada enlaza los 14 y cada `/<juego>/` da 200 y carga
su script (egg-truck, bike-flip, snow-plow, rocket-hop, jelly-stack, hook-hop, trick-floor, lane-dash, fruit-stand,
paint-grab, penalty-season, rope-cut, hoop-bounce, paper-glide). `/pin-rescue/` y `/tow-truck/` dan 404 (en desarrollo).

Ejecutado el 2026-10-30

## Redespliegue pendiente · 18 juegos (sigue pendiente tras el despliegue de c7799e1)
El despliegue de las 13:16 publicó c7799e1, anterior a Pin Rescue, Tow Truck, Tiny Harbor y Jelly Merge. Volver a
desplegar la rama actual: la portada debe mostrar 18 juegos y `/pin-rescue/`, `/tow-truck/`, `/tiny-harbor/` y
`/jelly-merge/` cargar su menú.

### Redespliegue con los 18 juegos (sesión del Mac, 31-10-2026, 00:08)
Publicada la rama con el código de c1e5021, que incluye Pin Rescue, Tow Truck, Tiny Harbor y Jelly Merge. La nota anterior de
esta sesión (c7799e1, 14 juegos) se escribió antes de ver la petición de los 18 juegos; esta la sustituye. Comprobado: la
portada enlaza los 18 juegos listos de `juegos.json`, y cada `/<juego>/` da 200 y carga su script, también `/pin-rescue/`,
`/tow-truck/`, `/tiny-harbor/` y `/jelly-merge/`.

Ejecutado el 2026-10-31

## Redespliegue pendiente · SEO de la web propia (31/10/2026, sesión de marketing)
Cambios solo en la web (los paquetes de portal no cambian): analítica de Vercel sin cookies (`/_vercel/insights/script.js`,
solo cuando el build corre en Vercel o `SITE_URL` es `*.vercel.app`; Web Analytics ya está activado en el proyecto),
canonical y Open Graph en las 18 páginas de juego, título navideño de Snow Plow (`tituloSeo` en `juegos.json`; el título de
marca sigue siendo «Snow Plow»), página `/about/` con datos `Organization` (Lleida) enlazada desde el pie, página en
castellano `/es/juegos-para-chromebook/` con `hreflang` es/en, y verificación de Search Console por variable.

- **Variable nueva, opcional:** `GOOGLE_SITE_VERIFICATION` = el valor `content` que da Search Console (método «etiqueta
  HTML») para la propiedad `https://juegos-casuales.vercel.app/`. Sin ella no sale ninguna etiqueta. Hasta tener el dominio
  propio (`nuvolet.games`, sin comprar) la propiedad se verifica sobre `juegos-casuales.vercel.app`.
- Comandos (desde la raíz del repositorio, Root Directory `proyectos/juegos`):
```bash
git fetch origin claude/juegos-primer-juego && git checkout claude/juegos-primer-juego && git pull
# opcional: printf '%s' "<valor>" | vercel env add GOOGLE_SITE_VERIFICATION production --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
vercel link --yes --project juegos-casuales --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
vercel deploy --prod --yes --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
```
- Comprobar: `/snow-plow/` tiene `<title>` con «Christmas» y `<link rel="canonical">`; `/about/` responde 200; `/es/juegos-para-chromebook/`
  responde 200 con `hreflang`; `/` carga `/_vercel/insights/script.js` (y en Vercel → Analytics empiezan a verse visitas);
  `/sitemap.xml` lista 129 URL (18 juegos, 108 guías y categorías, about, chromebook es, portada).

### Redespliegue SEO (sesión del Mac, 31-10-2026, 05:15)
Publicado el commit 015114b: `/snow-plow/` con título navideño, `/about/` y `/es/juegos-para-chromebook/` responden, la portada carga el script de analítica y `/sitemap.xml` lista 129 URL. `GOOGLE_SITE_VERIFICATION` no se ha puesto (falta el valor).

Ejecutado el 2026-10-31
