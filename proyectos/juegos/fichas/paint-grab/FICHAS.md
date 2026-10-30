# Paint Grab · store listings for the portals

Packages: `paquetes/paint-grab/paint-grab-crazygames.zip`, `paint-grab-poki.zip`, `paint-grab-gamedistribution.zip`,
`paint-grab-gamemonetize.zip`, `paint-grab-itch.zip` (index.html at the root of each zip, 0.67 MB each).
Covers: `portadas/`. Screenshots 1920×1080: `capturas/`.

## Common data
- **Name:** Paint Grab
- **Developer name (all portals):** Nuvolet Games · tagline "Tiny games, big smiles."
  · website https://juegos-casuales.vercel.app (planned domain nuvolet.games)
  · **contact / support email (every form):** hola@numimates.com · studio icon: `fichas/estudio-icono-512.png`
- **Genre / category:** .io-style territory game · Casual · Arcade (CrazyGames: *.io* → or *Casual*; Poki: *.io games* / *Drawing*)
- **Tags:** io, territory, paint, drawing, bots, casual, kids, school, mobile, singleplayer
- **Controls:** mouse (click and drag to steer), touch (drag your finger: floating joystick), keyboard (arrow keys / WASD)
- **Platforms:** desktop and mobile, landscape and portrait
- **Orientation:** both
- **Language:** no text in the game (numbers and icons only); listing in English
- **Audience:** all ages. No violence (painters splat into paint), no chat, no purchases, no personal data
- **Multiplayer:** no. Single player against 5 to 7 bots (no server, works offline once loaded)
- **Save:** yes (best %, paint drops, shop items, daily streak; on CrazyGames, in the player's account)
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.

## Texts

**Short description (≤ 140 characters)**
> Paint the school yard! Leave your colour, loop back home to grab the ground, and never let a rival cross your trail.

**Description**
> Paint Grab is a territory game set in a sunny school yard full of chalk hopscotch and basketball lines. You are a
> little paint blob with a big smile and a bucket's worth of colour.
>
> Drag to steer. Step out of your colour and you leave a wet paint trail behind you. Loop back to your own colour and
> everything inside the loop becomes yours. But while your trail is wet you are exposed: if another painter touches
> it, you splat! Cross a rival's trail first and they're out instead.
>
> • Rounds of 2 minutes: grab the biggest share of the yard and finish on the podium
> • 5 to 7 painter bots with their own style: careful ones, greedy ones and hunters that chase your trail
> • Every round the bots get faster and smarter
> • Earn paint drops and spend them on new painters (cat, crown, propeller…) and trail styles (stars, chalk, rainbow)
> • Daily gift, no text, instant restart
> • Works on phone, tablet, Chromebook and desktop, in portrait or landscape
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Drag anywhere (mouse or finger) in the direction you want to go, or use the arrow keys / WASD. Leave your colour to
> draw a trail and come back to fill the loop. Touch a rival's trail to knock them out; don't let anyone touch yours,
> and don't cross your own trail. Own the biggest part of the yard when the 2-minute clock runs out.

**Short instructions (itch.io "Instructions" field)**
> Drag / arrows / WASD to steer · Loop back to your colour to grab ground · Cut rival trails, protect yours!

## Per portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `paint-grab-crazygames.zip`. Type: HTML5. Base resolution 1280×720 (adapts to any size).
- Covers: `paint-grab-1920x1080.jpg` (landscape), `paint-grab-800x1200.jpg` (portrait), `paint-grab-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `loadingStart/Stop`; `gameplayStart`/`gameplayStop` (start of each round, stop
  on elimination, at the end of the round, in menus and during ads); ads only through the SDK (midgame before every
  round except the first of the session, optional rewarded to revive once per run and to double the paint drops);
  save with `SDK.data`; English; under 50 MB; no external links; audio muted during ads; `happytime` on a new best or a
  1st place.
- Form options: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.
- Note for the form: inspired by the territory mechanic of .io games, single-player against bots, with its own setting,
  characters, art, cosmetics and round structure.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and first asks for **a playable link**: send the Vercel URL
(`https://juegos-casuales.vercel.app/paint-grab/`) and, once accepted, upload `paint-grab-poki.zip`.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  before every round except the first; optional `rewardedBreak`; no purchases or external links; any aspect ratio;
  1.6 MB first download (limit 8 MB); works with an ad blocker.
- "Why is your game a good fit for Poki?":
  > Territory .io games are some of the most replayed games on the web, but they need a server and are hard for young
  > players. Paint Grab keeps the satisfying "draw a loop, grab the ground" moment in 2-minute rounds against bots with
  > clear personalities, in a friendly school-yard setting with cute painters. No text, 1.6 MB, mobile and desktop.

### GameDistribution / GameMonetize
- Files: `paint-grab-gamedistribution.zip`, `paint-grab-gamemonetize.zip` (need the Game ID in `juegos.json` and a
  rebuild before the final upload, as with the other games).

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `paint-grab-itch.zip` and tick *This file will be played in the browser*.
- Viewport 1280×720, tick *Mobile friendly*, *Fullscreen button*, *Automatically start on page load: no*.
- Cover image: `paint-grab-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `capturas/10-diario.jpg`.
- Classification: Games · Genre: Action / Strategy · Tags: io, territory, paint, drawing, casual, 2d, singleplayer.
- Pricing: **Donate / pay what you want**, minimum $0, **suggested $2** (see `MONETIZACION.md`). AI disclosure: *Yes*
  (graphics and music).
- Contact on the page: hola@numimates.com.
- Visibility: **Draft** until Moisés clicks "Public".

## Screenshots (`capturas/`, 1920×1080, JPG q85)
01 menu · 02 tutorial (drag to steer) · 03, 04, 06 gameplay · 05 a big capture · 07 end of round (podium) ·
08 game over · 09 shop · 10 daily gift.
