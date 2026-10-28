# Para Moisés · proyecto A (CCSE en tu idioma)

El despliegue (Vercel, Neon, Stripe, variables) lo hace la sesión del Mac con `DESPLIEGUE.md`; no tienes que hacer nada ahí.
Solo queda lo que Google Play exige a una persona.

## 1. Publicar la app en Google Play (unos 5 minutos)
1. Abre https://play.google.com/console → **Crear app** → nombre `Test CCSE Nacionalidad 2026`, gratuita.
   Si aún no tienes cuenta de desarrollador, Google la pide a tu nombre (25 $, una vez).
2. *Prueba interna* (o *Producción*) → **Crear versión** → sube este archivo:
   https://github.com/moisesmodu/vinclia-web/raw/entregas/a-ccse-android/ccse-1.0.0.aab
3. La ficha (textos en 7 idiomas, icono y capturas) está en `proyectos/a-ccse/marketing/google-play/`. La sesión del Mac puede
   rellenarla en tu navegador. Pulsa **Publicar**.

## Decisiones tuyas (no bloquean nada)
- **Clave de subida de Android:** solo existe en la sesión que la creó. El sistema no me dejó guardarla en tu Drive ni cifrada
  en el repo. Dime dónde guardarla (por ejemplo, como secreto `ANDROID_UPLOAD_KEYSTORE` del entorno). Si se pierde, se pide un
  *reseteo de clave de subida* en Play Console (tarda unos días) y se sigue igual.
- **Repositorio público:** las explicaciones de pago se pueden leer en GitHub. Recomendado: mover el proyecto a un repo privado.
- **Dominio propio** (opcional, unos 12 €/año), por ejemplo `ccseentuidioma.es`. Hasta entonces se usa `ccse-en-tu-idioma.vercel.app`.
- **Afiliados:** el 30 %, ¿sobre el bruto o el neto? ¿El código hace descuento al comprador? ¿Cuántos accesos gratis para ONG?
- **Vídeos y comunidades:** aprobar la primera tanda de `marketing/videos.md` y los mensajes de `marketing/comunidades.md`.
