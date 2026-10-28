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
