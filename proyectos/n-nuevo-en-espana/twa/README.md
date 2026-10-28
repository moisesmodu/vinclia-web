# App Android (TWA con Bubblewrap)

La app de Google Play es la misma web empaquetada. Pasos (los hace Claude en una sesión con red; Moisés solo sube el `.aab`):

1. Cambia `host` en `twa-manifest.json` por el dominio final si no es `nuevoenespana.app`.
2. `npx @bubblewrap/cli init --manifest https://<dominio>/manifest.webmanifest` (o `build` con este archivo) y genera la clave `android.keystore` (NO se sube a git; guárdala en el gestor de contraseñas).
3. `npx @bubblewrap/cli fingerprint` → copia la huella SHA-256 en `public/.well-known/assetlinks.json` y despliega.
4. `npx @bubblewrap/cli build` → `app-release-bundle.aab`.
5. En Google Play Console: ficha con los textos de `marketing/play-*.md`, declaración de contenido (no es app del Gobierno; fuentes enlazadas), clasificación de contenido y política de privacidad (`/es/legal/privacidad`).

Los pagos se hacen en la web (Stripe). En la app no se venden bienes digitales dentro de la TWA para no incumplir la política de pagos de Google Play: la app muestra las guías gratuitas y los resúmenes, y quien ya pagó entra con «Recuperar acceso». Antes de publicar, revisar la política vigente de pagos de Play para apps de lectura/contenido.
