# Para Moisés · proyecto A (CCSE en tu idioma)

Cuatro tareas, en este orden. Cada una dura unos 2 minutos. Todo lo demás está hecho o lo hace Claude.

## 1. Stripe: crear la cuenta y copiar la clave de prueba
1. Crea la cuenta: https://dashboard.stripe.com/register (si ya tienes una, sirve la misma).
2. Copia la **Secret key de prueba** (`sk_test_…`): https://dashboard.stripe.com/test/apikeys
No hay que crear productos ni webhooks: la app los crea sola.

## 2. Vercel + Neon: crear el proyecto y pegar 5 valores
1. Abre https://vercel.com/new/import?s=https://github.com/moisesmodu/vinclia-web
2. **Project Name:** `ccse-en-tu-idioma` (tiene que ser exactamente este: la app Android abre ese dominio). **Root Directory:** `proyectos/a-ccse`. **Branch:** `claude/a-ccse` (o la base, cuando se fusione el PR).
3. En *Environment Variables* pega:
   - `STRIPE_SECRET_KEY` = la clave del paso 1
   - `AUTH_SECRET` = cualquier frase larga inventada (32 letras o más)
   - `NEXT_PUBLIC_SITE_URL` = `https://ccse-en-tu-idioma.vercel.app`
   - `LEGAL_NIF` = tu NIF y `LEGAL_EMAIL` = el correo de contacto que quieras mostrar en el aviso legal
4. Deploy. Después: pestaña **Storage → Create → Neon (Free) → Connect**. Rellena `DATABASE_URL` solo. Pulsa **Redeploy**.
Las tablas las crea Claude en la siguiente sesión o en la tarea programada.

## 3. Google Play: publicar la app
1. Si no tienes cuenta de desarrollador, abre una (25 $, una sola vez): https://play.google.com/console/signup
2. https://play.google.com/console → **Crear app** → nombre `Test CCSE Nacionalidad 2026`, gratuita, aplicación.
3. *Prueba interna* → crear versión → sube el archivo **`ccse-1.0.0.aab`** de este enlace:
   https://github.com/moisesmodu/vinclia-web/raw/entregas/a-ccse-android/ccse-1.0.0.aab
4. Copia los textos de la ficha de `proyectos/a-ccse/marketing/google-play/es.md` (y de los demás idiomas si quieres) y pulsa **Publicar**.
   El icono está en `proyectos/a-ccse/public/icons/icon-512.png`.
5. En *Configuración → Integridad de la app* copia la huella **SHA-256 de la clave de firma de apps** y pégala en Vercel como
   `TWA_SHA256`, seguida de una coma y esta otra (la de subida):
   `93:D1:AA:08:87:6C:96:67:98:44:BE:5C:FE:4E:B3:82:BD:12:1C:AC:81:62:AC:15:D3:D3:6F:51:F5:35:C1:B8`
   Sin esto la app funciona, pero muestra la barra de dirección arriba.

## 4. Google Search Console: verificar la web
https://search.google.com/search-console → *Añadir propiedad* → prefijo de URL `https://ccse-en-tu-idioma.vercel.app` → método
*Etiqueta HTML* (Claude la añade si le pegas el código) → envía `sitemap.xml`.

## Decisiones tuyas (no bloquean nada)
- **Clave de subida de Android:** solo existe en la sesión de Claude que la creó. Dile dónde guardarla (por ejemplo, tu Google Drive o los secretos de GitHub del repo) o, si se pierde, se pide un *reseteo de clave de subida* desde Play Console (tarda unos días).
- **Repositorio público:** las explicaciones de pago se pueden leer en GitHub. Recomendado: pasar este proyecto a un repo privado (por ejemplo, `moisesmodu/ccse`). Claude lo mueve cuando digas.
- **Afiliados:** el 30 %, ¿sobre el precio bruto o el neto? ¿El código hace descuento al comprador? ¿Cuántos accesos gratis para ONG?
- **Vídeos y comunidades:** aprobar la primera tanda de `marketing/videos.md` y los mensajes de `marketing/comunidades.md`.
