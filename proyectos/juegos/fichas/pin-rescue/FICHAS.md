# Pin Rescue · portal listings

Packages: `paquetes/pin-rescue/pin-rescue-crazygames.zip`, `pin-rescue-poki.zip`, `pin-rescue-itch.zip` (index.html at
the root, 0.69 MB; the shared scripts also build `-gamedistribution` and `-gamemonetize`). Covers: `portadas/`.
Screenshots 1920×1080: `capturas/01` to `10`; portrait phone (390×844): `capturas/11` and `12`.

## Common data
- **Name:** Pin Rescue
- **Developer name (all portals):** Nuvolet Games · "Tiny games, big smiles." · web https://juegos-casuales.vercel.app
  (planned domain nuvolet.games) · studio icon: `fichas/estudio-icono-512.png`
- **Contact / support email (every form):** hola@numimates.com
- **Genre / category:** Puzzle · Physics puzzle · Casual (CrazyGames: *Puzzle*; Poki: *Puzzle games* / *Physics*)
- **Tags:** puzzle, pull the pin, physics, water, lava, sand, gold, logic, cute, levels, stars, mobile, kids, brain
- **Controls:** mouse or touch. Tap (or swipe across) a pin to pull it out. Keys 1-9 pull pins 1-9 on desktop.
- **Platforms:** desktop and mobile, landscape and portrait
- **Orientation:** both (portrait works especially well)
- **Language:** no text in the game (only numbers, icons and the title); listing in English
- **Audience:** all ages. No violence (slimes just fizzle away, the hero looks sad and the level restarts), no chat,
  no purchases, no personal data
- **Save:** yes (unlocked levels, best stars per level, coins, cosmetics, daily streak; on CrazyGames, in the player's account)
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.
- **Ads:** interstitial only between levels, at most once every 3 finished levels and never on the first level of a
  session, never on fails or restarts; rewarded ads (always optional): skip a level (offered after 3 failed tries) and
  ×2 coins on the level-complete panel.

## Texts

**Short description (≤ 140 characters)**
> Pull the pins in the right order: send water onto lava, sink grumpy slimes and pour the gold down to your jelly friend!

**Description**
> Pin Rescue is a bright pull-the-pin physics puzzle about a cheerful jelly friend at the bottom of an old stone tower.
> Above it, golden pins hold back chambers full of water, lava, sand, gold coins, bombs and gems. Tap a pin to slide it
> out and everything behind it pours, flows and tumbles for real.
>
> The order is everything. Water poured on lava hisses into stone. Lava that reaches your friend ends the try at once.
> Gold that falls into lava melts. Grumpy purple slimes gobble any coin that touches them, so drown them in water or
> burn them in lava first. Bombs go off when lava touches them and blast wooden crates open. Sand smothers lava too.
>
> • 40 handmade levels in four towers, each with its own designer solution
> • A real falling-sand simulation: every drop of water, grain of sand and coin is simulated
> • Up to three stars per level for the gold you save and the gems you catch; instant retry
> • Coins for every level, a shop with jelly skins and pin styles, and a daily gift
> • Plays with one finger or the mouse, landscape or portrait
> • No text: everyone can play
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Tap a pin (or swipe across it) to pull it out. Get at least half of the gold down to your jelly friend and make sure
> no grumpy slime is left. Water turns lava into stone, sand smothers lava, slimes drown in water and burn in lava,
> bombs explode when lava touches them. Never let lava or a slime touch your friend.

**Short instructions (itch.io "Instructions" field)**
> Tap a pin = pull it · Water + lava = stone · Sink the slimes · Pour the gold to your jelly friend · Grab the gems for 3 stars!

## Per portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `pin-rescue-crazygames.zip`. Type: HTML5. Base resolution 1280×720 (adapts to any size and to portrait).
- Covers: `pin-rescue-1920x1080.jpg` (landscape), `pin-rescue-800x1200.jpg` (portrait), `pin-rescue-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `loadingStart/Stop`; `gameplayStart` when a level starts and `gameplayStop`
  when it is won, in menus and around ads; ads only through the SDK (`midgame` between levels, at most every 3
  levels, never on the first; optional `rewarded` to skip a level or double the coins); save with `SDK.data`;
  `happytime` on three stars; English; under 50 MB; no external links; audio muted during ads.
- Form options: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and first asks for a playable link: send the Vercel URL
(`https://juegos-casuales.vercel.app/pin-rescue/`) and, once accepted, upload `pin-rescue-poki.zip` to Poki for Developers.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  only at the natural break between levels (never on the first level, never on fails or restarts); optional
  `rewardedBreak` to skip a level or double the coins; no purchases or external links; adapts to any aspect ratio;
  0.7 MB download (limit 8 MB); works with an ad blocker.
- Form text ("Why is your game a good fit for Poki?"):
  > Pull-the-pin puzzles are among the most played puzzle formats on phones, but most web versions fake the physics.
  > Pin Rescue simulates every drop of water, grain of sand and coin, so water really cools lava into stone and slimes
  > really drown. It has an original jelly hero, 40 short levels with one new idea at a time, three stars per level,
  > instant retry, no text, one-finger controls in portrait or landscape, and a 0.7 MB download.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `pin-rescue-itch.zip` and tick *This file will be played in the browser*.
- Viewport: 1280×720, tick *Mobile friendly*, *Fullscreen button*; *Automatically start on page load: no*.
- Cover image: `pin-rescue-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `10-diario.jpg`.
- Classification: Games · Genre: Puzzle · Tags: puzzle, physics, pull-the-pin, falling-sand, cute, short, 2d, touch, mouse, casual.
- Pricing: **Donate / pay what you want**, minimum $0, **suggested $2** (see `MONETIZACION.md`). AI disclosure: *Yes* (graphics and music).
- Contact on the page: hola@numimates.com.
- Visibility: **Draft** until Moisés clicks "Public".

## Screenshots
| File | Shows |
|---|---|
| `01-menu.jpg` | Title screen (menu art, play, level select, stars, coins and shop) |
| `02-niveles.jpg` | Level select: 4 towers of 10 levels, stars and padlocks |
| `03-tutorial.jpg` | Level 1 with the 10 s tap tutorial on the first pin |
| `04-agua-lava-piedra.jpg` | Level 3: water pours onto the lava and turns it into stone |
| `05-babosa-agua.jpg` | Level 11: water floods the grumpy slime's room |
| `06-bomba.jpg` | Level 24: a bomb drops into lava and blasts both crate plugs open |
| `07-oro.jpg` | Level 20: the gold pours down to the jelly hero |
| `08-nivel-superado.jpg` | Level complete: three stars and the coins earned |
| `09-tienda.jpg` | Shop: jelly skins and pin styles |
| `10-diario.jpg` | Daily gift with the 7-day streak |
| `11-movil-menu.jpg`, `12-movil-juego.jpg` | Portrait phone 390×844, a pin pulled with a real tap |
