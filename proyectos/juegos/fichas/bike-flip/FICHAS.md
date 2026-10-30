# Bike Flip · fichas para los tres portales

Paquetes: `paquetes/bike-flip/bike-flip-crazygames.zip`, `bike-flip-poki.zip`, `bike-flip-itch.zip` (index.html en la
raíz, 0,65 MB; los scripts compartidos generan también `-gamedistribution` y `-gamemonetize`). Portadas: `portadas/`.
Capturas 1920×1080: `capturas/`.

## Datos comunes
- **Nombre:** Bike Flip
- **Estudio / desarrollador (developer name en los tres portales):** Nuvolet Games · lema «Tiny games, big smiles.»
  · web https://juegos-casuales.vercel.app (dominio previsto nuvolet.games) · icono del estudio: `fichas/estudio-icono-512.png`
- **Género / categoría:** Driving · Physics · Stunt (CrazyGames: *Driving* → subcategoría *Bike*; Poki: *Motorcycle games* / *Driving*)
- **Etiquetas:** bike, motorbike, dirt bike, flip, stunt, physics, driving, levels, one button, casual, kids, mobile
- **Controles:** ratón (mantener clic), táctil (mantener el dedo), teclado (espacio / flecha arriba / flecha derecha / W / D)
- **Plataformas:** escritorio y móvil, apaisado y vertical
- **Orientación:** ambas (preferida apaisada)
- **Idioma:** sin texto en el juego (solo cifras e iconos); ficha en inglés
- **Público:** todas las edades. Sin violencia (el piloto se cae y vuelve a empezar), sin chat, sin compras, sin datos personales
- **Guardado:** sí (niveles desbloqueados, estrellas y mejor tiempo por nivel; en CrazyGames, en la cuenta del jugador)
- **Contenido generado con IA:** portadas y fondo del menú (Higgsfield), música (ElevenLabs). Declararlo si el
  formulario lo pregunta.

## Textos (inglés)

**Short description (≤ 140 caracteres)**
> Hold to ride, release to lean. Flip in mid-air for a turbo boost and race to the finish flag in 20 desert levels!

**Description**
> Bike Flip is a one-button dirt bike stunt game. Ride across a sunset desert full of ramps, canyon gaps, bumps and
> steep hills, and reach the checkered flag as fast as you can.
>
> Hold to accelerate. Release to brake. In the air, holding rotates the bike back and releasing tips it forward.
> Spin a full backflip and land on your wheels to fire up a turbo boost! Just keep your helmet off the ground.
>
> • One button, zero text: learn it in 10 seconds
> • 20 handcrafted levels, from gentle hills to canyon islands
> • Full flip = turbo boost: the stunt is also the fastest line
> • Earn up to 3 stars per level by beating the clock
> • Short levels of 20 to 60 seconds, instant restart
> • Works on phone, tablet, Chromebook and desktop
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Hold the mouse button, your finger or Space to ride. Release to brake. In the air: hold to rotate back, release to
> lean forward. Do a full flip and land on both wheels for a turbo boost. Don't land on your head!

**Instrucciones cortas (itch.io, campo "Instructions")**
> Hold = ride / rotate back · Release = brake / lean forward · Full flip = turbo!

## Por portal

### CrazyGames (developer.crazygames.com → Upload game)
- Archivo: `bike-flip-crazygames.zip`. Tipo: HTML5. Resolución base 1280×720 (se adapta a cualquier tamaño).
- Portadas: `bike-flip-1920x1080.jpg` (landscape), `bike-flip-800x1200.jpg` (portrait), `bike-flip-800x800.jpg` (square).
- Requisitos cumplidos: SDK v3 inicializado; `gameplayStart`/`gameplayStop` (al empezar el nivel, al caer, en la meta,
  al ir al menú y durante los anuncios); anuncios solo por el SDK (midgame antes de cada nivel salvo el primero de la
  sesión, rewarded opcional para revivir una vez por nivel o para saltar un nivel); `loadingStart/Stop`; guardado
  con `SDK.data`; inglés; menos de 50 MB; sin enlaces externos; audio silenciado durante el anuncio; `happytime` al
  conseguir 3 estrellas o mejorar un tiempo.
- Opciones del formulario: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki revisa a mano y lo primero que pide es **un enlace jugable**. Enviar la URL de Vercel
(`https://juegos-casuales.vercel.app/bike-flip/` una vez desplegada) y, cuando lo acepten, subir `bike-flip-poki.zip`.
- Requisitos cumplidos: SDK de Poki como único sistema de anuncios; `gameLoadingFinished`; `gameplayStart/Stop`;
  `commercialBreak` antes de cada nivel salvo el primero; `rewardedBreak` opcional (revivir o saltar nivel); sin
  compras ni enlaces externos; 16:9 adaptable; descarga inicial de 1,6 MB (límite 8 MB); funciona con bloqueador de
  anuncios (los botones de vídeo no aparecen).
- Texto para el formulario ("Why is your game a good fit for Poki?"):
  > Level-based car and bike platform games are a small share of Poki's catalogue but a large share of US plays.
  > Bike Flip adds a clear stunt hook to that format: every full flip in the air becomes a turbo boost, so the risky
  > move is also the fast one. One button, no text, 20 short levels with stars, 1.6 MB, mobile and desktop.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Subir `bike-flip-itch.zip` y marcar *This file will be played in the browser*.
- Viewport: 1280×720, marcar *Mobile friendly*, *Fullscreen button* y *Automatically start on page load: no*.
- Cover image: `bike-flip-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` a `10-choque.jpg`.
- Classification: Games · Genre: Racing / Physics · Tags: bike, motorbike, stunts, physics, one-button, casual, 2d.
- Pricing: *No payments* (sin donaciones al principio). AI disclosure: *Yes* (gráficos y música).
- Visibilidad: **Draft** hasta que Moisés pulse "Public".

## Capturas (`capturas/`, 1920×1080)
01 menú · 02 selector de niveles · 03 tutorial (nivel 1) · 04–06 partida (niveles 4, 9 y 14) · 07 voltereta en el aire
· 08 turbo tras la voltereta · 09 meta con 3 estrellas · 10 choque.
