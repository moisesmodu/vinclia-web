# Reglas comunes para las sesiones de proyecto

> Toda sesión que construya un proyecto de la cartera lee este archivo entero antes de hacer nada, y después `JUICIO.md`
> (probabilidad, veredicto y criterio de parada; el proyecto M tiene además `M-CATALA-PRODUCTE.md`), y después
> `CARTERA.md` (qué es cada proyecto y por qué) y `VIABILIDAD.md` (precios, márgenes, marketing y escenario).
> Este archivo manda sobre cualquier costumbre de la sesión.

## Quién y para qué
- Moisés Mora, autónomo en Lleida, dueño de Algorithmics Lleida. Quiere ingresos recurrentes de productos que
  **se vendan solos** (necesidad real, el cliente llega por Google, tiendas de apps o plataformas) y en los que él
  **haga lo mínimo**: abrir cuentas y aprobar. Claude construye, publica, posiciona y opera.
- Objetivo de cartera: 1.000 €/mes recurrentes en 12 meses; cada proyecto aporta su parte (ver VIABILIDAD §4).
- Escenario de marketing: el que Moisés haya marcado en VIABILIDAD §5 (por defecto S1 prudente, sin anuncios hasta el
  mes 2 y nunca sin su aprobación mensual).

## Git y estructura
- Rama base: `claude/estrategia-ingresos-recurrentes-tx0rvw`. Trabaja en la rama que te asigne la sesión, creada
  desde esa base. Al terminar, abre un PR hacia la rama base (no hacia `main`).
- Cada proyecto vive en `proyectos/<clave>/` (claves: `a-ccse`, `n-nuevo-en-espana`, `b-oposiciones`, `juegos`,
  `m-catala`, `g-cuentos`, `i-kdp`, `j-cursos`, `l-examenes`, `o-lectura`, `p-webs-adsense`). Dentro: código, `README.md`,
  `MARKETING.md`, `TAREA-PROGRAMADA.md`, `PARA-MOISES.md`.
- Binarios pesados (vídeos, PDFs de imprenta, modelos 3D) **no van a git**: súbelos al almacenamiento del proyecto
  (Vercel Blob o similar) y deja el enlace. Imágenes de web optimizadas, sí.
- Commits pequeños y frecuentes. Al acabar, añade una fila al registro de `CARTERA.md` (fecha, qué, PR).
- **Actualiza `panel/data/proyectos.json`** al terminar (y en cada hito intermedio): `estado`, `acciones` (fecha y texto),
  `ingresosMes`, `costesMes`, `clientes`, `enlaces` (demo, PR, tienda), `proximos`, `paraMoises`, y añade a `mejoras`,
  `competidores`, `repos` y `hallazgos` lo que descubras. El panel (carpeta `panel/`, desplegado en Vercel) se
  regenera con cada push: es lo único que Moisés mira. Si tocas `cartera.json` (decisiones pendientes), hazlo con cuidado.

## Pila por defecto (cámbiala solo con motivo escrito en el README)
- Web/app: Next.js (App Router) + TypeScript + Tailwind, desplegable en Vercel como proyecto propio (Root
  Directory = la carpeta del proyecto). PWA instalable. Móvil primero.
- Datos: Postgres en Neon (plan gratuito) con Prisma. Un proyecto de Neon por producto.
- Pagos: Stripe Checkout + webhooks con la cuenta real **Numi Mates** (ver `DESPLIEGUES.md` §2): desarrollo con
  `STRIPE_TEST_SECRET_KEY`, lanzamiento con `STRIPE_SECRET_KEY`; productos y precios creados por API con nombre
  `Cartera · <Proyecto> · <Plan>`. Precios en `VIABILIDAD.md`.
- Correo: Resend. IA: SDK oficial de Anthropic; `claude-haiku-5-5` para volumen (tests, variantes, traducciones),
  `claude-sonnet-5-5` cuando la calidad del texto vende (cuentos, explicaciones). Voz: ElevenLabs solo para demos y
  voces premium; para voz masiva, el TTS más barato que cumpla.
- Android: la misma PWA empaquetada como TWA (Bubblewrap) lista para Google Play; sin iOS por ahora.
- Idiomas: castellano y catalán siempre; los demás según el proyecto.
- Analítica sin cookies (Umami autoalojado o Plausible). Legales incluidos: aviso legal, privacidad (RGPD),
  cookies, condiciones de venta y desistimiento, redactados y enlazados en el pie.

## Reglas duras
1. **Nada sale hacia fuera sin aprobación de Moisés:** ni publicaciones en tiendas o redes, ni correos a terceros,
   ni anuncios. Lo dejas preparado y lo listas en `PARA-MOISES.md`.
2. **Ningún gasto nuevo:** planes gratuitos. Si algo exige pagar más de 20 €/mes, se anota como ⏸ y se sigue con lo demás.
3. **Mínimo trabajo humano:** `PARA-MOISES.md` tiene como máximo 5 tareas, cada una con enlace directo, de 2 minutos,
   y solo las que la ley o la plataforma exigen a una persona (comprar un dominio, pulsar "publicar" en una tienda,
   firmar un formulario fiscal). **Nunca** "crea el proyecto en Vercel", "conecta Neon" ni "pega la clave de Stripe":
   eso lo hace la propia sesión con los secretos del entorno (`VERCEL_TOKEN`, `NEON_API_KEY`, `STRIPE_SECRET_KEY`,
   `STRIPE_TEST_SECRET_KEY`, `RESEND_API_KEY`, `LEGAL_*`) o, si faltan, lo deja escrito en `proyectos/<clave>/DESPLIEGUE.md`
   para la sesión del Mac de Moisés. Todo está en `DESPLIEGUES.md`. Stripe es la cuenta real **Numi Mates**: se desarrolla
   con sus claves de prueba y se lanza con las reales; no se abren cuentas nuevas.
4. **No preguntes si puedes decidir tú.** Decide, anótalo en el README y sigue. Pregunta solo si la respuesta cambia
   el producto de raíz.
5. **Honestidad:** si algo no funciona o no se ha probado, se dice en el informe final. No se marca "hecho" lo que no
   se ha visto funcionar.
6. **Contenido con IA declarado donde la plataforma lo exija** (Amazon KDP, Google Play, Steam).
7. **Sin datos personales de alumnos ni familias de Algorithmics** en ningún proyecto.
8. **Preparado para varios países desde el primer día:** idioma, moneda, precios, leyes y parámetros fuera del código
   (archivos de configuración por país), contenido en carpetas por país e idioma, y rutas o dominios por mercado. Se
   lanza en el primer mercado (normalmente España); el segundo (ver `CARTERA.md`, «Expansión internacional») se abre
   solo cuando el primero tenga datos de conversión. Cada ficha del panel lleva su campo `expansion`.

## Lista «listo para vender» (la revisa Moisés, la mantienes tú)

Cada ficha de `panel/data/proyectos.json` tiene `pulido.checklist` con ocho puntos y `pulido.faltan`. Cuando cumplas un
punto, ponlo en `ok: true` en el mismo push, y actualiza `faltan` con lo que queda. No marques nada que no hayas probado.
Cuando los ocho estén en `ok`, cambia `pulido.estado` a «listo para vender». Moisés revisa los proyectos por
`pulido.prioridad`; lo que te pida en esa revisión va antes que cualquier otra cosa.

## Enlaces públicos en el panel (todo lo que se pueda abrir, se enlaza)

En `panel/data/proyectos.json`, el objeto `enlaces` de tu proyecto debe contener **todas** las URL públicas que existan,
una por línea y con nombre claro: cada juego (su página de juego y su guía), cada sitio web, cada calculadora destacada,
cada ficha en una tienda (Google Play, CrazyGames, Poki, itch.io, Amazon, Udemy), la página de precios, la vista previa
privada si la hay, y el PR. Moisés revisa los proyectos desde el panel: lo que no esté enlazado no existe para él.
Se actualiza en cada push, no al final.

## Monetizar primero (lo más importante de todas las sesiones)

Un proyecto sin un camino de cobro activo no está hecho, por bonito que sea. Antes de dar nada por terminado:

1. **Cobro real activo.** Stripe en modo real con la cuenta Numi Mates (o la monetización de la plataforma: AdSense,
   ingresos de CrazyGames/Poki, precio en Udemy o KDP) funcionando de punta a punta y probado con un pago real
   reembolsado.
2. **El pago aparece en la primera sesión de uso.** La parte gratis resuelve algo, y justo después se ofrece el pago con
   el precio claro y un motivo concreto (más preguntas, el simulacro completo, el PDF, el libro). Nunca más de dos
   pantallas entre «quiero esto» y «pagado».
3. **Recuperación.** Quien se queda a medias recibe un correo o aviso (máximo uno) con el mismo enlace de pago.
4. **Plan del primer euro.** `MONETIZACION.md` en la carpeta del proyecto: precio, embudo (de visita a pago, con el
   porcentaje esperado en cada paso), de dónde salen las 100 primeras visitas sin pagar anuncios, y la fecha prevista
   del primer euro (como máximo 14 días después del despliegue). Se actualiza cada semana con las cifras reales.
5. **El panel lo refleja.** `ingresosMes`, `clientes` y la acción «Primer euro cobrado» en `panel/data/proyectos.json`
   en cuanto ocurra. Un proyecto sin ingresos a los 30 días del lanzamiento pasa a revisión según JUICIO.md.

## Correo de contacto

Hasta tener dominio propio, el correo de contacto, del aviso legal y de respuesta es **hola@numimates.com** en todos los
proyectos (DESPLIEGUES.md §6). El remitente técnico es `noreply@numimates.com`. Nunca el correo personal de Moisés ni
nada de Algorithmics. Léelo de `LEGAL_EMAIL` y, si no existe, usa ese valor por defecto.

## Identidad de marca (obligatorio antes de cualquier pantalla o texto público)

Lee `MARCAS.md` y `marcas/tokens.json` (tu ficha está en `proyectos.<clave>`). Usa exactamente el nombre, la promesa
en los idiomas del producto, los colores, las dos fuentes y el logotipo `marcas/logos/<clave>.svg` (y `<clave>-icono.svg`
para favicon, app y tiendas). Pie con el sello común «Hecho en Lleida · Precio claro · Cancela en un clic» y pantalla de
precio con la estructura de MARCAS.md §3. Si tu proyecto ya tenía otro nombre o colores, cámbialos en tu rama; si crees
que tu nombre es mejor, dilo en el PR con el motivo y mantén el de la ficha. Anota «Identidad de marca aplicada» en
`panel/data/proyectos.json`.

## Antes de diseñar: el análisis del líder
En `panel/data/proyectos.json`, tu proyecto tiene (si existe) el campo `lider`: ingeniería inversa de producto del mejor
competidor, con su modelo y las listas `copiar`, `mejorar`, `adaptar` y `planAccion`. **Léelo antes de diseñar nada** y
aplícalo: lo que está en `copiar` se replica, lo de `mejorar` es el mínimo diferencial exigible, lo de `adaptar` manda sobre
cualquier plantilla. Si durante la sesión descubres algo nuevo del líder, añádelo ahí.

## Antes de desplegar
Ejecuta `node scripts/comprobar-entorno.mjs` (raíz del repo). Si todo está en verde, despliega tú (`DESPLIEGUES.md` §3). Si
no, escribe `proyectos/<clave>/DESPLIEGUE.md` (§4), avisa a la sesión del Mac si es alcanzable (`SendMessage` a la sesión
cuyo nombre contenga «despliegues») y sigue. El resultado del comprobador va en el informe final.

## Qué entrega cada sesión (criterio de "hecho")
- Producto desplegable con `npm run build` limpio, probado en móvil, con pago en modo prueba funcionando de punta a punta.
- `README.md`: qué es, cómo se despliega (Vercel, variables de entorno), decisiones tomadas.
- `MARKETING.md`: plan orgánico concreto ya ejecutado en parte: páginas SEO generadas (mínimo 20), textos de ficha
  para Google Play en los idiomas del proyecto, 10 guiones de vídeo corto, lista de comunidades donde publicar
  (nunca publicar sin aprobación), y plan de afiliados si aplica.
- `TAREA-PROGRAMADA.md`: el prompt exacto y la frecuencia de la tarea programada que mantendrá el proyecto solo
  (contenido nuevo, soporte, informe semanal a Moisés). Moisés la crea con un clic.
- `PARA-MOISES.md`: las 5 tareas máximas, en orden, con enlaces.
- Informe final en el chat: URL de demo, qué funciona, qué falta, qué decidiste tú, y cuánto ha costado (créditos
  de IA/vídeo usados).

## Lo que ya existe y se puede reutilizar
- `moisesmodu/algorithmics-portal`: Next.js + Prisma + Stripe + Resend + bot de WhatsApp con Claude + SEPA. Copia
  patrones (auth, Stripe webhooks, correos) pero **no** copies datos ni dependencias de Odoo.
- **`moisesmodu/numimates`** (público; web en `moisesmodu/numimates-web`): cuatro apps educativas sobre un motor (Numi Mates,
  Pro, Ment, Tech). Numi Tech tiene 4 cursos de programación y robótica con 108 sesiones, guías, presentaciones,
  imprimibles y solucionario; Numi Mates sigue el currículo de 1º de primaria a 4º de ESO. Contenido propio de Moisés,
  en catalán y castellano: base de los proyectos J (cursos) e I (libros) y venta cruzada para los de niños.
- Conectores de Moisés: ElevenLabs (voz), Higgsfield (imagen y vídeo), Gmail, Drive, Notion, GitHub.
