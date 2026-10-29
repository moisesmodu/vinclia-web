# Hook Hop · fichas para los tres portales

Paquetes: `paquetes/hook-hop/hook-hop-crazygames.zip`, `hook-hop-poki.zip`, `hook-hop-itch.zip` (index.html en la
raíz, 0,70 MB cada uno; también `hook-hop-gamedistribution.zip` y `hook-hop-gamemonetize.zip`). Portadas: `portadas/`.
Capturas 1920×1080: `capturas/`.

## Datos comunes
- **Nombre:** Hook Hop
- **Estudio / desarrollador (developer name en los tres portales):** Nuvolet Games · lema «Tiny games, big smiles.»
  · web https://juegos-casuales.vercel.app (dominio previsto nuvolet.games)
  · **correo de contacto / soporte (en todos los formularios):** hola@numimates.com · icono del estudio: `fichas/estudio-icono-512.png`
  · icono del juego: `portadas/hook-hop-icono-512.png`
- **Género / categoría:** Skill · Casual · Physics (CrazyGames: *Casual* → subcategoría *Skill* o *Physics*; Poki: *Skill games* / *Stickman-style swing games*)
- **Etiquetas:** swing, rope, monkey, jungle, one button, physics, skill, bananas, casual, kids, mobile
- **Controles:** ratón (mantener clic), táctil (mantener el dedo), teclado (espacio / flecha arriba / W)
- **Plataformas:** escritorio y móvil, apaisado y vertical
- **Orientación:** ambas (preferida apaisada)
- **Idioma:** sin texto en el juego (solo cifras e iconos; el nombre "HOOK HOP" es la marca); ficha en inglés
- **Público:** todas las edades. Sin violencia (caer al río es un chapuzón), sin chat, sin compras, sin datos personales
- **Guardado:** sí (récord de distancia y plátanos acumulados; en CrazyGames, en la cuenta del jugador)
- **Contenido generado con IA:** portadas y fondo del menú (Higgsfield), música (ElevenLabs). Declararlo si el
  formulario lo pregunta.

## Textos (inglés)

**Short description (≤ 140 caracteres)**
> Hold to grab a vine, release to fly! Swing a cheeky monkey through the jungle, grab bananas and don't fall in the river.

**Description**
> Hook Hop is a one-button swinging game. A cheeky little monkey wants to cross the whole jungle without touching the
> river, and the only way across is vine by vine.
>
> Hold to grab the nearest vine knot ahead (the white ring shows which one) and swing. Release to let go and fly with
> all that momentum. Let go on the way up to fly high and far, grab the next knot before you drop, and keep going!
>
> Pale, cracked knots are fragile: they creak and snap a moment after you grab them, so swing off fast. Red mushrooms
> bounce you back up if you fall short. The knots get farther apart the further you go.
>
> • One button, zero text: learn it in 10 seconds
> • Endless jungle that gets harder the further you swing
> • Grab bananas in mid-air, beat your best distance
> • Short runs of 1 to 3 minutes, instant restart
> • Works on phone, tablet, Chromebook and desktop
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Hold the mouse button, your finger or Space to grab the vine knot with the white ring and swing. Release to let go
> and fly. Let go on the upswing to fly far, then hold again to catch the next knot. Cracked knots snap, mushrooms
> bounce, and the river ends the run.

**Instrucciones cortas (itch.io, campo "Instructions")**
> Hold = grab the vine and swing · Release = let go and fly · Don't fall in the river!

## Por portal

### CrazyGames (developer.crazygames.com → Upload game)
- Archivo: `hook-hop-crazygames.zip`. Tipo: HTML5. Resolución base 1280×720 (se adapta a cualquier tamaño).
- Portadas: `hook-hop-1920x1080.jpg` (landscape), `hook-hop-800x1200.jpg` (portrait), `hook-hop-800x800.jpg` (square).
- Requisitos cumplidos: SDK v3 inicializado; `gameplayStart`/`gameplayStop`; anuncios solo por el SDK (midgame al
  reiniciar, nunca en la primera partida; rewarded opcional para revivir una vez por partida); `loadingStart/Stop`;
  guardado con `SDK.data`; inglés; menos de 50 MB; sin enlaces externos; audio silenciado durante el anuncio;
  `happytime` al batir el récord. Probado con `scripts/sdk-test.mjs crazygames` (sin errores).
- Opciones del formulario: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki revisa a mano y lo primero que pide es **un enlace jugable**. Enviar la URL de Vercel
(`https://juegos-casuales.vercel.app/hook-hop/`) y, cuando lo acepten, subir `hook-hop-poki.zip` a su Poki for Developers.
- Requisitos cumplidos: SDK de Poki como único sistema de anuncios; `gameLoadingFinished`; `gameplayStart/Stop`;
  `commercialBreak` antes de cada partida salvo la primera; `rewardedBreak` opcional; sin compras ni enlaces externos;
  16:9 adaptable; descarga inicial de 1,6 MB (límite 8 MB); funciona con bloqueador de anuncios. Probado con
  `scripts/sdk-test.mjs poki` (sin errores).
- Texto para el formulario ("Why is your game a good fit for Poki?"):
  > Swing games are one of the most played one-button genres on the web. Hook Hop gives the mechanic a warm, cute
  > jungle twist: a monkey that grabs bananas in mid-air, fragile vines that snap and bouncy mushrooms that save you.
  > No text, 1–3 minute runs, 1.6 MB download, mobile and desktop.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Subir `hook-hop-itch.zip` y marcar *This file will be played in the browser*.
- Viewport: 1280×720, marcar *Mobile friendly*, *Fullscreen button* y *Automatically start on page load: no*.
- Cover image: `hook-hop-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` a `06-final.jpg`.
- Classification: Games · Genre: Action / Physics · Tags: swing, rope, monkey, jungle, one-button, casual, physics, 2d.
- Pricing: **Donate / pay what you want**, mínimo 0 $, **sugerido 2 $** (ver `MONETIZACION.md`). AI disclosure: *Yes* (gráficos y música).
- Contacto en la página: hola@numimates.com.
- Visibilidad: **Draft** hasta que Moisés pulse "Public".
