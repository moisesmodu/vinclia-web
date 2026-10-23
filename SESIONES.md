# Reglas comunes para las sesiones de proyecto

> Toda sesión que construya un proyecto de la cartera lee este archivo entero antes de hacer nada, y después
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
  `m-catala`, `g-cuentos`, `i-kdp`, `j-cursos`, `l-examenes`, `o-lectura`). Dentro: código, `README.md`,
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
- Pagos: Stripe Checkout + webhooks, claves por variables de entorno. Hasta que Moisés pase las claves, todo funciona
  en modo prueba con claves `sk_test_`. Precios en `VIABILIDAD.md`.
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
   y solo las que la ley o la plataforma exigen a una persona (abrir cuenta, pegar una clave, pulsar "publicar").
4. **No preguntes si puedes decidir tú.** Decide, anótalo en el README y sigue. Pregunta solo si la respuesta cambia
   el producto de raíz.
5. **Honestidad:** si algo no funciona o no se ha probado, se dice en el informe final. No se marca "hecho" lo que no
   se ha visto funcionar.
6. **Contenido con IA declarado donde la plataforma lo exija** (Amazon KDP, Google Play, Steam).
7. **Sin datos personales de alumnos ni familias de Algorithmics** en ningún proyecto.

## Antes de diseñar: el análisis del líder
En `panel/data/proyectos.json`, tu proyecto tiene (si existe) el campo `lider`: ingeniería inversa de producto del mejor
competidor, con su modelo y las listas `copiar`, `mejorar`, `adaptar` y `planAccion`. **Léelo antes de diseñar nada** y
aplícalo: lo que está en `copiar` se replica, lo de `mejorar` es el mínimo diferencial exigible, lo de `adaptar` manda sobre
cualquier plantilla. Si durante la sesión descubres algo nuevo del líder, añádelo ahí.

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
- Conectores de Moisés: ElevenLabs (voz), Higgsfield (imagen y vídeo), Gmail, Drive, Notion, GitHub.
