# Jelly Stack · fichas para los tres portales

Paquetes: `paquetes/jelly-stack/jelly-stack-crazygames.zip`, `jelly-stack-poki.zip`, `jelly-stack-itch.zip` (index.html en
la raíz, 0,62 MB). Portadas: `portadas/`. Capturas 1920×1080: `capturas/`.

## Datos comunes
- **Nombre:** Jelly Stack
- **Estudio / desarrollador (developer name en los tres portales):** Nuvolet Games · lema «Tiny games, big smiles.»
  · web https://juegos-casuales.vercel.app (dominio previsto nuvolet.games) · icono del estudio: `fichas/estudio-icono-512.png`
- **Género / categoría:** Casual · Stacking · Hypercasual (CrazyGames: *Casual* → subcategoría *Clicker/One button*;
  Poki: *Stacking games* / *One button games*)
- **Etiquetas:** stack, stacking, jelly, one button, tap, tower, casual, kids, hypercasual, mobile
- **Controles:** ratón (clic), táctil (toque), teclado (espacio)
- **Plataformas:** escritorio y móvil, vertical y apaisado
- **Orientación:** ambas (preferida vertical en móvil)
- **Idioma:** sin texto en el juego (solo cifras e iconos); ficha en inglés
- **Público:** todas las edades. Sin violencia, sin chat, sin compras, sin datos personales
- **Guardado:** sí (récord y estrellas; en CrazyGames, en la cuenta del jugador)
- **Contenido generado con IA:** portadas y fondo del menú (Higgsfield), música (ElevenLabs). Declararlo si el
  formulario lo pregunta.

## Textos (inglés)

**Short description (≤ 140 caracteres)**
> Tap to drop the jelly. Stack it high — whatever hangs over wobbles and falls off! How tall can your jelly tower get?

**Description**
> Jelly Stack is a one-tap stacking game with the squishiest blocks you have ever seen.
>
> A cute jelly block slides back and forth above your tower. Tap to drop it. Whatever hangs over the edge is sliced
> off and tumbles away with a wobbly jiggle, and the next block is only as wide as what was left. Drop it perfectly
> and the jelly keeps its full size, sparkles and sings a rising note. Five perfect drops in a row and it even grows
> back a little!
>
> • One tap, zero text: learn it in 5 seconds
> • Soft, wobbly jelly physics and a tower that sways as it grows
> • The sky changes as you climb: blue day, candy pink, sunset, starry night
> • Perfect-drop combos, stars to collect and your best height to beat
> • Short runs of 1 to 3 minutes, instant restart
> • Works on phone, tablet, Chromebook and desktop, in portrait and landscape
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Tap, click or press Space to drop the sliding jelly onto the tower. Anything hanging over the edge falls off, so
> line it up! Perfect drops keep the full width and build a combo. Miss the tower completely and the run is over.

**Instrucciones cortas (itch.io, campo "Instructions")**
> Tap / click / Space = drop the jelly · Line it up with the block below · Perfect drops = combo!

## Por portal

### CrazyGames (developer.crazygames.com → Upload game)
- Archivo: `jelly-stack-crazygames.zip`. Tipo: HTML5. Resolución base 1280×720 (se adapta a cualquier tamaño y a vertical).
- Portadas: `jelly-stack-1920x1080.jpg` (landscape), `jelly-stack-800x1200.jpg` (portrait), `jelly-stack-800x800.jpg` (square).
- Requisitos cumplidos: SDK v3 inicializado; `gameplayStart`/`gameplayStop`; anuncios solo por el SDK (midgame al
  reiniciar, nunca en la primera partida; rewarded opcional para revivir una vez); `loadingStart/Stop`; guardado con
  `SDK.data`; inglés; menos de 50 MB; sin enlaces externos; audio silenciado durante el anuncio; `happytime` al batir
  el récord.
- Opciones del formulario: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki revisa a mano y lo primero que pide es **un enlace jugable**. Enviar la URL de Vercel
(`https://juegos-casuales.vercel.app/jelly-stack/`) y, cuando lo acepten, subir `jelly-stack-poki.zip`.
- Requisitos cumplidos: SDK de Poki como único sistema de anuncios; `gameLoadingFinished`; `gameplayStart/Stop`;
  `commercialBreak` antes de cada partida salvo la primera; `rewardedBreak` opcional; sin compras ni enlaces externos;
  adaptable a cualquier proporción; descarga inicial de 1,5 MB (límite 8 MB); funciona con bloqueador de anuncios.
- Texto para el formulario ("Why is your game a good fit for Poki?"):
  > Stacking is one of the most replayed one-button genres, but most stackers are flat, silent blocks. Jelly Stack
  > makes every cut feel good: the overhang wobbles off as soft jelly, the tower sways, perfect drops sparkle and
  > sing, and the sky turns from day to starry night as you climb. One tap, no text, 1–3 minute runs, 1.5 MB, great
  > in portrait on phones.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Subir `jelly-stack-itch.zip` y marcar *This file will be played in the browser*.
- Viewport: 1280×720, marcar *Mobile friendly*, *Fullscreen button* y *Automatically start on page load: no*.
- Cover image: `jelly-stack-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` a `08-final.jpg`.
- Classification: Games · Genre: Puzzle / Casual · Tags: stacking, one-button, casual, jelly, hypercasual, cute, 2d.
- Pricing: *No payments* (sin donaciones al principio). AI disclosure: *Yes* (gráficos y música).
- Visibilidad: **Draft** hasta que Moisés pulse "Public".

## Notas técnicas
- Sin motor de física: cada bloque es un único NineSlice (textura de 3 cortes dibujada por código) y la gelatina es un
  muelle amortiguado sobre la escala (cuerpo blando falso). Los bloques muy por debajo de la cámara se destruyen: nunca
  hay más de ~17 objetos de bloque aunque la torre pase de 90.
- Rendimiento (`jelly-stack/rendimiento.json`, `node jelly-stack/test-perf.mjs`, 800×360 táctil, DPR 2, CPU ×4, con la
  máquina cargada por otras pruebas): CPU por fotograma p50 2,9 ms · p95 8,4 ms · p99 16,5 ms; con torre de 40 a 97
  bloques p50 2,8 · p95 7,0 · p99 12,9 ms. Sin errores.
- Anuncios: `node jelly-stack/test-sdk.mjs crazygames|poki` (SDK simulados, esperas por estado).
