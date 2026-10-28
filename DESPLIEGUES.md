# Despliegues y cuentas: cómo se hace todo sin pedirle nada a Moisés

> Vale para las sesiones de proyecto (en la nube) y para la sesión del Mac «despliegues de vercel neon mac».
> Regla: **ninguna sesión le pide a Moisés claves, cuentas ni "crea el proyecto en Vercel"**. Moisés solo abre en el
> navegador las páginas que se le indiquen cuando una acción exige su sesión iniciada; el resto lo hace Claude.

## 0. Una sola vez: la red del entorno en la nube

Las sesiones en la nube no llegan a `api.stripe.com` (la sesión N lo comprobó el 28/10): la política de red del entorno
lo bloquea. En el mismo menú del entorno (barra de título de la sesión → Editar → Network access), con el nivel
«Limited», añadir a Allowed domains, dejando marcada la casilla de gestores de paquetes:
`api.stripe.com`, `api.vercel.com`, `vercel.com`, `console.neon.tech`, `api.resend.com`, `api.elevenlabs.io`,
`api.anthropic.com`, `*.neon.tech`, `*.vercel.app` y, si P se publica en Cloudflare Pages, `api.cloudflare.com`. Pasos: https://code.claude.com/docs/en/cloud-environments#network-access.
Sin esto, las sesiones no pueden crear productos de Stripe ni desplegar aunque tengan los secretos.

**Hecho el 28/10/2026** (sesión del Mac): entorno «Default» en Limitado con esos 10 dominios y gestores de paquetes.

## 1. Una sola vez: los accesos como secretos del entorno en la nube

La sesión del Mac (con el navegador de Moisés abierto) obtiene estos accesos y los guarda en el entorno en la nube
de las sesiones de proyecto: menú del entorno en la barra de título de la sesión → Editar → «Network secrets» (o
«API credentials», o variables de entorno si no aparece esa sección). Una sesión nueva los recibe al arrancar.

| Variable | De dónde sale | Alcance |
|---|---|---|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create (ámbito: el equipo `moisesmodu-3705s-projects`, sin caducidad) | Crear proyectos, variables, dominios y desplegar con `vercel` CLI |
| `VERCEL_TEAM_ID` | vercel.com → Team Settings → General → Team ID | Para que el CLI apunte al equipo |
| `NEON_API_KEY` | console.neon.tech → Account settings → API keys → Create | Crear un proyecto de Postgres por producto y leer su `DATABASE_URL` |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com (cuenta **Numi Mates**, modo real) → Developers → API keys → **Restricted key** con permisos de escritura en Products, Prices, Checkout Sessions, Customers, Subscriptions, Webhook Endpoints, Coupons; lectura en Balance y Payment Intents | Cobros reales de todos los proyectos |
| `STRIPE_TEST_SECRET_KEY` | la misma cuenta en modo prueba → Developers → API keys → Secret key `sk_test_` | Desarrollo y pruebas de punta a punta |
| `RESEND_API_KEY` | resend.com → API Keys → Create (la cuenta ya existe; dominio `algorithmicslleida.com` verificado) | Correo transaccional |
| `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL`, `LEGAL_ADRECA` | Datos del titular (Moisés Mora, autónomo) para aviso legal y facturas | Textos legales de cada producto |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (solo si P va en Cloudflare Pages) | dash.cloudflare.com → My Profile → API Tokens → plantilla «Edit Cloudflare Workers» + Pages; Account ID en la página de inicio del dominio | Publicar los sitios de P sin coste |
| `GELATO_API_KEY` (G) | dashboard.gelato.com → Developer → API keys; la cuenta la abre Moisés (identidad y tarjeta) | Pedidos de impresión de cuentos |
| `GOOGLE_PLAY_JSON` (más adelante) | Google Play Console → cuenta de servicio | Publicar apps Android |

**Hecho el 28/10/2026** (sesión del Mac): el entorno «Default» tiene `VERCEL_TOKEN` (equipo, sin caducidad), `VERCEL_TEAM_ID`,
`NEON_API_KEY` y `NEON_ORG_ID` (organización «Vercel: moisesmodu-3705's projects»; no usar la de Algorithmics Lleida),
`STRIPE_SECRET_KEY` (restringida `cartera-sesiones-claude-2`, Numi Mates, modo real), `STRIPE_TEST_SECRET_KEY`, `RESEND_API_KEY` y `LEGAL_*`.
Copia local en el Mac: `~/.config/cartera/secretos.env` (chmod 600). Correo legal provisional `moisesmodu@gmail.com` hasta tener dominio
por proyecto. **No se usa nada de Algorithmics** (ni web ni dominio `algorithmicslleida.com`): remitente de Resend `noreply@numimates.com`.

Nunca se pegan claves en el chat. Si una variable no está, la sesión escribe lo que necesita en el `DESPLIEGUE.md` de
su proyecto y sigue con todo lo demás; no se detiene ni pregunta.

## 2. Stripe: la cuenta real de Numi Mates para todos los proyectos

> Atajo sin claves: la sesión madre («Estrategia ingresos recurrentes») tiene el conector de Stripe de claude.ai conectado a
> esta cuenta. Lee sin problema, pero el 28/10 las escrituras devolvieron «Forbidden»: el conector está en modo solo
> lectura. Si Moisés abre claude.ai → Ajustes → Conectores → Stripe y permite las herramientas de escritura, la sesión
> madre crea los productos, precios y webhooks de todos los proyectos sin ninguna clave. Los scripts
> `stripe-configurar.mjs` de cada proyecto son repetibles y reutilizan lo que ya exista.

- Cuenta: **Numi Mates** (`acct_1UKx8H4NbKzEdcfB`), modo real. No se abren cuentas nuevas.
- Desarrollo y pruebas con las claves de **modo prueba de la misma cuenta**; al lanzar, las de modo real.
- Cada proyecto crea sus productos y precios por API, con nombre `Cartera · <Proyecto> · <Plan>` y
  `metadata.proyecto=<clave>`, de forma idempotente (buscar antes de crear). Los precios son los de `VIABILIDAD.md`.
- Un webhook por proyecto (`/api/stripe/webhook`) registrado por API con los eventos que use.
- Facturas y recibos con los datos de `LEGAL_*`; IVA: libros y PDF al 4 %, servicios digitales al 21 %.

## 3. Por proyecto: lo que hace la sesión cuando tiene los secretos

1. **Vercel:** `vercel link` o `vercel project add <nombre>` dentro de `proyectos/<clave>` con `--token $VERCEL_TOKEN
   --scope $VERCEL_TEAM_ID`; Root Directory = la carpeta del proyecto; variables de entorno con `vercel env add`
   (production y preview); `vercel deploy --prod`. Dominio cuando Moisés lo compre (hasta entonces, `*.vercel.app`).
2. **Neon:** `POST https://console.neon.tech/api/v2/projects` con `NEON_API_KEY`, región `aws-eu-west-2`, nombre
   `cartera-<clave>`; guardar la `connection_uri` como `DATABASE_URL` en Vercel; `prisma migrate deploy`.
3. **Stripe:** productos, precios y webhook por API (sección 2); `STRIPE_WEBHOOK_SECRET` a Vercel.
4. **Resend:** remitente `noreply@numimates.com` (verificado) hasta tener dominio propio; nunca `algorithmicslleida.com`.
5. Comprobar de punta a punta en la URL de producción (pago en modo prueba) y anotar la URL en `panel/data/proyectos.json`.

## 3 bis. Primero de todo, en cada sesión: `node scripts/comprobar-entorno.mjs`

Dice en 5 segundos si la sesión puede desplegar sola (red y secretos) o si debe dejar `DESPLIEGUE.md`. Las sesiones
lo ejecutan al empezar y antes de desplegar; el resultado va en el informe final.

## 4. Por proyecto: lo que hace la sesión cuando NO tiene los secretos

Escribe `proyectos/<clave>/DESPLIEGUE.md` con, exactamente: nombre del proyecto en Vercel y Root Directory;
lista de variables de entorno con su valor o de dónde sale; nombre del proyecto en Neon; productos, precios y
eventos de webhook de Stripe; comandos a ejecutar en orden. La sesión del Mac lo ejecuta tal cual.
`PARA-MOISES.md` solo lleva tareas que exigen a una persona por ley o por plataforma (comprar un dominio, pulsar
"publicar" en Google Play, firmar un formulario fiscal), nunca "crea el proyecto en Vercel" ni "pega la clave".

### Enlace automático con la sesión del Mac (mientras la nube no pueda desplegar)
Si Moisés arranca la sesión del Mac con Remote Control (`claude remote-control` en un terminal dentro de la carpeta del
repositorio, o desde la app de escritorio), esa sesión aparece como alcanzable para las sesiones en la nube. Entonces,
al terminar, la sesión de proyecto le envía un mensaje con `SendMessage` (destinatario: la sesión cuyo nombre contenga
«despliegues») con la ruta de su `DESPLIEGUE.md` y el número de PR. Si no es alcanzable, basta con el PR: la sesión del
Mac los revisa en bucle (ver §5).

## 5. La sesión del Mac

Orden de trabajo: (0) sección 0 (red del entorno); (1) sección 1 completa, para que las sesiones en la nube sean autónomas
desde hoy; (2) ejecutar los `DESPLIEGUE.md` que ya existan, en este orden; (3) anotar en `panel/data/proyectos.json` la URL
de producción y el estado `lanzado` de cada uno, y hacer push a la rama base.

| PR | Proyecto | Rama | DESPLIEGUE.md | Notas |
|---|---|---|---|---|
| #3 | N · Nuevo en España | `claude/n-nuevo-en-espana` | sí | `scripts/stripe-configurar.mjs` crea productos y webhook de forma repetible |
| #2 | A · CCSE en tu idioma | `claude/a-ccse` | sí | Proyecto de Vercel obligatoriamente `ccse-en-tu-idioma` (la app Android ya lleva ese dominio); `scripts/stripe-configurar.mjs` propio |
| #4 | Juegos · Egg Truck | `claude/juegos-primer-juego` | sí | Solo Vercel: proyecto `juegos-casuales`, Root Directory `proyectos/juegos`; sin Neon, Stripe ni Resend |
| #5 | G · Lunilla | `claude/g-cuentos` | sí | Neon `cartera-g-cuentos` (aws-eu-west-2), Vercel Pro con Root Directory `proyectos/g-cuentos` y Blob store, `scripts/stripe-configurar.mjs` (PDF 7,90 €, tapa dura 36,90 €), Resend; Gelato lo abre Moisés |
| #6 | P · NetoClaro e ImpuestoClaro | `claude/p-webs-adsense-fabrica` | sí | Dos caminos: (A) Cloudflare Pages con wrangler y el workflow `p-webs-adsense.yml`, que publica solo en cada push a la base si existe `CLOUDFLARE_API_TOKEN`; (B) Vercel Pro (`netoclaro`, `impuestoclaro`, Root Directory `proyectos/p-webs-adsense/fabrica`). Variable `SITIO` y `LEGAL_*`; sin Neon ni Stripe. Dominios, AdSense y Search Console los abre Moisés |

Si una acción exige la sesión del navegador de Moisés (crear un token, aprobar un pago de dominio), se le pide solo
"abre esta página", nada más.

**Proyecto de Vercel `ccse-en-tu-idioma` ya existente:** compila todas las ramas del repositorio y pone en rojo los PR
que no son de A (lo detectó la sesión P en el PR #6). Arreglo, en Vercel → Settings → Git: Production Branch =
`claude/estrategia-ingresos-recurrentes-tx0rvw` e Ignored Build Step = `git diff HEAD^ HEAD --quiet -- proyectos/a-ccse`
(sale 0 y se salta el build cuando A no cambia). Mismo criterio para cada proyecto de Vercel nuevo con su carpeta.

**Importante:** la sesión «Despliegues vercel neon MAC» abierta el 28/10 a las 00:50 quedó archivada tres segundos
después (el terminal de `claude remote-control` se cerró). Tiene que quedarse abierta en el Mac, con el terminal en
primer plano o en segundo plano con el ordenador sin dormir, mientras dure el bucle de abajo.

Para que recoja los despliegues sola, se le da este bucle (comando `/loop 30m`): «Cada 30 minutos: `git fetch`, lista
los PR abiertos de moisesmodu/vinclia-web hacia la rama base cuyo diff añada un `proyectos/*/DESPLIEGUE.md` que aún no
esté marcado como ejecutado; ejecuta cada uno en orden según DESPLIEGUES.md §3, anota la URL de producción y el estado
`lanzado` en panel/data/proyectos.json, añade al final del DESPLIEGUE.md la línea `Ejecutado el <fecha>` y haz push a
la rama del PR. Si falta un acceso, créalo (sección 1) y guárdalo también como secreto del entorno en la nube.»
