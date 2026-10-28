# Monetización · N Nuevo en España

> Regla «Monetizar primero» (SESIONES.md). Se actualiza cada semana con las cifras reales (tabla del final).
> Desplegado el 28/10/2026 en https://nuevo-en-espana.vercel.app · **Primer euro: como muy tarde el 11/11/2026.**

## Precio (IVA incluido, Stripe de Numi Mates)
| Plan | Precio | Para quién | Margen por cliente |
|---|---|---|---|
| Suscripción | **4,99 €/mes**, cancela en un clic | Quien tiene varios trámites por delante | ≈ 22 € en su vida (VIABILIDAD §1) |
| Pack 12 meses | **19,90 €**, pago único, no se renueva | Quien quiere la renovación y la nacionalidad sin suscripción | ≈ 19 € |
Gratis siempre: la guía completa de empadronamiento (con lista y recordatorios) y el resumen de las 8 guías.

## Dónde aparece el pago (primera sesión de uso, máximo dos pantallas)
1. **Al acabar la guía gratis de empadronamiento:** tarjeta «Con el padrón hecho, ¿qué toca ahora?» con el motivo
   concreto (tarjeta sanitaria, número de la Seguridad Social, renovación de 2027) y el precio → `/precios` → Stripe.
   Al completar la lista de comprobación, la celebración enlaza a esa misma tarjeta.
2. **En cualquier guía de pago:** el resumen, los datos clave y las fuentes se ven gratis; el paso a paso lleva al
   candado con «Ver precios» → `/precios` → Stripe.
3. **Recuperación (máximo uno):** quien abre Stripe y no paga ve, en su siguiente visita (pasados 2 minutos y en los
   30 días siguientes), un único aviso «Te quedaste a medias con el pago» con el mismo plan destacado. No se repite.
   Es un aviso en la web y no un correo: no hay consentimiento para correo comercial y así no hace falta pedirlo.

## Embudo esperado (por cada 100 visitas de búsqueda o comunidad)
| Paso | Personas | Paso a paso | Base |
|---|---|---|---|
| Visita | 100 | | |
| Abre una guía | 55 | 55 % | Las visitas llegan a una pregunta concreta |
| Llega al final de la guía gratis o al candado de una de pago | 30 | 55 % | |
| Abre `/precios` | 9 | 30 % | |
| Abre Stripe Checkout | 5 | 55 % | Dos casillas legales antes de pagar |
| **Paga** | **2–3** | 50 % | **2–3 % de las visitas** (VIABILIDAD §0: 2 % con anuncios, 4 % desde búsqueda con intención) |
| De los que pagan, eligen el pack | 40 % | | Hipótesis: público con poca renta y miedo a la suscripción |
Ingreso medio de la primera compra ≈ 11 € (60 % × 4,99 + 40 % × 19,90). **Para el primer euro bastan unas 50 visitas
cualificadas; para 10 clientes, unas 400.**

## Las 100 primeras visitas, sin anuncios (días 1–14)
| Origen | Visitas esperadas | Qué se hace | Quién |
|---|---|---|---|
| Comunidades de `marketing/comunidades.md` | 45 | 6 respuestas útiles con la guía gratis: 2 en r/GoingToSpain y r/expats (donde la autopromoción está permitida, como respuesta a una pregunta real), 2 en grupos de Facebook de marroquíes y senegaleses en España (plantillas en árabe y francés), 2 en canales de Telegram de ucranianos y latinoamericanos | Claude redacta; Moisés aprueba y publica (regla 1) |
| Venta cruzada desde A (CCSE en tu idioma) | 20 | Enlace «Después del examen: tu camino a la nacionalidad» de A a la guía de nacionalidad de N, y enlace de N a A en esa guía | Claude, en los dos repositorios |
| Google (30 páginas SEO + 64 páginas de guía, `sitemap.xml`) | 15 | Alta del sitemap en Google Search Console y Bing Webmaster (verificación por archivo HTML en `public/`) | Moisés inicia sesión una vez; Claude deja el archivo |
| Vídeos cortos (`marketing/videos-{es,ar,fr}.md`) | 15 | 3 vídeos el primer fin de semana: empadronarse sin contrato (es), renovación 2027 (ar), canje marroquí (fr) | Moisés aprueba las cuentas y los vídeos |
| Entidades de acogida de Lleida | 5 | Un correo a 2 entidades locales ofreciendo la guía gratuita en 7 idiomas (sin pedir nada) | Moisés envía; Claude redacta |
| **Total** | **100** | | |

## Calendario hasta el primer euro
| Día | Fecha | Hito |
|---|---|---|
| D0 | 28/10 | Desplegado en modo prueba; identidad de marca y oferta tras la guía gratis en el PR #3 |
| D1 | 29/10 | Pago de prueba con 4242 en producción; **pasar Stripe a modo real** (claves reales de Numi Mates, `scripts/stripe-configurar.mjs` en modo real) y comprobar con un pago real de 4,99 € reembolsado |
| D2–D3 | 30–31/10 | Sitemap en Search Console; enlace cruzado desde A; primeras 3 respuestas en comunidades |
| D4–D7 | 1–4/11 | 3 vídeos publicados; 3 respuestas más; correo a 2 entidades de Lleida |
| D7 | 4/11 | Revisión: visitas reales, % que llega al candado y % que abre Stripe; ajustar el texto de la oferta si abre `/precios` menos del 20 % de quienes la ven |
| **≤ D14** | **≤ 11/11** | **Primer euro cobrado** → acción «Primer euro cobrado» en el panel, `ingresosMes` y `clientes` |

Si el 11/11 no hay ningún pago con más de 100 visitas reales: probar el pack a 14,90 € una semana y la oferta también
a mitad de la guía gratis (después del paso 3). Si no hay 100 visitas, el problema es el tráfico, no el precio.

## Cifras reales (actualizar cada lunes)
| Semana | Visitas | Abren guía | Llegan al candado u oferta | Abren precios | Abren Stripe | Pagos | Ingresos | Clientes activos |
|---|---|---|---|---|---|---|---|---|
| 28/10–3/11 | — | — | — | — | — | — | 0 € | 0 |

Medición: Plausible (sin cookies; se activa con `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`) cuenta las visitas a `/precios` con su
origen (`?desde=guia-gratis`, `?desde=recuperacion`) y los eventos «checkout» y «pago». Pagos y altas, desde Stripe.
Mientras Plausible no esté activo, la tarea semanal lee los pagos de Stripe y las visitas de Vercel.
