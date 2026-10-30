# Snow Plow · fichas para los tres portales

Paquetes: `paquetes/snow-plow/snow-plow-crazygames.zip`, `snow-plow-poki.zip`, `snow-plow-itch.zip` (index.html en la
raíz, 0,69 MB; también `-gamedistribution` y `-gamemonetize`). Portadas: `portadas/`. Capturas 1920×1080: `capturas/`.

**Juego de temporada:** enviarlo a CrazyGames y Poki a primeros de diciembre (fecha prevista 09/12/2026) para que entre
en las secciones de Navidad de los portales. El resto del año sigue valiendo como juego de conducción con físicas.

## Datos comunes
- **Nombre:** Snow Plow
- **Estudio / desarrollador (developer name en los tres portales):** Nuvolet Games · lema «Tiny games, big smiles.»
  · web https://juegos-casuales.vercel.app (dominio previsto nuvolet.games) · icono del estudio: `fichas/estudio-icono-512.png`
- **Género / categoría:** Driving · Physics · Casual · Christmas (CrazyGames: *Driving* → subcategoría *Car*, etiqueta
  *Christmas*; Poki: *Car games* / *Christmas games*)
- **Etiquetas:** christmas, winter, snow, santa, presents, driving, physics, truck, one button, casual, kids, mobile
- **Controles:** ratón (mantener clic), táctil (mantener el dedo), teclado (espacio / flecha arriba / flecha derecha / W / D)
- **Plataformas:** escritorio y móvil, apaisado y vertical
- **Orientación:** ambas (preferida apaisada)
- **Idioma:** sin texto en el juego (solo cifras e iconos); ficha en inglés
- **Público:** todas las edades. Sin violencia, sin chat, sin compras, sin datos personales
- **Guardado:** sí (récord de regalos, mejor distancia y regalos entregados en total; en CrazyGames, en la cuenta del jugador)
- **Contenido generado con IA:** portadas y fondo del menú (Higgsfield), música (ElevenLabs). Declararlo si el
  formulario lo pregunta.

## Textos (inglés)

**Short description (≤ 140 caracteres)**
> Hold to drive, release to brake. Push a wobbly pile of presents over snowy hills to Santa's sleigh!

**Description**
> Snow Plow is a one-button Christmas physics driving game. Santa's sleigh is waiting, the road is buried in snow and
> your little orange snow plow has a pile of presents stacked in front of its blade.
>
> Hold to drive. Release to brake. Push too hard and the top presents tumble over the blade; go too fast downhill and
> they run away; hit the ice and nothing grips. Every present that reaches a sleigh is a point, and every sleigh gives
> you five fresh presents for the next stretch. Lose them all and the run is over!
>
> • One button, zero text: learn it in 10 seconds
> • Endless snowy hills, bumps, small jumps and slippery ice that get trickier the further you go
> • A sleigh every 150 m with a refill of presents: a careful driver can go on and on
> • Short runs of 1 to 3 minutes, instant restart
> • Works on phone, tablet, Chromebook and desktop
>
> Made by Nuvolet Games. Tiny games, big smiles. Merry Christmas!

**How to play / Controls**
> Hold the mouse button, your finger or Space to drive. Release to brake. In the air: hold to lean back, release to
> lean forward. Push the presents to Santa's sleigh without losing them!

**Instrucciones cortas (itch.io, campo "Instructions")**
> Hold = drive / lean back · Release = brake / lean forward · Push the presents to the sleigh!

## Por portal

### CrazyGames (developer.crazygames.com → Upload game)
- Archivo: `snow-plow-crazygames.zip`. Tipo: HTML5. Resolución base 1280×720 (se adapta a cualquier tamaño).
- Portadas: `snow-plow-1920x1080.jpg` (landscape), `snow-plow-800x1200.jpg` (portrait), `snow-plow-800x800.jpg` (square).
- Requisitos cumplidos: SDK v3 inicializado; `gameplayStart`/`gameplayStop`; anuncios solo por el SDK (midgame al
  reiniciar, rewarded opcional para revivir con un montón nuevo de regalos); `loadingStart/Stop`; guardado con
  `SDK.data`; inglés; menos de 50 MB; sin enlaces externos; audio silenciado durante el anuncio; `happytime` al batir el
  récord.
- Opciones del formulario: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki revisa a mano y lo primero que pide es **un enlace jugable**. Enviar la URL de Vercel
(`https://juegos-casuales.vercel.app/snow-plow/`) y, cuando lo acepten, subir `snow-plow-poki.zip` a su Poki for Developers.
- Requisitos cumplidos: SDK de Poki como único sistema de anuncios; `gameLoadingFinished`; `gameplayStart/Stop`;
  `commercialBreak` antes de cada partida salvo la primera; `rewardedBreak` opcional; sin compras ni enlaces externos;
  16:9 adaptable; descarga inicial de 1,6 MB (límite 8 MB); funciona con bloqueador de anuncios.
- Texto para el formulario ("Why is your game a good fit for Poki?"):
  > Car platform games are a small share of Poki's catalogue but a large share of US plays, and Christmas brings a
  > seasonal spike. Snow Plow gives that space a festive hook: instead of carrying cargo you push a wobbly pile of
  > presents with a plow blade, so every hill and patch of ice is a decision. One button, no text, 1–3 minute runs,
  > 1.6 MB download, mobile and desktop.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Subir `snow-plow-itch.zip` y marcar *This file will be played in the browser*.
- Viewport: 1280×720, marcar *Mobile friendly*, *Fullscreen button* y *Automatically start on page load: no*.
- Cover image: `snow-plow-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` a `08-final.jpg`.
- Classification: Games · Genre: Racing / Physics · Tags: christmas, winter, snow, driving, physics, one-button, casual, 2d.
- Pricing: *No payments* (sin donaciones al principio). AI disclosure: *Yes* (gráficos y música).
- Visibilidad: **Draft** hasta que Moisés pulse "Public".

## Capturas (`capturas/`)
`01-menu` · `02-tutorial` (mano de "mantén pulsado") · `03-juego`, `04-juego`, `05-juego` · `06-entrega` (regalos entrando
en el saco del trineo) · `07-recarga` (aviso "6 entregados, +5" y regalos nuevos delante de la pala) · `08-final`.
Las capturas 06 y 07 se hicieron llevando el camión hasta el primer trineo con un atajo de prueba (el contenedor no
tiene GPU y una partida real a 1920×1080 va a 3–8 FPS); la escena es la del juego real.
