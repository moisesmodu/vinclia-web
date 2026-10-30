# Tow Truck · fichas para los portales

Paquetes: `paquetes/tow-truck/tow-truck-crazygames.zip`, `tow-truck-poki.zip`, `tow-truck-gamedistribution.zip`,
`tow-truck-gamemonetize.zip`, `tow-truck-itch.zip` (index.html en la raíz, 0,7 MB cada uno; 1,6 MB descomprimido).
Portadas: `portadas/`. Capturas 1920×1080: `capturas/`.

## Datos comunes
- **Nombre:** Tow Truck
- **Estudio / desarrollador (developer name en todos los portales):** Nuvolet Games · lema «Tiny games, big smiles.»
  · web https://juegos-casuales.vercel.app (dominio previsto nuvolet.games)
  · **correo de contacto / soporte (en todos los formularios):** hola@numimates.com · icono del estudio: `fichas/estudio-icono-512.png`
- **Género / categoría:** Driving · Physics · Casual (CrazyGames: *Driving* → subcategoría *Car*; Poki: *Car games* / *Driving*)
- **Etiquetas:** driving, physics, truck, tow truck, trailer, farm, sheep, one button, hill climb, casual, kids, mobile
- **Controles:** ratón (mantener clic), táctil (mantener el dedo), teclado (espacio / flecha arriba / flecha derecha / W / D)
- **Plataformas:** escritorio y móvil, apaisado y vertical
- **Orientación:** ambas (preferida apaisada)
- **Idioma:** sin texto en el juego (solo cifras e iconos); ficha en inglés
- **Público:** todas las edades. Sin violencia (las ovejas que se caen vuelven corriendo a la granja), sin chat, sin
  compras, sin datos personales
- **Guardado:** sí (récord, monedas, tienda y racha diaria; en CrazyGames, en la cuenta del jugador)
- **Contenido generado con IA:** portadas y fondo del menú (Higgsfield), música (ElevenLabs). Declararlo si el
  formulario lo pregunta.

## Textos (inglés)

**Short description (≤ 140 caracteres)**
> Hold to drive, release to brake. Tow a wobbly trailer of crates, barrels and sheep over farm hills to the barn!

**Description**
> Tow Truck is a one-button physics driving game on a farm at sunset. Your little tow truck pulls a trailer on a
> hinge, and nothing on it is tied down: crates, barrels and a few fluffy sheep slide, roll and bounce with every
> hill.
>
> Hold to drive. Release to brake. In the air, holding tips the truck back and releasing tips it forward. Brake too
> hard and the cargo slides off the front; fly over a crest and it jumps off the back.
>
> A red barn waits every 200 m. Everything still on the trailer is delivered, and each item scores as many points
> as the barn is far away, so later barns pay more. Then the farmer swaps the delivered cargo for a fresh load (plus
> a bonus item when three or more arrive), but anything lost on the way is gone for good. Lose all the cargo or roll
> the truck and the run is over. (The sheep are fine: they land on their feet and trot home.)
>
> • One button, zero text: learn it in 10 seconds
> • Hills, bumps, ramps and sagging rope bridges that get wilder the further you go
> • Coins for every delivery: new truck paints, trailers and cargo in the shop
> • Daily gift, short runs of 1 to 3 minutes, instant restart
> • Works on phone, tablet, Chromebook and desktop
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Hold the mouse button, your finger or Space to drive. Release to brake. In the air: hold to lean back, release to
> lean forward. Keep the cargo on the trailer until the next barn!

**Instrucciones cortas (itch.io, campo "Instructions")**
> Hold = drive / lean back · Release = brake / lean forward · Deliver the cargo to the barn!

## Por portal

### CrazyGames (developer.crazygames.com → Upload game)
- Archivo: `tow-truck-crazygames.zip`. Tipo: HTML5. Resolución base 1280×720 (se adapta a cualquier tamaño).
- Portadas: `tow-truck-1920x1080.jpg` (landscape), `tow-truck-800x1200.jpg` (portrait), `tow-truck-800x800.jpg` (square).
- Requisitos cumplidos: SDK v3 inicializado; `gameplayStart`/`gameplayStop`; anuncios solo por el SDK (midgame al
  reiniciar, rewarded opcional para revivir con 3 cargas nuevas y para doblar las monedas de la partida);
  `loadingStart/Stop`; guardado con `SDK.data`; inglés; menos de 50 MB; sin enlaces externos; audio silenciado durante
  el anuncio; `happytime` al batir el récord.
- Opciones del formulario: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*
  (la tienda usa solo monedas ganadas jugando).

### Poki (developers.poki.com → Submit a game)
Poki revisa a mano y lo primero que pide es **un enlace jugable**: la URL de Vercel
(`https://juegos-casuales.vercel.app/tow-truck/`, cuando se publique) y, si lo aceptan, `tow-truck-poki.zip`.
- Requisitos cumplidos: SDK de Poki como único sistema de anuncios; `gameLoadingFinished`; `gameplayStart/Stop`;
  `commercialBreak` antes de cada partida salvo la primera; `rewardedBreak` opcional (revivir y ×2 monedas); sin compras
  ni enlaces externos; 16:9 adaptable; descarga inicial de 1,6 MB (límite 8 MB); funciona con bloqueador de anuncios.
- Texto para el formulario ("Why is your game a good fit for Poki?"):
  > Car platform games are a small share of Poki's catalogue but a large share of US plays. Tow Truck adds a second
  > physics layer to that genre: a hinged trailer with loose cargo, so braking, hills and jumps all become decisions.
  > One button, no text, 1–3 minute runs, cute farm theme, 1.6 MB download, mobile and desktop.

### GameDistribution / GameMonetize
- Archivos: `tow-truck-gamedistribution.zip` y `tow-truck-gamemonetize.zip`. Necesitan el *Game ID* de cada panel en
  `juegos.json` (`ids`) y volver a compilar antes de subirlos.
- Mismos textos, portadas y capturas que arriba.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Subir `tow-truck-itch.zip` y marcar *This file will be played in the browser*.
- Viewport: 1280×720, marcar *Mobile friendly*, *Fullscreen button* y *Automatically start on page load: no*.
- Cover image: `tow-truck-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` a `10-diario.jpg`.
- Classification: Games · Genre: Racing / Physics · Tags: driving, physics, one-button, casual, farm, trailer, 2d.
- Pricing: **Donate / pay what you want**, mínimo 0 $, **sugerido 2 $** (ver `MONETIZACION.md`). AI disclosure: *Yes* (gráficos y música).
- Contacto en la página: hola@numimates.com.
- Visibilidad: **Draft** hasta que Moisés pulse "Public".

## Capturas (`capturas/`, 1920×1080, JPG calidad 85)
| Archivo | Qué se ve |
|---|---|
| `01-menu.jpg` | Menú con el arte de Higgsfield, récord, monedas, tienda y sonido |
| `02-tutorial.jpg` | Tutorial sin texto (mano, mantener = avanzar, carga hasta el granero) |
| `03-juego.jpg`, `04-juego.jpg` | Colinas, rampa y puente de tablas sobre el barranco |
| `05-juego.jpg`, `06-entrega.jpg` | Entrega en el granero: la carga salta al granero, «4 × 200 = +800», +4 monedas y recarga |
| `08-final.jpg` | Fin de partida: puntos, récord, distancia, monedas, ×2 con anuncio, revivir, reiniciar y menú |
| `09-tienda.jpg` | Tienda: 5 pinturas, 4 remolques, 3 cargas |
| `10-diario.jpg` | Recompensa diaria (racha de 7 días) |
