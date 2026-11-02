# Despliegue del panel «La cartera» (para la sesión del Mac)

- **Proyecto de Vercel:** `cartera`. Framework: Next.js. **Root Directory: `panel`**. Build: `npm run build`.
  Desde el 01/11 ya no es exportación estática: ver «Centro de control» al final (variables, Neon de solo lectura, Stripe).
- **Rama de producción:** `claude/estrategia-ingresos-recurrentes-tx0rvw`, con la integración de Git activada para que
  cada push a esa rama vuelva a publicar el panel solo. Ignored Build Step: `git diff HEAD^ HEAD --quiet -- panel`.
- **Protección:** el panel contiene prompts, cifras y planes. Activar en Vercel → Settings → Deployment Protection la
  opción «Password Protection» (plan Pro) o «Vercel Authentication» para que solo Moisés lo vea. Si no hay plan Pro,
  dejarlo público pero avisar en el panel.

```bash
git fetch origin claude/estrategia-ingresos-recurrentes-tx0rvw && git checkout claude/estrategia-ingresos-recurrentes-tx0rvw && git pull
cd panel && npm install && npm run build         # comprobación local: out/index.html
vercel project add cartera --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
vercel link --yes --project cartera --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
vercel git connect --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID        # conecta moisesmodu/vinclia-web
# En Settings → General: Root Directory = panel; Settings → Git: Production Branch = claude/estrategia-ingresos-recurrentes-tx0rvw
vercel deploy --prod --yes --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID
```

## Publicación automática con cada push (sin conectar el repositorio a Vercel)

Como Vercel bloquea los despliegues automáticos de commits firmados por «Claude» en la integración de Git, el panel se
publica con el workflow `.github/workflows/panel.yml` (GitHub Actions, que sí tiene red). Solo hace falta que la sesión
del Mac guarde tres secretos en el repositorio, una vez:

```bash
gh secret set VERCEL_TOKEN --repo moisesmodu/vinclia-web --body "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID --repo moisesmodu/vinclia-web --body "$VERCEL_TEAM_ID"
gh secret set VERCEL_PROJECT_ID --repo moisesmodu/vinclia-web --body "$(cat panel/.vercel/project.json | python3 -c 'import json,sys;print(json.load(sys.stdin)["projectId"])')"
```

Después, cada push a la rama base que toque `panel/`, `marcas/` o los `.md` publica el panel solo. El mismo patrón sirve
para cualquier otro proyecto que quiera publicarse con cada push.

Después: anotar la URL en `panel/data/cartera.json` → `panelUrl`, y añadir al final de este archivo `Ejecutado el <fecha>`.

Ejecutado el 31/10/2026. Proyecto `cartera` (prj_AlLDF7YHqfMUcty6H6yyNny4f4v9) conectado por Git a moisesmodu/vinclia-web,
Production Branch = la rama base, Root Directory `panel`. URL de producción:
https://cartera-moisesmodu-3705s-projects.vercel.app (Vercel Authentication, protección estándar: entra Moisés con su
cuenta de Vercel). Se quitó el dominio público `cartera-alpha.vercel.app` porque la protección estándar no lo cubría.
Ignored Build Step real: `git diff HEAD^ HEAD --quiet -- . ../marcas ../marketing '../*.md'` (el comando se ejecuta
dentro de `panel/`, así que `-- panel` nunca veía cambios). Next.js subido a 15.5.28: Vercel bloquea 15.5.6 por
vulnerabilidad. El workflow `.github/workflows/panel.yml` no hace falta mientras la integración de Git publique.

## Centro de control (/control) — 01/11/2026

El panel ya no es una exportación estática: se quitó `output: 'export'` de `next.config.mjs`. La portada, las fichas y
los documentos siguen prerenderizados; `/control/*` se renderiza en el servidor en cada visita (runtime Node,
`dynamic = 'force-dynamic'`), así que ningún dato de usuarios o pagos queda en HTML estático ni en el JavaScript del
cliente. Está detrás de la misma Vercel Authentication que el resto del panel.

- **Secciones:** Resumen (ingresos netos hoy / 7 días / mes, MRR, altas hoy / 7 / 30 días, conversión, desglose por
  proyecto, últimos pagos y altas), Usuarios (tabla unificada de A, N, B, G y M con búsqueda por email, filtros,
  paginación y CSV en `/control/usuarios/csv/`), Pagos (cobros, reembolsos y disputas con enlace al dashboard de Stripe),
  Suscripciones (activas, prueba, pago atrasado, canceladas, renovaciones en 30 días) y Visitas (Web Analytics 7/30 días
  de las 8 webs, con enlace a Vercel).
- **Bases de datos:** rol `panel_ro` creado por SQL en las 5 bases Neon de producción (A weathered-sun-40028794,
  N billowing-surf-48143930, B restless-dust-17188704, G empty-violet-22718825, M morning-shape-94587961): `LOGIN`
  sin superusuario ni pertenencia a `neon_superuser`, `CONNECT`, `USAGE ON SCHEMA public`, `SELECT ON ALL TABLES`,
  `ALTER DEFAULT PRIVILEGES … GRANT SELECT`, `default_transaction_read_only = on` y `statement_timeout = 15s`. Se creó
  por SQL y no por la API de Neon porque los roles de la API entran en `neon_superuser` y podrían escribir. Además, el
  código abre cada consulta con `BEGIN TRANSACTION READ ONLY`. Comprobado: `CREATE TABLE` con `panel_ro` falla (25006).
  Copia local de las cadenas: `~/.config/cartera/panel_ro.env` (fuera del repo).
- **Variables del proyecto `cartera`** (production, tipo sensitive): `DB_RO_A`, `DB_RO_N`, `DB_RO_B`, `DB_RO_G`, `DB_RO_M`
  (pooler + `sslmode=require`), `STRIPE_SECRET_KEY` (la restringida rk_live de Numi Mates), `VERCEL_TOKEN_PANEL`
  (**provisional: es el VERCEL_TOKEN completo; sustituir por un token de solo lectura**) y `PANEL_TEAM_ID`.
- **Stripe:** la clave restringida no puede leer `/charges`, `/refunds`, `/disputes` ni `/invoices`. Se usan
  `payment_intents` con `latest_charge.refunds` expandido, `checkout/sessions` (para `metadata.proyecto`), `subscriptions`,
  `products` y `events` (disputas de los últimos 30 días). Los cobros sin `metadata.proyecto` (Numi) salen como «fuera de
  la cartera» y no se suman a los ingresos de la cartera. Si se quieren ver todas las disputas, dar a la clave lectura de
  Disputes.
- **Si una base de datos, Stripe o Analytics falla,** su tarjeta muestra un aviso y el resto de la página sigue.
- **Rotar la contraseña de `panel_ro`:** `ALTER ROLE panel_ro PASSWORD '…'` como `neondb_owner` y actualizar `DB_RO_<letra>`.
- **Quitarlo todo:** `DROP OWNED BY panel_ro; DROP ROLE panel_ro;` en cada base y borrar las variables de `cartera`.

## Panel de mando — 02/11/2026

La portada del panel (`/`) es ahora el **panel de mando** (route group `app/(mando)`, con su propio layout raíz e
identidad oscura); la cartera estática de antes vive en `/cartera/` y conserva `/p/<clave>/` y `/docs/<slug>/`
(route group `app/(plan)`). `/control/*` redirige a las secciones nuevas.

- **Secciones:** Hoy (`/`: ingresos del mes y de hoy, MRR, ventas, usuarios nuevos y visitantes con su variación;
  barras de ingresos y visitantes de 30 días por proyecto; «Tu siguiente paso»; últimas acciones; semáforo de las 8
  webs), Proyectos (`/proyectos/` y ficha `/proyectos/<slug>/`), Ventas, Usuarios y Suscripciones (filtros y CSV en
  `/<sección>/csv/`), Tareas (`/tareas/`, botón «Hecho»), Marketing (`/marketing/`: calendario, piezas con «Copiar
  texto» y «Publicado», correos a entidades con «Enviar» y «Enviar todos»), Juegos y portales (`/juegos/`) y Más.
- **Contenido del repositorio:** `scripts/generar-contenido.mjs` (se ejecuta solo en `prebuild`, `predev` y
  `precheck`) empaqueta en `lib/generado/contenido.json` (ignorado por git) las tareas de `marketing/PARA-MOISES.md` y
  de `data/cartera.json` → `decisionesPendientes` (omite las informativas ✔ y las ya cubiertas), el calendario
  (`marketing/CALENDARIO.md`), las piezas (`marketing/piezas/*/semana-*.md`, con el estado de `APROBAR.md`), los
  correos (`marketing/correos/*.json`), los iconos de `marcas/` y `data/juegos.json` (copia de
  `proyectos/juegos/juegos.json` de la rama de juegos: actualizarla si cambian los ids). Para que una tarea o una pieza
  nueva aparezca basta con editar esos archivos y hacer push.
- **Base de datos propia del panel:** Neon `cartera-panel` (proyecto `twilight-pine-15010674`, aws-eu-west-2), creada
  como store de la integración de Neon en Vercel (`store_yTIOp72cOgiRLRq9`, plan Free) porque la organización de Neon
  está gestionada por Vercel y su API ya no deja crear proyectos. Tablas en `scripts/esquema-panel.sql`:
  `tareas_estado`, `piezas_estado`, `correos_envios` (clave = pieza + destinatario) y `registro`. Solo guarda el
  estado del panel; no toca las bases de las apps. Copia local de la cadena: `~/.config/cartera/panel_db.env`.
- **Variables nuevas de `cartera`** (production, sensitive): `PANEL_DB_URL` (pooler) y `RESEND_API_KEY`.
  Opcional: `PANEL_CORREO_MODO=simulacion` para desactivar el envío real.
- **Correos:** server action `enviarCorreos` (`app/(mando)/acciones.ts`). Solo envía de verdad con
  `VERCEL_ENV=production`; en local y en vistas previas simula sin llamar a Resend. Antes de enviar reserva la fila en
  `correos_envios` con un `INSERT … ON CONFLICT … WHERE estado IN ('error','simulado')`: un correo enviado o en curso
  no se puede repetir; además manda `Idempotency-Key` a Resend. La interfaz pide confirmación en un diálogo.
- **Seguridad:** todo detrás de Vercel Authentication; páginas con `force-dynamic` en Node, sin datos en el JavaScript
  del cliente (los gráficos reciben solo agregados por día). Las server actions comprueban `Origin` = `Host` (además
  de la comprobación propia de Next) y solo aceptan ids que existen en el contenido del build. Probado: una petición con
  `Origin` ajeno devuelve 500 y no guarda nada. Sin acciones sobre Stripe ni sobre las apps (solo GET).
- **Salud:** estado HTTP en vivo de cada web (GET con 8 s de límite), último despliegue de producción
  (`/v6/deployments`) y respuestas 5xx de las últimas 24 h con la API de observabilidad
  (`POST /v2/observability/query`, métrica `vercel.request.count`, filtro `http_status ge 500`). Visitas diarias con
  `/v1/query/web-analytics/visits/aggregate?by=day`.
- **Juegos:** comprobación por HTTP de la página pública de cada juego en itch.io (`nuvoletgames.itch.io/<slug>`),
  GameDistribution, GameMonetize, CrazyGames y Poki; en los portales cuenta como publicado solo si la página contiene el
  id del juego o «Nuvolet» (evita confundirlo con un juego ajeno del mismo nombre). Se guarda 15 minutos.
