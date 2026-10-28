# Monetización · Aprova (proyecto M)

Regla de SESIONES.md «Monetizar primero». Estado el 28/10/2026: **cobro en modo prueba** (Stripe, cuenta Numi Mates, claves `sk_test`), con los
tres precios y el webhook creados por API y el flujo completo de la app hasta Checkout probado de punta a punta. El paso a cobro real es
`STRIPE_MODO=real` en Vercel (DESPLIEGUE.md) y se da **solo después de la prueba de validez** (VALIDESA.md): lanzar un corrector que no
coincide con un profesor destruiría la confianza en el único producto que cobra por corregir.

## 1. Precio y qué incluye
| | Gratis | Premium |
|---|---|---|
| Diagnóstico con probabilidad de aprobar | sí (repetible cada mes) | sí |
| Simulacro escrito completo | 1 al mes | ilimitados |
| Minisesión de 2 minutos y repaso de errores | sí | sí + sesión completa del plan (10–20 min) |
| Correcciones escritas con rúbrica | 3 al mes | ilimitadas |
| Oral (lectura en voz alta) | 10 min al mes | ilimitada |
| Precio | 0 € | **9,99 €/mes** · **59,99 €/año** (7 días de prueba) · **pase de convocatoria 24,99 €** (3 meses, pago único) |

Productos en Stripe: `Cartera · Català · Mensual` (price_…AseaQL), `· Anual` (price_…VQjft4), `· Passi de convocatòria` (price_…WjdMjM), en modo
prueba; `metadata.proyecto = m-catala`; IVA incluido (21 %). Aviso 7 días antes de renovar, cancelación en un clic en la cuenta, 14 días de
devolución, garantía «90 % del plan y no apruebas: 6 meses gratis».

## 2. El pago en la primera sesión
1. Entrada (90 s) → diagnóstico (12 min) → **resultado: probabilidad de aprobar, 3 puntos débiles, 3 sonidos**. Esto es lo que vale y es gratis.
2. «Crear mi plan» → pantalla **Hoy** con la sesión del día. La sesión completa (40 % repaso, 40 % área débil, 20 % producción) es
   premium; la minisesión y el repaso son gratis. El aviso con el precio y el motivo («la sesión completa hasta tu convocatoria») aparece
   justo ahí, a dos toques del pago (Hoy → Precios → Checkout).
3. Segundo gancho: la 4.ª corrección escrita del mes y el 2.º simulacro del mes muestran el mismo aviso con enlace a Precios.
4. El **pase de convocatoria** es la oferta para quien tiene fecha: 3 meses, sin renovación, al precio de un libro.

## 3. Embudo (hipótesis, se sustituyen por cifras reales cada semana)
| Paso | Porcentaje esperado | Fuente de la hipótesis |
|---|---|---|
| Visita SEO → empieza el diagnóstico | 25 % | diagnóstico sin registro, 12 min, botón único |
| Empieza → acaba el diagnóstico | 60 % | 4 bloques cortos, oral saltable |
| Acaba → vuelve al día siguiente | 35 % | racha, compromiso, correo semanal |
| Diagnóstico → pago en 30 días | 3–5 % | VIABILIDAD §0 (4 % desde búsqueda con intención) |
| Mensual → anual o pase | 30 % | precio anual anclado (Babbel, Kwiziq) |

Con 2.000 visitas/mes orgánicas (mes 4–6) → 300 diagnósticos → 12 pagos/mes → ≈ 150 €/mes; objetivo de VIABILIDAD a 12 meses:
25 suscriptores, 250 €/mes. B2B (hospitales, academias) en la sesión 3.

## 4. Las 100 primeras visitas sin anuncios
1. Las 30 páginas SEO en catalán y castellano (`/ca/guia`, `/es/guia`) indexadas; Search Console en cuanto haya dominio (o con el `.vercel.app`).
2. Calendario de convocatorias 2027 con alerta por correo: enlazado desde las comunidades de opositores (`marketing/comunitats.md`, con aprobación).
3. Los 20 candidatos de la prueba de validez y sus academias (Lleida): son los primeros usuarios y el primer boca a boca.
4. 10 vídeos cortos en catalán (`marketing/videos.md`) con errores típicos → diagnóstico.
5. CNL de Lleida, Òmnium, Plataforma per la Llengua: el diagnóstico gratuito es útil para sus alumnos (solo con aprobación de Moisés).

## 5. Primer euro
- **Condición previa:** prueba de validez ≥ 80 % (una tarde con 20 candidatos y un profesor).
- **Cobro real:** `STRIPE_MODO=real` + `node scripts/stripe-preparar.mjs` con la clave real → los precios se crean en modo real (idempotente).
- **Fecha prevista del primer euro:** 14 días después de activar el cobro real; si la validez se hace la semana del 3/11, primer euro antes
  del **25/11/2026**, con los candidatos de la prueba (3 meses de premium gratis) convertidos a pase de convocatoria en febrero y la
  inscripción de la DPL (20–28 de enero de 2027) como pico de demanda.
- **Recuperación:** quien deja el checkout a medias recibe, como máximo, un correo con el mismo enlace (Resend, tarea semanal).
