# Rocket Hop · fichas para los tres portales

Paquetes: `paquetes/rocket-hop/rocket-hop-crazygames.zip`, `rocket-hop-poki.zip`, `rocket-hop-itch.zip` (index.html en
la raíz, 0,64 MB cada uno; también `rocket-hop-gamedistribution.zip` y `rocket-hop-gamemonetize.zip`). Portadas:
`portadas/`. Capturas 1920×1080: `capturas/`.

## Datos comunes
- **Nombre:** Rocket Hop
- **Estudio / desarrollador (developer name en los tres portales):** Nuvolet Games · lema «Tiny games, big smiles.»
  · web https://juegos-casuales.vercel.app (dominio previsto nuvolet.games) · icono del estudio: `fichas/estudio-icono-512.png`
  · icono del juego: `portadas/rocket-hop-icono-512.png`
- **Género / categoría:** Skill · Physics · Casual (CrazyGames: *Casual* → subcategoría *Physics* o *Skill*; Poki: *Skill games* / *Space games*)
- **Etiquetas:** rocket, space, physics, one button, landing, skill, platform, casual, kids, mobile
- **Controles:** ratón (mantener clic), táctil (mantener el dedo), teclado (espacio / flecha arriba / W)
- **Plataformas:** escritorio y móvil, apaisado y vertical
- **Orientación:** ambas (preferida apaisada)
- **Idioma:** sin texto en el juego (solo cifras e iconos; el nombre "ROCKET HOP" es la marca); ficha en inglés
- **Público:** todas las edades. Sin violencia (la "explosión" es una nube de colores de dibujos animados), sin chat,
  sin compras, sin datos personales
- **Guardado:** sí (récord y aterrizajes perfectos acumulados; en CrazyGames, en la cuenta del jugador)
- **Contenido generado con IA:** portadas y fondo del menú (Higgsfield), música (ElevenLabs). Declararlo si el
  formulario lo pregunta.

## Textos (inglés)

**Short description (≤ 140 caracteres)**
> Hold to fire the thruster, release to fall. Hop between moving platforms and nail perfect landings before the fuel runs out!

**Description**
> Rocket Hop is a one-button physics landing game. Your little rocket has a big smile, a small tank and a long way to
> go.
>
> Hold to fire the thruster: the rocket lifts off and leans towards the next platform. Release and it straightens up
> and falls. Feather the thruster to touch down softly. Land too hard, crooked or off the edge and it goes boom!
>
> A perfect landing (slow, upright and on the yellow target) refills your fuel and gives bonus points, and perfect
> landings in a row are worth even more. Run out of fuel and your hopping days are over.
>
> • One button, zero text: learn it in 10 seconds
> • Floating platforms that slide and bob, getting smaller, faster and farther apart
> • Space wind gusts later on to keep you on your toes
> • Short runs of 1 to 3 minutes, instant restart
> • Works on phone, tablet, Chromebook and desktop
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Hold the mouse button, your finger or Space to fire the thruster. Release to fall. Land slowly and upright on the
> next platform. Hit the yellow target for a perfect landing: it refills your fuel and gives bonus points.

**Instrucciones cortas (itch.io, campo "Instructions")**
> Hold = thrust · Release = fall · Land softly on the yellow target to refuel!

## Por portal

### CrazyGames (developer.crazygames.com → Upload game)
- Archivo: `rocket-hop-crazygames.zip`. Tipo: HTML5. Resolución base 1280×720 (se adapta a cualquier tamaño).
- Portadas: `rocket-hop-1920x1080.jpg` (landscape), `rocket-hop-800x1200.jpg` (portrait), `rocket-hop-800x800.jpg` (square).
- Requisitos cumplidos: SDK v3 inicializado; `gameplayStart`/`gameplayStop`; anuncios solo por el SDK (midgame al
  reiniciar, nunca en la primera partida; rewarded opcional para revivir una vez por partida); `loadingStart/Stop`;
  guardado con `SDK.data`; inglés; menos de 50 MB; sin enlaces externos; audio silenciado durante el anuncio;
  `happytime` al batir el récord. Probado con `scripts/sdk-test.mjs crazygames` (sin errores).
- Opciones del formulario: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki revisa a mano y lo primero que pide es **un enlace jugable**. Enviar la URL de Vercel
(`https://juegos-casuales.vercel.app/rocket-hop/`) y, cuando lo acepten, subir `rocket-hop-poki.zip` a su Poki for Developers.
- Requisitos cumplidos: SDK de Poki como único sistema de anuncios; `gameLoadingFinished`; `gameplayStart/Stop`;
  `commercialBreak` antes de cada partida salvo la primera; `rewardedBreak` opcional; sin compras ni enlaces externos;
  16:9 adaptable; descarga inicial de 1,6 MB (límite 8 MB); funciona con bloqueador de anuncios. Probado con
  `scripts/sdk-test.mjs poki` (sin errores).
- Texto para el formulario ("Why is your game a good fit for Poki?"):
  > One-button skill games are easy to start and hard to put down. Rocket Hop turns the classic lunar-lander idea
  > into a cute, text-free hop between moving platforms, with a fuel bar that rewards precision: perfect landings
  > refuel you. 1–3 minute runs, 1.6 MB download, mobile and desktop.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Subir `rocket-hop-itch.zip` y marcar *This file will be played in the browser*.
- Viewport: 1280×720, marcar *Mobile friendly*, *Fullscreen button* y *Automatically start on page load: no*.
- Cover image: `rocket-hop-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` a `08-final.jpg`.
- Classification: Games · Genre: Platformer / Physics · Tags: space, rocket, physics, one-button, casual, landing, 2d.
- Pricing: *No payments* (sin donaciones al principio). AI disclosure: *Yes* (gráficos y música).
- Visibilidad: **Draft** hasta que Moisés pulse "Public".
