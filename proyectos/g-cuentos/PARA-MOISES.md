# Para Moisés · Lunilla (cuentos)

La tienda está construida y probada de punta a punta en modo simulado. Para abrir el 15/11 faltan solo estas
cinco cosas, en este orden. Cada una son unos 2 minutos. Cuando estén, Claude hace el resto (desplegar la base
de datos, el pedido de prueba con Stripe y Gelato, y ajustar el precio con la cotización real).

1. **Neon (base de datos).** Crea un proyecto llamado `lunilla` en la región *Frankfurt*:
   <https://console.neon.tech/app/projects/new>. Copia la «connection string» (la normal y la *pooled*).

2. **Stripe (modo prueba).** Copia la clave secreta `sk_test_…`: <https://dashboard.stripe.com/test/apikeys>.
   Crea un webhook a `https://<la URL que te dé Vercel>/api/stripe/webhook` con el evento
   `checkout.session.completed` y copia su secreto `whsec_…`: <https://dashboard.stripe.com/test/webhooks>.

3. **Gelato (imprenta).** Crea la cuenta y una clave de API: <https://dashboard.gelato.com/> → *Developer* → *API
   keys*. Sin tarjeta todavía: los pedidos de prueba se crean como borrador y no se cobran.

4. **Vercel.** Importa el repositorio en <https://vercel.com/new> con *Root Directory* `proyectos/g-cuentos`
   (plan Pro, el de la cartera). En *Storage*, crea un *Blob store* y conéctalo. En *Settings → Environment
   Variables*, pega: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `GELATO_API_KEY`, `GELATO_MODO=borrador`, `URL_BASE` y `ADMIN_TOKEN` (cualquier texto largo y secreto; la lista
   completa está en `.env.example`).

5. **Dominio y correo.** Compra el dominio (propuestas, por orden: `lunilla.es`, `contelunilla.com`,
   `cuentoslunilla.es`; ≈10 €/año) y abre una cuenta gratuita en Resend: <https://resend.com/domains> → *Add
   domain* → añade los 3 registros DNS que te da. Pega `RESEND_API_KEY` en Vercel. Sin este paso los cuentos se
   entregan en la página del pedido, pero no llegan por correo.

**Opcional, cuando quieras:** una clave de la API de Anthropic (`ANTHROPIC_API_KEY`,
<https://console.anthropic.com/settings/keys>) para que Claude Sonnet personalice cada texto; sin ella el cuento
sale de la plantilla revisada, que ya suena bien. Coste: menos de 5 € por cada 100 cuentos.

## Decisiones pendientes (⏸)

- **Créditos de Higgsfield en diciembre.** Cada cuento vendido gasta unos 26 créditos (≈1 €). El saldo actual da
  para unas decenas de cuentos. Si la campaña va bien, habrá que recargar (más de 20 €/mes): avísame cuando quieras.
- **Textos legales.** Están redactados en `content/es-ES/legal.ts` y `content/ca-ES/legal.ts`; falta tu NIF en
  `src/config/paises/es-ES.json` y que los mire tu gestor.
- **Tareas programadas.** El prompt de las tres está en `TAREA-PROGRAMADA.md`; se crean cuando des el visto bueno.

## Mensajes para aprobar

(Vacío. La tarea diaria dejará aquí, cada lunes, los mensajes a cuentas de maternidad para el programa de afiliadas.)
