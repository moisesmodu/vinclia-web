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
