# G · Lunilla — cuentos infantiles personalizados

> **Un cuento donde el protagonista eres tú.** · Familia de marca Lunilla (`MARCAS.md`, `marcas/tokens.json`):
> azul luna #2B3A67, amarillo luna #F5C84C, rosa nube #F7D6E0, crema #FFF8EC, verde hoja #6FBF8E; Baloo 2 y Nunito;
> logotipo `marcas/logos/g-cuentos.svg`; sello «Hecho en Lleida · Precio claro · Cancela en un clic». Lunilla, la luna
> con bufanda, aparece en las portadas y en la última página, que termina con una frase para decir en voz alta juntos.

Tienda de cuentos personalizados en castellano y catalán. El cliente rellena nombre, edad, ciudad, mascota,
afición y un miedo o valor; elige colección (Dormir, Valores, Hermanito nuevo, Mi ciudad) e idioma; ve gratis
la portada, la dedicatoria y 3 páginas; y compra el **PDF (7,90 €)** o el **libro de tapa dura (36,90 €, envío
incluido, con el PDF de regalo)**. Fecha objetivo de apertura: **15/11/2026**.

- Landing con los 2 cuentos de muestra completos: `/` y `/ca`, lector en `/muestras/<slug>`.
- 23 páginas SEO (15 es + 8 ca): `/cuentos/*` y `/ca/contes/*`.
- Afiliadas al 20 %: `/afiliados`, `/ca/afiliades`, enlaces `/r/<código>`, panel `/afiliados/panel?t=…`.
- Administración: `/admin?t=ADMIN_TOKEN`.

**URL pública:** https://lunilla.cat (desde el 31/10/2026; `lunilla.vercel.app` sigue activo sin redirección por el webhook de Stripe). Detalles de SEO y Search Console en `DESPLIEGUE.md`.

## Cómo funciona

```
formulario ──► /api/cuentos ──► texto (claude-sonnet-5-5 sobre plantilla fija; si falla, la plantilla) ──► borrador
vista previa (biblioteca de ilustraciones) ──► /api/checkout ──► Stripe Checkout (o simulador sin claves)
webhook firmado ──► pagado ──► encargo de ilustración (hoja propia si la familia eligió aspecto/color + portada + 18 o 22 páginas)
taller (tarea programada horaria con el conector de Higgsfield) ──► POST /api/admin/pedidos/:id/ilustraciones
maquetación (pdf-lib): PDF de lectura 32 págs (cada página del cuento ilustrada) + PDF único para Gelato de 33 págs (pliego de cubierta + guarda + 30 interiores de 200 × 200 mm con 3 mm de sangrado + blanca)
correo (Resend) ──► PDF entregado ──► tapa dura: pedido a Gelato (borrador = sandbox) ──► seguimiento
```

Estados: `borrador → pagado → ilustrando → maquetando → entregado` (PDF) o `… → imprenta → enviado_imprenta → enviado`
(tapa dura). Tres fallos seguidos pasan a `incidencia`, que revisa la tarea diaria. Un cron de Vercel cada 5 minutos
(`/api/cron/procesar`) avanza lo que pueda avanzar solo y borra los borradores de más de 30 días.

### Piezas

| Pieza | Dónde | Nota |
|---|---|---|
| Catálogo (colecciones, 17 temas, compañeros, aficiones, lugares reales de 8 ciudades) | `src/lib/catalogo.ts` | Listas cerradas: la plantilla siempre suena bien |
| 8 plantillas es/ca (4 colecciones × 2 edades: 18 páginas de 2 a 4 años, 22 de 5 a 8) + escena de cada ilustración | `src/lib/plantillas/` | Historias distintas por edad; `npx tsx scripts/revisar-plantilla.ts <id>` las revisa con todas las combinaciones |
| Relleno determinista (género, artículo personal catalán, contracciones) | `src/lib/rellenar.ts` | Test con más de 1.000 combinaciones: `npm test` |
| Texto con IA | `src/lib/texto.ts` | `claude-sonnet-5-5`, salida estructurada, validación y caída a plantilla |
| Protagonistas y prompts | `src/lib/ilustracion-prompts.ts`, `public/personajes/` | Niño y niña con hoja de personaje; nunca fotos |
| Maquetación | `src/lib/maquetacion.ts` | Baloo 2 + Nunito, Lunilla del logo dibujada en vector; TrimBox/BleedBox |
| Imprenta | `src/lib/imprenta/gelato.ts` | Gelato API v4; `GELATO_MODO=borrador` por defecto |
| Pagos | `src/lib/pagos.ts`, `src/app/api/stripe/webhook`, `scripts/stripe-configurar.mjs` | Stripe Checkout (cuenta Numi Mates) + webhook firmado |
| Correo | `src/lib/correo.ts` | Resend; sin clave guarda los correos en `datos-locales/correos` |
| Configuración por país | `src/config/paises/es-ES.json`, `content/es-ES`, `content/ca-ES` | Precios, IVA, imprenta, fechas, legal |

## Despliegue (Vercel + Neon + Stripe de Numi Mates)

Lo hace la sesión del Mac siguiendo **`DESPLIEGUE.md`** (receta exacta según `DESPLIEGUES.md` de la raíz): proyecto
de Vercel `lunilla` con Root Directory `proyectos/g-cuentos`, Neon `cartera-g-cuentos`, productos y webhook de Stripe con
`scripts/stripe-configurar.mjs` (repetible), alta en Gelato y prueba de punta a punta en producción. El esquema de la
base de datos se aplica en cada build (`prisma db push`, que nunca borra datos). Variables: `.env.example`.

Comprobador del entorno en esta sesión (`node scripts/comprobar-entorno.mjs`): red bloqueada a Stripe, Vercel, Neon y
Resend, y sin secretos. Por eso no se desplegó desde la nube.

Local:

```bash
npm install
npm run pg-local        # Postgres embebido en :54329 (PG_DIR=… si se ejecuta como root)
npx prisma db push
npm run build && npm start
ADMIN_TOKEN=… npm run prueba:e2e   # prueba de punta a punta
npx tsx scripts/generar-muestras.ts  # regenera webp y PDF de las muestras (originales en datos-locales/)
GELATO_API_KEY=… npm run cotizar     # precio real de impresión + envío y margen
```

## Estado verificado en esta sesión (28/10/2026)

- `npm run build` limpio; `tsc` sin errores; `npm test` (plantillas) en verde.
- **Prueba de punta a punta OK** (`scripts/prueba-e2e.ts`, informe en `datos-locales/e2e.json`): vista previa con el
  nombre → alta de afiliada, clic y cookie aceptada → checkout → pago → **webhook firmado verificado por la librería
  de Stripe** → encargo de 19 ilustraciones (18 páginas + portada) → retoque del texto antes de pagar → entrega del taller → PDF de lectura (32 págs) + interior de imprenta
  (PDF único de 33 págs para Gelato, sangrado 3 mm) → correos → **pedido a imprenta** (cuerpo de pedido Gelato `draft`) → comisión
  a la afiliada. Segundo pedido PDF en catalán de 22 páginas con aspecto propio (hoja de personaje del pedido) entregado.
- Revisado en móvil (390 px): sin desbordamiento horizontal en portada, formulario, vista previa, pedido, SEO,
  muestra y afiliadas.

**Lo que NO se ha podido probar (falta de claves, no de código):**
- Stripe en modo prueba real: sin `sk_test_` el pago lo hace el simulador local, que firma el evento con el mismo
  mecanismo que Stripe. El camino con Stripe Checkout + tarjeta 4242 está escrito en `prueba-e2e.ts` (Playwright)
  pero sin ejecutar.
- Gelato sandbox: sin clave, el pedido se valida y se guarda en disco. Con clave se crea como `draft` (Gelato no
  tiene sandbox; un borrador no se produce ni se cobra). **Por verificar con la clave**: los tipos de archivo del
  fotolibro (`cover`/`content`), el sangrado exacto (4 mm supuesto) y la respuesta de `cover-dimensions`.
- Texto con Sonnet 5.5: sin `ANTHROPIC_API_KEY` el texto sale de la plantilla rellenada (calidad buena, menos
  personal). Los textos de las 2 muestras los pulió Claude en esta sesión.
- Envío real de correos (Resend necesita dominio verificado).

## Decisiones tomadas (regla 4 de SESIONES.md)

0. **Identidad de marca aplicada** (MARCAS.md) con tres matices que quedan anotados para decidir:
   (a) MARCAS pide «ilustración plana y cálida»; las ilustraciones son gouache y acuarela cálidas porque ya estaban
   hechas y la textura de álbum es el diferencial frente a la competencia; (b) el texto de la ficha dice «bufanda
   amarilla» y el logotipo la dibuja azul luna: las ilustraciones siguen el texto (ocre dorado, para que se distinga
   de la luna) y el logotipo no se toca; (c) el cuento de Leo conserva su Lunilla sin bufanda en las páginas
   interiores: rehacer 11 ilustraciones superaba el tope de 80 créditos. Los cuentos nuevos ya llevan la Lunilla de
   marca (hoja de personaje como referencia en cada encargo).

1. **Marca «Lunilla»** (luna pequeña; funciona en castellano y catalán y une con la luna del cuento de dormir).
   Dominio propuesto `lunilla.es` (sin comprobar disponibilidad; alternativas en PARA-MOISES.md).
2. **Imprenta: Gelato**, no Lulu: imprime en la UE (sin aduanas), tiene pedidos en borrador para probar y el
   producto fotolibro tapa dura 20×20. No se pudo verificar el precio real (las webs de Gelato y Lulu están
   bloqueadas desde este entorno): estimación de terceros 17,60 € de impresión + 6 € de envío.
3. **Precio de tapa dura 36,90 € con envío incluido** (antes 34,90): con la estimación, 34,90 € dejaba 9,2 € de
   margen sin colchón; 36,90 € deja ≈10 €. `npm run cotizar` con la clave confirma o corrige.
   Con afiliada (20 % sobre el precio) el margen de la tapa dura baja a ≈2,65 € y el del PDF a ≈4,60 €: se acepta
   como coste de captación (VIABILIDAD: «el coste de captación lo paga la venta»). Si las afiliadas venden mucho
   tapa dura, bajar su comisión en ese formato al 15 % (un número en `es-ES.json`).
4. **Libro de 20 × 20 cm con 30 páginas interiores** (Gelato admite de 30 a 200 y el precio base incluye 30): portadilla, dedicatoria, «este libro pertenece a»,
   ficha «Así es…» con lo que contó la familia, 18 o 22 páginas de cuento (cada una con su ilustración apaisada a
   sangre arriba y el texto debajo), «Fin», páginas para la familia hasta completar 30 (diploma, dibujo,
   foto, notas, frase, familia) y colofón con la declaración de IA. Así el libro crece sin encarecer la impresión.
5. **Ilustración por pedido mediante un «taller»**: la API pública de Higgsfield no está documentada de forma
   verificable, así que el servidor no la llama. Cada pedido pagado deja un encargo (hoja propia si hace falta + portada + 18 o 22 páginas)
   y una tarea programada **horaria** lo ejecuta con el conector de Higgsfield (38 a 48 créditos por cuento) y sube las
   imágenes. Por eso se promete el PDF «en menos de 2 horas», no «en minutos». Si Higgsfield publica una API
   estable, se añade como proveedor en `src/lib/ilustraciones.ts` y la entrega pasa a minutos.
6. **Vista previa sin gastar créditos**: usa la biblioteca de ilustraciones de la colección y el protagonista
   (hoy: Dormir 2–4 niño y Mi ciudad 5–8 niña, de las muestras; las otras 14 combinaciones las genera la tarea
   programada, 8 créditos cada una) o el retrato del protagonista, con aviso «ilustración de muestra».
7. **Listas cerradas** de compañeros, aficiones y temas: garantizan que la plantilla siempre es correcta, también
   sin IA. 17 temas (miedos y valores) repartidos en las 4 colecciones.
8. **Lugares reales** solo de 8 ciudades con datos comprobables (Lleida, Barcelona, Girona, Tarragona, Madrid,
   Zaragoza, Valencia, Sevilla); el resto usa lugares genéricos.
9. **Cookie de afiliada solo con consentimiento** (aviso al llegar por `/r/<código>`); sin analítica con cookies.
   Para medir visitas, activar Vercel Web Analytics (sin cookies) en el panel.
10. **Sin Google Play**: vender un PDF dentro de una app de Play obliga a usar su facturación (15 %); la web es PWA
    instalable y los textos de ficha quedan preparados en MARKETING.md por si se decide más adelante.
11. Envíos solo a península y Baleares (Canarias, Ceuta y Melilla quedan fuera: IVA/aduanas). Stripe no permite
    filtrar por código postal, así que un CP 35/38/51/52 se para en `incidencia` para reembolsar.

## Costes

| Concepto | Coste |
|---|---|
| Esta sesión: Higgsfield | **78 créditos de 80**: 2 hojas de protagonistas + 2 × 13 ilustraciones (56), hoja de Lunilla con bufanda (2), portada y última página de Martina con Lunilla (4), repeticiones (4) y 6 páginas nuevas de Leo para el libro de 18 páginas (12). Nano Banana Pro 2k |
| Por cuento vendido | 38 a 50 créditos de Higgsfield (≈1,90 €), texto Sonnet < 0,05 €, Stripe 1,5 % + 0,25 € |
| Tapa dura | impresión + envío Gelato (estimado 23,60 €, por confirmar) |
| Fijos | Vercel Pro 20 $/mes (compartido por la cartera), Neon y Resend gratis, dominio ≈10 €/año |

⏸ **Capacidad de Higgsfield**: el plan actual da para unas pocas decenas de cuentos al mes. Si diciembre pasa de
~30 ventas habrá que recargar créditos (más de 20 €/mes): decisión de Moisés, anotada en el panel.

## Expansión (regla 8)

Precios, IVA, imprenta, fechas límite y datos legales están en `src/config/paises/es-ES.json`; el contenido, en
`content/es-ES` y `content/ca-ES`. Segundo mercado: EE. UU. en español e inglés (Gelato imprime allí), solo cuando
España tenga 100 clientes.

Licencias de fuentes: Baloo 2 y Nunito, SIL Open Font License (`assets/fuentes/OFL-*.txt`); instancias estáticas generadas con fontTools para que el PDF use los mismos pesos que la web.
