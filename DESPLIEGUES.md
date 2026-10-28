# Despliegues y cuentas: cómo se hace todo sin pedirle nada a Moisés

> Vale para las sesiones de proyecto (en la nube) y para la sesión del Mac «despliegues de vercel neon mac».
> Regla: **ninguna sesión le pide a Moisés claves, cuentas ni "crea el proyecto en Vercel"**. Moisés solo abre en el
> navegador las páginas que se le indiquen cuando una acción exige su sesión iniciada; el resto lo hace Claude.

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
| `GOOGLE_PLAY_JSON` (más adelante) | Google Play Console → cuenta de servicio | Publicar apps Android |

Nunca se pegan claves en el chat. Si una variable no está, la sesión escribe lo que necesita en el `DESPLIEGUE.md` de
su proyecto y sigue con todo lo demás; no se detiene ni pregunta.

## 2. Stripe: la cuenta real de Numi Mates para todos los proyectos

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
4. **Resend:** remitente `noreply@algorithmicslleida.com` hasta tener dominio propio.
5. Comprobar de punta a punta en la URL de producción (pago en modo prueba) y anotar la URL en `panel/data/proyectos.json`.

## 4. Por proyecto: lo que hace la sesión cuando NO tiene los secretos

Escribe `proyectos/<clave>/DESPLIEGUE.md` con, exactamente: nombre del proyecto en Vercel y Root Directory;
lista de variables de entorno con su valor o de dónde sale; nombre del proyecto en Neon; productos, precios y
eventos de webhook de Stripe; comandos a ejecutar en orden. La sesión del Mac lo ejecuta tal cual.
`PARA-MOISES.md` solo lleva tareas que exigen a una persona por ley o por plataforma (comprar un dominio, pulsar
"publicar" en Google Play, firmar un formulario fiscal), nunca "crea el proyecto en Vercel" ni "pega la clave".

## 5. La sesión del Mac

Orden de trabajo: (1) sección 1 completa, para que las sesiones en la nube sean autónomas desde hoy; (2) ejecutar los
`DESPLIEGUE.md` que ya existan (A y N están construidos y esperando); (3) anotar en `panel/data/proyectos.json` la URL
de producción y el estado `lanzado` de cada uno, y hacer push a la rama base. Si una acción exige la sesión del
navegador de Moisés (crear un token, aprobar un pago de dominio), se le pide solo "abre esta página", nada más.
