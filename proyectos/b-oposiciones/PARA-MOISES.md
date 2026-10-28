# Para Moisés · proyecto B (Aprova)

Cuatro tareas, en este orden, de unos 2 minutos cada una. Todo lo demás está hecho o lo hace la tarea semanal.

1. **Vercel: crear el proyecto.** https://vercel.com/new → importar `moisesmodu/vinclia-web` → **Root Directory:
   `proyectos/b-oposiciones`** → rama de producción `claude/estrategia-ingresos-recurrentes-tx0rvw` (o `main` cuando se
   fusione) → nombre del proyecto `aprova-oposicions` → Deploy. Sin más variables: ya funciona sin cuentas ni pagos.
2. **Neon: la base de datos.** En el proyecto de Vercel → pestaña **Storage** → **Create Database** → **Neon** (o
   https://vercel.com/marketplace/neon) → plan Free, región Frankfurt → **Connect**. Vercel añade `DATABASE_URL` sola y en el
   siguiente despliegue la app crea sus tablas. Pulsa **Redeploy**.
3. **Stripe: la clave de prueba.** https://dashboard.stripe.com/test/apikeys → copia la **Secret key** (`sk_test_…`) →
   en Vercel, **Settings → Environment Variables** → `STRIPE_SECRET_KEY` = esa clave → Redeploy. La app crea sola el
   producto y los tres precios. De paso, en https://dashboard.stripe.com/settings/billing/automatic activa "Enviar correos
   sobre próximas renovaciones" (es el aviso antes de renovar que prometen las condiciones).
4. **Tu NIF en el aviso legal** (lo exige la LSSI). Escríbelo en la próxima sesión o ponlo tú en
   `proyectos/b-oposiciones/config/paises/es.json` → `legal.nif`.

## Decisiones que te tocan cuando llegue el momento (no son tareas de hoy)
- **Mes 2: anuncios de búsqueda de 100 €/mes.** La campaña está lista en `marketing/google-ads/` para importarla en Google
  Ads Editor. Solo se activa si lo apruebas ese mes.
- **Claves reales de Stripe** (`sk_live_…`) cuando quieras cobrar de verdad: mismo sitio que la tarea 3.
- **Google Play:** la ficha y el paquete TWA están preparados (`MARKETING.md` §2, `android/`). Requiere la cuenta de
  desarrollador de 25 $ que ya está en las decisiones de la cartera.
- **Tarea programada semanal:** el prompt está en `TAREA-PROGRAMADA.md`; se crea con un clic en claude.ai/code.
