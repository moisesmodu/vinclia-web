# Monetización de Lunilla (G · cuentos personalizados)

Regla: SESIONES.md, «Monetizar primero». Se actualiza cada lunes con las cifras reales (tarea C del informe semanal).

## 1. Precio

| Producto | Precio (IVA 4 % incl.) | Margen estimado sin afiliada | Con afiliada (20 %) |
|---|---|---|---|
| PDF (30 págs, 18 o 22 ilustradas) | **7,90 €** | 5,28 € | 3,70 € |
| Libro de tapa dura 20 × 20 cm, envío incluido | **36,90 €** | 9,13 € | 1,75 € |
| Segundo cuento para hermanos | cupón `HERMANOS20` (−20 %) | — | — |

Los márgenes salen de `margenEstimado()` (`src/lib/config.ts`) con el coste de Gelato todavía **estimado** (23,60 €
impresión + envío) y ~1,90 € de ilustración por cuento (38–50 créditos). En cuanto haya `GELATO_API_KEY`,
`npm run cotizar` fija el coste real; si el margen de la tapa dura baja de 9 €, sube el precio (un número en
`src/config/paises/es-ES.json`). Ticket medio previsto: 70 % PDF + 30 % tapa dura ≈ **16,60 €**.

## 2. De «quiero esto» a «pagado» en dos pantallas

1. **Vista previa gratis** (`/cuento/<id>`): portada, dedicatoria y 3 páginas con su nombre. En la misma pantalla está
   la caja de compra (formato, correo, pagar). En móvil hay un botón «Comprar · desde 7,90 €» arriba que salta a ella.
2. **Stripe Checkout** → pagado. El PDF llega por correo en menos de 2 horas.

Lo gratis resuelve algo de verdad: la familia ve y retoca el cuento entero antes de pagar. El motivo concreto para
pagar es tener las ilustraciones, el PDF o el libro.

**Recuperación (un solo aviso):** quien llega al pago, marca «Si no termino la compra, recuérdamelo una sola vez» y no
paga en 20 horas recibe **un** correo con el enlace a su vista previa (`/api/cron/procesar`, evento `recordatorio`).
La casilla viene desmarcada (consentimiento, RGPD 6.1.a) y la política de privacidad lo explica.

## 3. Embudo esperado

| Paso | % del paso anterior | De 100 visitas |
|---|---|---|
| Visita a la portada o a una página SEO | — | 100 |
| Empieza el creador (`/crear`) | 30 % | 30 |
| Termina y ve la vista previa | 50 % | 15 |
| Pulsa «Comprar» (llega a Stripe) | 25 % | 3,8 |
| Paga (con un recordatorio) | 45 % | **1,7** |

Conversión visita → pago ≈ **1,7 %**: 100 visitas ≈ 1,7 ventas ≈ 28 €. Para el objetivo de VIABILIDAD
(150 ventas en diciembre) hacen falta ~9.000 visitas en noviembre y diciembre. Se mide con los eventos de la base de
datos (`borrador`, `checkout`, `pagado`, `recordatorio`) y `GET /api/admin/resumen`.

## 4. Las 100 primeras visitas, sin anuncios

Todo lo que sale hacia fuera necesita la aprobación de Moisés (textos listos en MARKETING.md).

| Fuente | Visitas | Cómo |
|---|---|---|
| 3–5 afiliadas de maternidad (Lleida y Cataluña, 2–20 mil seguidores) | 40 | Mensaje de MARKETING.md §5 con su cuento de regalo y enlace `/r/<código>` al 20 % |
| Grupos de familias de Lleida (Facebook «Mamás de Lleida», chats de AMPA y escoles bressol, solo donde las normas lo permitan) | 30 | Publicación útil sobre miedos nocturnos que enlaza a la página SEO, no a la tienda |
| Contactos personales de Moisés (nunca familias ni alumnos de Algorithmics) | 15 | El cuento de Leo o el de Martina como ejemplo, con «para Navidad» |
| SEO (23 páginas) + Pinterest de Navidad | 15 | Ya publicado; tarda semanas en posicionar |

El empujón de **Navidad** está en la portada (cuenta atrás hasta el 14/12 para la tapa dura y hasta el 28/12 para Reyes).

## 5. Fecha del primer euro

- Despliegue en producción: **28/10/2026** (lunilla.vercel.app).
- Primer euro previsto: **11/11/2026** como muy tarde (14 días), con las primeras afiliadas y el círculo cercano.
  Apertura pública de campaña: 15/11.
- **Bloqueante para cobrar de verdad:** Stripe en modo real con la cuenta Numi Mates y un pago real reembolsado
  (sesión del Mac, DESPLIEGUE.md). Mientras tanto, el pago está probado de punta a punta en modo de prueba.
- Cuando entre el primer pago: acción «Primer euro cobrado» y `ingresosMes` / `clientes` en `panel/data/proyectos.json`.

## 6. Seguimiento semanal

| Semana | Visitas | Vistas previas | Pagos | Ingresos | Nota |
|---|---|---|---|---|---|
| 28/10–03/11 | — | — | 0 | 0 € | Libros de 18/22 páginas listos; falta Stripe real y aprobación de los mensajes |
