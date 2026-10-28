# G · Lunilla — cuentos infantiles personalizados

Tienda de cuentos personalizados en castellano y catalán. El cliente rellena nombre, edad, ciudad, mascota,
afición y un miedo o valor; elige colección (Dormir, Valores, Hermanito nuevo, Mi ciudad) e idioma; ve gratis
la portada, la dedicatoria y 3 páginas; y compra el **PDF (7,90 €)** o el **libro de tapa dura (36,90 €, envío
incluido, con el PDF de regalo)**. Fecha objetivo de apertura: **15/11/2026**.

- Landing con los 2 cuentos de muestra completos: `/` y `/ca`, lector en `/muestras/<slug>`.
- 23 páginas SEO (15 es + 8 ca): `/cuentos/*` y `/ca/contes/*`.
- Afiliadas al 20 %: `/afiliados`, `/ca/afiliades`, enlaces `/r/<código>`, panel `/afiliados/panel?t=…`.
- Administración: `/admin?t=ADMIN_TOKEN`.

## Cómo funciona

```
formulario ──► /api/cuentos ──► texto (claude-sonnet-5-5 sobre plantilla fija; si falla, la plantilla) ──► borrador
vista previa (biblioteca de ilustraciones) ──► /api/checkout ──► Stripe Checkout (o simulador sin claves)
webhook firmado ──► pagado ──► encargo de ilustración (13 prompts + hoja de personaje)
taller (tarea programada horaria con el conector de Higgsfield) ──► POST /api/admin/pedidos/:id/ilustraciones
maquetación (pdf-lib): PDF de lectura 30 págs + interior de imprenta 28 págs con 4 mm de sangrado + pliego de cubierta
correo (Resend) ──► PDF entregado ──► tapa dura: pedido a Gelato (borrador = sandbox) ──► seguimiento
```

Estados: `borrador → pagado → ilustrando → maquetando → entregado` (PDF) o `… → imprenta → enviado_imprenta → enviado`
(tapa dura). Tres fallos seguidos pasan a `incidencia`, que revisa la tarea diaria. Un cron de Vercel cada 5 minutos
(`/api/cron/procesar`) avanza lo que pueda avanzar solo y borra los borradores de más de 30 días.

### Piezas

| Pieza | Dónde | Nota |
|---|---|---|
| Catálogo (colecciones, 17 temas, compañeros, aficiones, lugares reales de 8 ciudades) | `src/lib/catalogo.ts` | Listas cerradas: la plantilla siempre suena bien |
| 4 plantillas de 12 páginas es/ca + escena de cada ilustración | `src/lib/plantillas/` | Escritas y revisadas en esta sesión |
| Relleno determinista (género, artículo personal catalán, contracciones) | `src/lib/rellenar.ts` | Test con más de 1.000 combinaciones: `npm test` |
| Texto con IA | `src/lib/texto.ts` | `claude-sonnet-5-5`, salida estructurada, validación y caída a plantilla |
| Protagonistas y prompts | `src/lib/ilustracion-prompts.ts`, `public/personajes/` | Niño y niña con hoja de personaje; nunca fotos |
| Maquetación | `src/lib/maquetacion.ts` | Andika (lectura infantil) + Sniglet; TrimBox/BleedBox |
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
  de Stripe** → encargo de 13 ilustraciones → entrega del taller → PDF de lectura (30 págs) + interior de imprenta
  (28 págs, sangrado 4 mm) + cubierta → correos → **pedido a imprenta** (cuerpo de pedido Gelato `draft`) → comisión
  de 7,38 € a la afiliada. Segundo pedido PDF en catalán entregado.
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
4. **Libro de 28 páginas interiores** (Gelato exige mínimo 28): portadilla, dedicatoria, «este libro pertenece a»,
   12 dobles páginas (texto a la izquierda, ilustración a sangre a la derecha) y colofón con la declaración de IA.
5. **Ilustración por pedido mediante un «taller»**: la API pública de Higgsfield no está documentada de forma
   verificable, así que el servidor no la llama. Cada pedido pagado deja un encargo (13 prompts + hoja de personaje)
   y una tarea programada **horaria** lo ejecuta con el conector de Higgsfield (26 créditos por cuento) y sube las
   imágenes. Por eso se promete el PDF «en menos de 2 horas», no «en minutos». Si Higgsfield publica una API
   estable, se añade como proveedor en `src/lib/ilustraciones.ts` y la entrega pasa a minutos.
6. **Vista previa sin gastar créditos**: usa la biblioteca de ilustraciones de la colección y el protagonista
   (hoy: Dormir-niño y Mi ciudad-niña, de las muestras; las otras 6 combinaciones las genera la tarea programada,
   144 créditos en total) o el retrato del protagonista, con aviso «ilustración de muestra».
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
| Esta sesión: Higgsfield | **56 créditos de 80** (2 hojas de personaje + 2 × 13 ilustraciones, Nano Banana Pro 2k, sin repeticiones) |
| Por cuento vendido | ≈26 créditos de Higgsfield (≈1 €), texto Sonnet < 0,05 €, Stripe 1,5 % + 0,25 € |
| Tapa dura | impresión + envío Gelato (estimado 23,60 €, por confirmar) |
| Fijos | Vercel Pro 20 $/mes (compartido por la cartera), Neon y Resend gratis, dominio ≈10 €/año |

⏸ **Capacidad de Higgsfield**: el plan actual da para unas pocas decenas de cuentos al mes. Si diciembre pasa de
~30 ventas habrá que recargar créditos (más de 20 €/mes): decisión de Moisés, anotada en el panel.

## Expansión (regla 8)

Precios, IVA, imprenta, fechas límite y datos legales están en `src/config/paises/es-ES.json`; el contenido, en
`content/es-ES` y `content/ca-ES`. Segundo mercado: EE. UU. en español e inglés (Gelato imprime allí), solo cuando
España tenga 100 clientes.

Licencias de fuentes: Andika y Sniglet, SIL Open Font License (`assets/fuentes/OFL-*.txt`).
