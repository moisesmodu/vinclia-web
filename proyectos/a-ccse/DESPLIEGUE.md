# Despliegue del proyecto A · CCSE en tu idioma

> Lo ejecuta la sesión del Mac («despliegues de vercel neon mac») tal cual, siguiendo `DESPLIEGUES.md` de la raíz.
> La sesión en la nube no tenía `VERCEL_TOKEN`, `NEON_API_KEY`, claves de Stripe, `RESEND_API_KEY` ni `LEGAL_*`.
> Con esos secretos en el entorno, cualquier sesión puede ejecutar estos mismos pasos.

## Resumen
| Qué | Valor |
|---|---|
| Proyecto de Vercel | `ccse-en-tu-idioma` (equipo `$VERCEL_TEAM_ID`) |
| Repositorio y rama | `moisesmodu/vinclia-web`, rama `claude/a-ccse` (después, la base cuando se fusione el PR #2) |
| Root Directory | `proyectos/a-ccse` |
| Framework, instalación y build | Next.js · `npm install` · `npm run build` (genera Prisma, aplica migraciones si hay `DATABASE_URL` y compila) |
| URL de producción | `https://ccse-en-tu-idioma.vercel.app`. **Ese nombre es obligatorio**: la app Android ya publicada lo lleva dentro. |
| Proyecto de Neon | `cartera-a-ccse`, región `aws-eu-west-2`, Postgres 16 |
| Stripe | Cuenta **Numi Mates** (`acct_1UKx8H4NbKzEdcfB`). Producto `Cartera · CCSE · Acceso 3 meses`, precio 9,99 EUR pago único con IVA incluido, `lookup_key` `a-ccse-acceso-90d-999eur`, `metadata.proyecto=a-ccse` |
| Eventos del webhook | `checkout.session.completed`, `checkout.session.async_payment_succeeded` → `https://ccse-en-tu-idioma.vercel.app/api/stripe/webhook` |

## Variables de entorno (production y preview)
| Variable | Valor u origen | Obligatoria |
|---|---|---|
| `DATABASE_URL` | `connection_uri` del proyecto de Neon (paso 2) | Sí |
| `AUTH_SECRET` | `openssl rand -base64 48` (nueva, solo para este proyecto) | Sí |
| `NEXT_PUBLIC_SITE_URL` | `https://ccse-en-tu-idioma.vercel.app` | Sí |
| `STRIPE_TEST_SECRET_KEY` | Secreto del entorno (modo prueba de Numi Mates) | Sí, en el desarrollo |
| `STRIPE_SECRET_KEY` | Secreto del entorno (modo real). Solo se usa con `STRIPE_MODO=live` | Al lanzar |
| `STRIPE_MODO` | `test` ahora; `live` el día del lanzamiento | Sí |
| `STRIPE_WEBHOOK_SECRET` | Lo da el paso 3. Si se omite, la app crea el webhook en el primer pago y guarda su secreto en la base de datos | Recomendada |
| `RESEND_API_KEY` | Secreto del entorno (solo para recuperar la contraseña) | No |
| `CORREO_REMITENTE` | `CCSE en tu idioma <noreply@algorithmicslleida.com>` | No |
| `LEGAL_NOM`, `LEGAL_NIF`, `LEGAL_EMAIL`, `LEGAL_ADRECA` | Secretos del entorno. Se leen en cada petición: si falta alguno, el aviso legal muestra «[falta LEGAL_…]» | Sí, antes de vender |
| `TWA_SHA256` | Huella de la clave de subida, una coma y la huella de firma de Google Play (paso 6) | Tras publicar en Play |
| `TWA_PACKAGE` | `es.nuevoenespana.ccse` | No (es el valor por defecto) |

## Comandos, en orden
```bash
cd proyectos/a-ccse
export VC="--token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID"

# 1. Proyecto de Vercel conectado al repo y con Root Directory
npx vercel@latest project add ccse-en-tu-idioma $VC
npx vercel@latest link --yes --project ccse-en-tu-idioma $VC
npx vercel@latest git connect https://github.com/moisesmodu/vinclia-web $VC
curl -s -X PATCH "https://api.vercel.com/v9/projects/ccse-en-tu-idioma?teamId=$VERCEL_TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  -d '{"rootDirectory":"proyectos/a-ccse","framework":"nextjs"}'

# 2. Neon: proyecto y DATABASE_URL
DB=$(curl -s -X POST https://console.neon.tech/api/v2/projects -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project":{"name":"cartera-a-ccse","region_id":"aws-eu-west-2","pg_version":16}}' \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).connection_uris[0].connection_uri))')
for E in production preview; do printf %s "$DB" | npx vercel@latest env add DATABASE_URL $E $VC; done

# 3. Stripe (modo prueba): producto, precio y webhook, de forma idempotente
npm install
STRIPE_KEY="$STRIPE_TEST_SECRET_KEY" SITE_URL=https://ccse-en-tu-idioma.vercel.app node scripts/stripe-configurar.mjs \
  > /tmp/whsec_ccse && for E in production preview; do npx vercel@latest env add STRIPE_WEBHOOK_SECRET $E $VC < /tmp/whsec_ccse; done; rm -f /tmp/whsec_ccse

# 4. Resto de variables
for E in production preview; do
  openssl rand -base64 48 | tr -d '\n' | npx vercel@latest env add AUTH_SECRET $E $VC
  printf %s https://ccse-en-tu-idioma.vercel.app | npx vercel@latest env add NEXT_PUBLIC_SITE_URL $E $VC
  printf %s "$STRIPE_TEST_SECRET_KEY" | npx vercel@latest env add STRIPE_TEST_SECRET_KEY $E $VC
  printf %s test | npx vercel@latest env add STRIPE_MODO $E $VC
  for V in LEGAL_NOM LEGAL_NIF LEGAL_EMAIL LEGAL_ADRECA RESEND_API_KEY; do [ -n "${!V}" ] && printf %s "${!V}" | npx vercel@latest env add $V $E $VC; done
done

# 5. Desplegar (el build aplica la migración prisma/migrations/0001_inicial en Neon)
npx vercel@latest deploy --prod $VC

# 6. Comprobación de punta a punta en producción
curl -fsS https://ccse-en-tu-idioma.vercel.app/es > /dev/null && echo portada-ok
curl -fsS https://ccse-en-tu-idioma.vercel.app/api/auth/yo && echo
BASE=https://ccse-en-tu-idioma.vercel.app node pruebas/e2e-movil.mjs   # sin el doble de Stripe: el último paso abre Checkout real
```
Después, a mano en el navegador: crear una cuenta en `/es/precio` y pagar con `4242 4242 4242 4242`. Hay que comprobar que la
cuenta muestra «Acceso completo hasta…» (90 días) y que el pago sale en el panel de Stripe (modo prueba) con `metadata.proyecto=a-ccse`.
Luego anotar la URL y el estado `lanzado (pruebas)` en `panel/data/proyectos.json` y hacer push a la rama base.

## 7. Cuando Moisés publique en Google Play
Play Console → la app → Integridad de la app → copiar la huella **SHA-256 de la clave de firma de apps** y hacer:
```bash
for E in production preview; do printf %s "<huella-de-play>,93:D1:AA:08:87:6C:96:67:98:44:BE:5C:FE:4E:B3:82:BD:12:1C:AC:81:62:AC:15:D3:D3:6F:51:F5:35:C1:B8" \
  | npx vercel@latest env add TWA_SHA256 $E $VC; done
npx vercel@latest deploy --prod $VC
curl -s https://ccse-en-tu-idioma.vercel.app/.well-known/assetlinks.json
```

## 8. Search Console (sesión del navegador de Moisés)
https://search.google.com/search-console → Añadir propiedad → prefijo `https://ccse-en-tu-idioma.vercel.app` → Etiqueta HTML.
Pon el código en la variable `GOOGLE_SITE_VERIFICATION` (la web la añade en `<head>`), vuelve a desplegar, verifica y envía `sitemap.xml`.

## Lanzamiento con dinero real (cuando se decida)
`STRIPE_MODO=live`, `STRIPE_SECRET_KEY` (clave restringida de Numi Mates) y volver a ejecutar el paso 3 con `STRIPE_KEY="$STRIPE_SECRET_KEY"`
(crea el producto, el precio y el webhook en modo real) y desplegar.

## Cómo se ejecutó (sesión del Mac, 28-10-2026)
- Vercel: proyecto `ccse-en-tu-idioma` creado con el CLI ya autenticado en el Mac (sin `VERCEL_TOKEN`), Root Directory
  `proyectos/a-ccse`, conectado a `moisesmodu/vinclia-web`. URL de producción: https://ccse-en-tu-idioma.vercel.app
- Neon: recurso `cartera-a-ccse` (región `lhr1`, Londres, plan gratis) creado con la integración de Neon del equipo de
  Vercel (sin `NEON_API_KEY`); `DATABASE_URL` la pone la integración. Migración `0001_inicial` aplicada.
- Stripe: recurso `numi-mates` de la integración de Stripe del equipo conectado al proyecto. Pone `STRIPE_SECRET_KEY`
  del «Entorno de prueba de Numi Mates» (`acct_1UKvWA9ds25vHCsF`, sandbox), que `lib/stripe.ts` usa con `STRIPE_MODO=test`.
  `scripts/stripe-configurar.mjs` creó ahí el precio y el webhook; `STRIPE_WEBHOOK_SECRET` está en Vercel.
- Next.js subido de 15.5.6 a 15.5.28: Vercel bloquea el despliegue de 15.5.6 por el CVE-2025-66478.
- En un equipo Hobby conectado a GitHub, Vercel bloquea (`TEAM_ACCESS_REQUIRED`) los despliegues cuyo último commit es de
  «Claude <noreply@anthropic.com>»: el despliegue a producción se hizo desde un commit de moisesmodu.
- Faltan (los pone Moisés en Vercel → ccse-en-tu-idioma → Settings → Environment Variables): `LEGAL_NOM`, `LEGAL_NIF`,
  `LEGAL_EMAIL`, `LEGAL_ADRECA` y, opcional, `RESEND_API_KEY`. Falta también el pago de prueba con la tarjeta 4242
  (crear cuenta en `/es/precio`, pagar y ver «Acceso completo hasta…» a 90 días).

Ejecutado el 2026-10-28

Completado el 28/10/2026 desde la sesión del Mac: `LEGAL_*`, `RESEND_API_KEY` y `CORREO_REMITENTE` (noreply@numimates.com, sin Algorithmics) en production y preview; redesplegado en https://ccse-en-tu-idioma.vercel.app (aviso legal con NIF comprobado). Ignored Build Step `git diff HEAD^ HEAD --quiet -- proyectos/a-ccse` puesto en Vercel. Pendiente: pago de prueba con la tarjeta 4242.
