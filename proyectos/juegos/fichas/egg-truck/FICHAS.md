# Egg Truck · fichas para los tres portales

Paquetes: `paquetes/egg-truck/egg-truck-crazygames.zip`, `egg-truck-poki.zip`, `egg-truck-itch.zip` (index.html en la
raíz, 0,64 MB). Portadas: `portadas/`. Capturas 1920×1080: `capturas/`.

## Datos comunes
- **Nombre:** Egg Truck
- **Género / categoría:** Driving · Physics · Casual (CrazyGames: *Driving* → subcategoría *Car*; Poki: *Car games* / *Driving*)
- **Etiquetas:** driving, physics, car, truck, one button, egg, hill climb, casual, kids, mobile
- **Controles:** ratón (mantener clic), táctil (mantener el dedo), teclado (espacio / flecha arriba / flecha derecha / W / D)
- **Plataformas:** escritorio y móvil, apaisado y vertical
- **Orientación:** ambas (preferida apaisada)
- **Idioma:** sin texto en el juego (solo cifras e iconos); ficha en inglés
- **Público:** todas las edades. Sin violencia, sin chat, sin compras, sin datos personales
- **Guardado:** sí (récord y estrellas; en CrazyGames, en la cuenta del jugador)
- **Contenido generado con IA:** portadas y fondo del menú (Higgsfield), música (ElevenLabs). Declararlo si el
  formulario lo pregunta.

## Textos (inglés)

**Short description (≤ 140 caracteres)**
> Hold to drive, release to brake. Carry a fragile egg over wild hills and big jumps without cracking it!

**Description**
> Egg Truck is a one-button physics driving game. Your little red truck has one job: carry a very nervous egg as far
> as possible.
>
> Hold to speed up. Release to brake. In the air, holding tips the truck back and releasing tips it forward, so every
> jump is a choice: land flat and the egg is safe, land hard and it cracks. Three cracks or one fall and it's
> scrambled!
>
> • One button, zero text: learn it in 10 seconds
> • Endless hills, bumps and ramps that get wilder the further you go
> • Collect stars, beat your best distance, plant a flag every 100 m
> • Short runs of 1 to 3 minutes, instant restart
> • Works on phone, tablet, Chromebook and desktop

**How to play / Controls**
> Hold the mouse button, your finger or Space to drive. Release to brake. In the air: hold to lean back, release to
> lean forward. Keep the egg in the truck!

**Instrucciones cortas (itch.io, campo "Instructions")**
> Hold = drive / lean back · Release = brake / lean forward · Keep the egg safe!

## Por portal

### CrazyGames (developer.crazygames.com → Upload game)
- Archivo: `egg-truck-crazygames.zip`. Tipo: HTML5. Resolución base 1280×720 (se adapta a cualquier tamaño).
- Portadas: `egg-truck-1920x1080.jpg` (landscape), `egg-truck-800x1200.jpg` (portrait), `egg-truck-800x800.jpg` (square).
- Requisitos cumplidos: SDK v3 inicializado; `gameplayStart`/`gameplayStop`; anuncios solo por el SDK (midgame al
  reiniciar, rewarded opcional para revivir); `loadingStart/Stop`; guardado con `SDK.data`; inglés; menos de 50 MB;
  sin enlaces externos; audio silenciado durante el anuncio; `happytime` al batir el récord.
- Opciones del formulario: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki revisa a mano y lo primero que pide es **un enlace jugable**. Enviar la URL de Vercel
(`https://juegos-casuales.vercel.app/egg-truck/`, ver `DESPLIEGUE.md`) y, cuando lo acepten, subir `egg-truck-poki.zip` a su Poki for Developers.
- Requisitos cumplidos: SDK de Poki como único sistema de anuncios; `gameLoadingFinished`; `gameplayStart/Stop`;
  `commercialBreak` antes de cada partida salvo la primera; `rewardedBreak` opcional; sin compras ni enlaces externos;
  16:9 adaptable; descarga inicial de 1,6 MB (límite 8 MB); funciona con bloqueador de anuncios.
- Texto para el formulario ("Why is your game a good fit for Poki?"):
  > Car platform games are a small share of Poki's catalogue but a large share of US plays. Egg Truck brings a fresh
  > hook to that space: a fragile cargo that turns every jump into a decision. One button, no text, 1–3 minute runs,
  > 1.6 MB download, mobile and desktop.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Subir `egg-truck-itch.zip` y marcar *This file will be played in the browser*.
- Viewport: 1280×720, marcar *Mobile friendly*, *Fullscreen button* y *Automatically start on page load: no*.
- Cover image: `egg-truck-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` a `08-final.jpg`.
- Classification: Games · Genre: Racing / Physics · Tags: driving, physics, one-button, casual, egg, hill-climb, 2d.
- Pricing: *No payments* (sin donaciones al principio). AI disclosure: *Yes* (gráficos y música).
- Visibilidad: **Draft** hasta que Moisés pulse "Public".
