# Monetización · CCSE en tu idioma

> Regla de SESIONES.md «Monetizar primero». Se actualiza cada semana con cifras reales (tarea programada, lunes).
> Fechas en Europe/Madrid.

## Precio
**9,99 € IVA incluido, pago único, 90 días de acceso completo.** No hay suscripción ni renovación.
Hay garantía de aprobado: si suspendes habiendo hecho 3 simulacros, se devuelve el dinero.
Se cobra con Stripe Checkout en la cuenta Numi Mates. El producto es `CCSE Fácil — Acceso 3 meses` y acepta códigos de afiliado.

Margen por venta: unos 9,2 € en la web, después de Stripe (1,5 % + 0,25 €), y unos 8,2 € en Google Play.

Ancla de valor en toda la web: «85 € cuesta el examen. 9,99 € cuesta no tener que repetirlo».

## Dónde aparece el pago (primera sesión de uso)
| Momento | Qué ve | Pantallas hasta pagado |
|---|---|---|
| Portada → test «¿Aprobarías hoy?» (5 preguntas gratis) | Nota y botones «Simulacro completo» y «Desbloquea las 300» | 2 (precio con alta → Stripe) |
| Fin de las preguntas gratis de un tema | **Oferta con el motivo**: «Has hecho las N gratis de este tema. En el examen puede salir cualquiera de las M» y botón «Desbloquear todo por 9,99 €» | 1 con cuenta (Stripe) · 2 sin cuenta |
| Las 25 gratis agotadas | «Ya has usado las 25 preguntas gratis. Te quedan 275 que pueden salir en tu examen» | Igual |
| Fin del simulacro gratis | Nota APTO / NO APTO, revisión con las explicaciones bloqueadas y muro con botón de pago directo | Igual |
| Segundo simulacro | Muro «Ya has usado tu simulacro gratis» con pago directo | Igual |
| Barra fija en móvil | «Test gratis» y «Acceso completo 9,99 €» | 2 |

El alta de cuenta en la página de precio abre Stripe sola: nunca hay más de dos pantallas entre «quiero esto» y «pagado».

## Recuperación (máximo un aviso)
- **Siempre, en la app:** quien abrió el pago y no lo terminó ve una franja arriba: «Tu pago quedó a medias · Terminar el pago». El botón va directo a Stripe. Se puede cerrar, y desaparece al pagar.
- **Por correo, una sola vez y solo con consentimiento:** Checkout caduca a las 3 h con la recuperación activada y pide permiso para enviar correos (`consent_collection.promotions = auto`). En el webhook `checkout.session.expired`, si la persona aceptó, se le envía un único correo desde `noreply@numimates.com`, con respuesta a `hola@numimates.com` y el enlace de recuperación de Stripe, que vale 30 días. El envío se anota en `Usuario.recuperacionEnviada`.
- **Si cancela en Stripe:** al volver, la página de precio le ofrece «Terminar el pago» en un clic.

## Embudo esperado (visita → pago)
Hipótesis de VIABILIDAD.md: un 4 % de conversión desde búsquedas con intención y un 2 % desde redes. Se revisa con datos reales en la semana 2.

| Paso | % del paso anterior | % de las visitas |
|---|---|---|
| Visita | — | 100 % |
| Empieza el test «¿Aprobarías hoy?» o un tema | 45 % | 45 % |
| Termina 5 preguntas | 70 % | 31 % |
| Ve una oferta con el motivo (fin de las gratis o del simulacro) | 60 % | 19 % |
| Pulsa pagar (crea la cuenta) | 25 % | 4,7 % |
| Paga en Stripe | 65 % | **3 %** |
| Recuperados por el aviso o el correo | +10 % de los que no pagan | +0,2 % |

**Objetivo: 3 ventas por cada 100 visitas.** Criterio de parada de JUICIO.md: menos de 20 ventas con más de 2.000 visitas al mes, a los 3 meses de publicar.

## Las 100 primeras visitas, sin anuncios
El gancho es real y caduca: la inscripción del examen del 26 de noviembre cierra el 5 de noviembre, y la de 2027 abre el 23 de noviembre.

| Canal | Visitas | Qué se publica | Quién | Estado |
|---|---|---|---|---|
| Grupos de Facebook y WhatsApp de inmigrantes (árabe, rumano, francés y español; 4 grupos de `marketing/comunidades.md`) | 40 | El test «¿Aprobarías hoy?» con la tarjeta para compartir en su idioma (`/og/<idioma>.jpg`) y la cuenta atrás | Claude lo deja redactado y Moisés aprueba y publica | Pendiente de aprobación |
| Reddit r/GoingToSpain y r/Spain | 15 | Respuestas útiles a hilos sobre el CCSE, con el enlace a la página del examen | Igual | Pendiente de aprobación |
| TikTok, Reels y Shorts | 20 | 3 primeros guiones de `marketing/videos.md` (es, ar, ro) | Claude los produce; Moisés aprueba | Pendiente |
| Academias de español y ONG (Accem, CEAR, Cruz Roja Lleida) | 15 | Plantilla de `marketing/comunidades.md` con código de afiliado `?ref=` | Moisés envía | Pendiente |
| Google: 300 páginas de preguntas, 20 guías y el examen en 8 idiomas | 10 | Search Console y sitemap | Sesión del Mac | Pendiente |

## Fecha del primer euro
- Despliegue con la identidad y los ganchos: **28 de octubre de 2026** (redespliegue del Mac con el commit del correo).
- Primeras publicaciones aprobadas: 29–30 de octubre, antes del cierre del 5 de noviembre.
- **Primer euro previsto: no más tarde del 11 de noviembre de 2026** (14 días después del despliegue). Lo más probable es la semana del 29 de octubre al 5 de noviembre, por la urgencia de la inscripción.
- Si el 11 de noviembre no hay venta con más de 100 visitas, se revisa el embudo paso a paso con los datos de Stripe y de la analítica antes de seguir publicando.

## Cifras reales (se rellena cada semana)
| Semana | Visitas | Tests gancho | Ofertas vistas | Checkouts abiertos | Pagos | Recuperados | Ingresos |
|---|---|---|---|---|---|---|---|
| 28/10–03/11 | — | — | — | — | — | — | 0 € |

Hoy no se miden las visitas ni los pasos intermedios: falta la analítica sin cookies (Umami). Los pagos y los checkouts abiertos salen de Stripe (`metadata.proyecto=a-ccse`) y de `Usuario.checkoutIniciado`.
