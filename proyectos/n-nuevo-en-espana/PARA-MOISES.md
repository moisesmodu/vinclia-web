# Para Moisés · N Nuevo en España (4 tareas, ≈ 10 minutos)

Todo lo demás está hecho y probado. Estas son las únicas cosas que exigen a una persona titular de las cuentas.

1. **Neon (2 min):** https://console.neon.tech/app/projects → *New project* «nuevo-en-espana», región Frankfurt.
   Copia las dos cadenas de conexión («pooled» y «direct»).
2. **Stripe en modo prueba (2 min):** https://dashboard.stripe.com/test/apikeys → copia la clave secreta `sk_test_...`.
   Después, https://dashboard.stripe.com/test/webhooks → *Add endpoint* con la URL
   `https://<tu-dominio-de-vercel>/api/stripe/webhook` y los eventos `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`, `invoice.paid`, `customer.subscription.deleted` y `charge.refunded`;
   copia el `whsec_...`.
3. **Vercel (4 min):** https://vercel.com/new → importa `moisesmodu/vinclia-web`, **Root Directory**
   `proyectos/n-nuevo-en-espana`, y pega las variables de la tabla del README (las de Neon, Stripe, y dos secretos
   aleatorios para `SECRETO_SESION` y `CRON_SECRET`). Pulsa *Deploy*. Después, en una sesión de Claude: «crea las
   tablas de N en Neon» (un comando).
4. **Tarea programada (1 min):** https://claude.ai/code → Tareas programadas → Nueva → pega el prompt de
   `TAREA-PROGRAMADA.md`, cada lunes.

Cuando quieras cobrar de verdad: cambia `sk_test_` por `sk_live_` y crea el webhook en modo real. Antes, pon tu NIF en
`config/paises/es.json` (campo `titular.nif`, ahora «PENDIENTE-NIF»), que sale en el aviso legal y las condiciones.

Opcional, sin prisa: Resend (correos reales de recordatorio; sin él, se registran pero no salen), dominio propio
(`nuevoenespana.app` u otro) y Google Play (25 $, ya previsto en la cartera; fichas listas en `marketing/play-*.md`).
