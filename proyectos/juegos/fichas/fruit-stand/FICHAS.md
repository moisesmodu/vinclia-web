# Fruit Stand · store listings for the portals

Packages: `paquetes/fruit-stand/fruit-stand-crazygames.zip`, `-poki.zip`, `-gamedistribution.zip`, `-gamemonetize.zip`,
`-itch.zip` (index.html at the root of each zip, 0.7 MB zipped, 1.7 MB unpacked). Covers: `portadas/`. Screenshots 1920×1080: `capturas/`.

## Common data
- **Name:** Fruit Stand
- **Developer / studio name (all portals):** Nuvolet Games · tagline "Tiny games, big smiles."
  · website https://juegos-casuales.vercel.app
  · **contact / support e-mail (every form):** hola@numimates.com · studio icon: `fichas/estudio-icono-512.png`
- **Genre / category:** Idle · Management · Casual (CrazyGames: *Casual* → *Idle*; Poki: *Idle games* / *Management*)
- **Tags:** idle, management, shop, tycoon, fruit, farm, casual, cosy, kids, mobile
- **Controls:** touch (drag anywhere: floating joystick), mouse (click and drag), keyboard (arrow keys / WASD)
- **Platforms:** desktop and mobile, landscape and portrait
- **Orientation:** both
- **Language:** no text in the game (numbers and icons only); listing in English
- **Audience:** all ages. No violence, no chat, no purchases, no personal data
- **Save:** yes, automatic (progress, stars, cosmetics; on CrazyGames, in the player's account). Offline earnings when
  the player has hired helpers (capped at 2 hours)
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.

## Texts

**Short description (≤ 140 characters)**
> Pick fruit, stock your shelves and hire helpers to grow a tiny orchard stand into a busy city market!

**Description**
> Fruit Stand is a cosy idle shop game. Walk around your little stand, pick apples straight from the trees, fill the
> shelves and collect the coins your customers leave at the counter.
>
> Spend your coins on price mats around the stand: more trees, new fruit, a bigger basket, faster shoes, a juice
> machine, helpers who pick and stock for you and a cashier who takes payments. Your helpers never fall asleep, and
> they keep the stand earning while you are away.
>
> • Three stands to grow: orchard stand, village market and city market
> • Apples, bananas, oranges, watermelons and fresh juice
> • Something new to buy every minute or two
> • Prestige: finish the city market and start again with a permanent sales bonus
> • Aprons, hats and awning colours to unlock with stars, plus a daily gift
> • One finger to play, no text, saves automatically
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Drag anywhere (or use the arrow keys) to walk. Walk next to trees to pick fruit, next to shelves to stock them and
> behind the counter to take payments. Walk over the coin pile to collect it, and stand on a price mat to buy what it
> shows. Buy the signpost to open the next stand.

**Short instructions (itch.io "Instructions" field)**
> Drag / arrows = walk · Walk past trees, shelves and the till · Stand on a price mat to buy

## Per portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `fruit-stand-crazygames.zip`. Type: HTML5. Adapts to any size (base 1280×720).
- Covers: `fruit-stand-1920x1080.jpg` (landscape), `fruit-stand-800x1200.jpg` (portrait), `fruit-stand-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `loadingStart/Stop`; `gameplayStart`/`gameplayStop` (also around every ad);
  midgame ad only at natural pauses (back from the menu, never on the first play of the session, and when a new stand
  opens); rewarded ads always optional (2× speed for 60 s, instant harvest, ×2 offline earnings); save with
  `SDK.data`; English; under 50 MB; no external links; audio muted during ads.
- Form options: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and first asks for a **playable link**: send `https://juegos-casuales.vercel.app/fruit-stand/`
and, once accepted, upload `fruit-stand-poki.zip`.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  only at natural pauses; optional `rewardedBreak`; no purchases or external links; adapts to 16:9 and portrait;
  1.7 MB initial download (limit 8 MB); works with an ad blocker.
- "Why is your game a good fit for Poki?":
  > Idle shop games keep players for long sessions, and players of the genre's leader complain that helpers fall
  > asleep. Fruit Stand keeps the loved loop (pick, stock, sell, hire) with helpers that never stop, a juice machine,
  > three stands as chapters and prestige. One finger, no text, 1.7 MB, mobile and desktop.

### GameDistribution / GameMonetize
- Files: `fruit-stand-gamedistribution.zip`, `fruit-stand-gamemonetize.zip` (they need the game id from their panel in
  `juegos.json` → `ids`, then rebuild). Same texts and covers.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `fruit-stand-itch.zip` and tick *This file will be played in the browser*.
- Viewport 1280×720, tick *Mobile friendly*, *Fullscreen button*; *Automatically start on page load: no*.
- Cover image: `fruit-stand-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `10-diario.jpg`.
- Classification: Games · Genre: Simulation · Tags: idle, management, shop, fruit, cozy, casual, 2d, kids.
- Pricing: **Donate / pay what you want**, minimum $0, **suggested $2** (see `MONETIZACION.md`). AI disclosure: *Yes*
  (graphics and music).
- Contact on the page: hola@numimates.com.
- Visibility: **Draft** until Moisés presses "Public".
