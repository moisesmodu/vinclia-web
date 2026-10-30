# Paper Glide · store listings for the three portals

Packages: `paquetes/paper-glide/paper-glide-crazygames.zip`, `paper-glide-poki.zip`, `paper-glide-itch.zip` (index.html
at the zip root, 0.67 MB each; also `paper-glide-gamedistribution.zip` and `paper-glide-gamemonetize.zip`). Covers:
`portadas/`. Screenshots 1920×1080: `capturas/`.

## Common data
- **Name:** Paper Glide
- **Studio / developer name (all portals):** Nuvolet Games · tagline "Tiny games, big smiles."
  · website https://juegos-casuales.vercel.app (planned domain nuvolet.games)
  · **contact / support email (every form):** hola@numimates.com · studio icon: `fichas/estudio-icono-512.png`
  · game icon: `portadas/paper-glide-icono-512.png`
- **Genre / category:** Casual · Flying · Upgrade (CrazyGames: *Casual* → subcategory *Flying* or *Idle/Upgrade*;
  Poki: *Flying games* / *Skill games*)
- **Tags:** paper plane, glider, flying, distance, upgrade, one button, physics, casual, kids, mobile
- **Controls:** tap to launch (when the meter's needle is in the green), then hold to climb and release to dive.
  Mouse button, finger, Space, Up arrow or W.
- **Platforms:** desktop and mobile, landscape and portrait
- **Orientation:** both (preferred landscape: you see further ahead)
- **Language:** no text in the game (numbers and icons only; "PAPER GLIDE" is the brand name); listing in English
- **Audience:** all ages. No violence (bumping a balloon or a bird just slows the plane down), no chat, no purchases,
  no personal data
- **Save:** yes (best distance, coins, upgrade levels, cosmetics, daily streak; on CrazyGames, in the player's account)
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.

## Texts (English)

**Short description (≤ 140 characters)**
> Launch a paper plane, ride the updrafts and glide as far as you can. Upgrade wings, tail and launcher to fly further!

**Description**
> Paper Glide is a one-button distance game with a paper plane that just wants to fly a little further every time.
>
> Tap to fling it off the hilltop slingshot: hit the green on the launch meter for a perfect start. Then hold to lift
> the nose and climb, and release to dive and pick up speed. Climb too much and you stall; dive too much and you hit
> the park. Ride the turquoise updrafts to soar higher, fly through golden rings for a burst of speed, and steer
> around balloons and birds.
>
> Every flight earns coins. Between flights, spend them on five upgrades with ten levels each: bigger wings, a steadier
> tail, a heavier nose, a stronger launcher and a coin magnet. Each upgrade makes the next flight go visibly further,
> from a couple of hundred metres on your first throw to well over a kilometre.
>
> • One button, zero text: learn it in 10 seconds
> • 5 upgrades × 10 levels: the "one more flight" loop
> • Updrafts, boost rings, coin arcs, balloons and birds
> • Paper colours, patterns and trails in the shop, plus a daily gift
> • Flights of 30 to 90 seconds, instant restart
> • Works on phone, tablet, Chromebook and desktop
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Tap (click, Space) when the needle is in the green to launch. Hold to climb, release to dive. Fly through updrafts to
> gain height and through golden rings for speed; avoid balloons and birds. Spend coins on upgrades between flights.

**Short instructions (itch.io "Instructions" field)**
> Tap in the green = launch · Hold = climb · Release = dive · Upgrade between flights

## Per portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `paper-glide-crazygames.zip`. Type: HTML5. Base resolution 1280×720 (adapts to any size and aspect ratio).
- Covers: `paper-glide-1920x1080.jpg` (landscape), `paper-glide-800x1200.jpg` (portrait), `paper-glide-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `gameplayStart`/`gameplayStop` (stop on landing, on the menu and during
  ads); ads only through the SDK (midgame before every flight except the first of the session; optional rewarded ad to
  relaunch once per run and to double the flight's coins); `loadingStart/Stop`; save through `SDK.data`; English;
  under 50 MB; no external links; audio muted during ads; `happytime` on a new best. Tested with
  `scripts/sdk-test-espera.mjs crazygames` (no errors).
- Form options: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and first asks for **a playable link**. Send the Vercel URL
(`https://juegos-casuales.vercel.app/paper-glide/`) and, once accepted, upload `paper-glide-poki.zip` in Poki for
Developers.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  before every flight except the first; optional `rewardedBreak` (relaunch, ×2 coins); no purchases or external
  links; any aspect ratio; 1.6 MB initial download (limit 8 MB); works with an ad blocker. Tested with
  `scripts/sdk-test-espera.mjs poki` (no errors).
- Text for the form ("Why is your game a good fit for Poki?"):
  > Upgrade-between-runs distance games keep players coming back for "one more flight", but the classics are old
  > Flash titles. Paper Glide brings that loop to a one-button paper plane: a timed launch, readable glide physics
  > (climb trades speed for height), visible updrafts, and 5 upgrades × 10 levels that make every flight go visibly
  > further. No text, 30–90 s flights, 1.6 MB download, portrait and landscape.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `paper-glide-itch.zip` and tick *This file will be played in the browser*.
- Viewport: 1280×720, tick *Mobile friendly*, *Fullscreen button* and leave *Automatically start on page load* off.
- Cover image: `paper-glide-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `10-diario.jpg`.
- Classification: Games · Genre: Simulation / Casual · Tags: paper-plane, flying, upgrades, one-button, casual, 2d, cute.
- Pricing: **Donate / pay what you want**, minimum $0, **suggested $2** (see `MONETIZACION.md`). AI disclosure: *Yes*
  (graphics and music).
- Contact on the page: hola@numimates.com.
- Visibility: **Draft** until Moisés presses "Public".

## Screenshots (`capturas/`, 1920×1080)
`01-menu` (menu with upgrades button) · `02-mejoras` (upgrades screen) · `03-tutorial` (launch meter with tap hand) ·
`04-tutorial-vuelo` (hold/release hand) · `05-juego`, `06-juego` (inside an updraft) · `07-juego` (balloon and boost
ring ahead) · `08-final` (landing: distance, best, coins, ×2, relaunch, upgrades) · `09-tienda` (cosmetics shop) ·
`10-diario` (daily gift).

## Technical notes
- Flight model in a pure module (`paper-glide/src/vuelo.ts`, no Phaser): stable arcade glider. The nose angle turns
  up while holding and down when released; speed changes with gravity along the path and drag
  `cd·v² + ci/v²` (so there is a best gliding speed); below the stall speed the wing loses lift (lift ∝ v²) and the
  nose drops by itself. Updrafts add vertical wind. Fixed 1/60 s steps on real time (`game.loop.rawDelta`).
- The same module drives the game, the Node progression simulation (`paper-glide/sim-progresion.ts`) and the
  autopilot of the performance test, so the balance numbers are the game's numbers.
- Upgrades: wings (less drag, lower stall speed), tail (faster, steadier pitch, lower stall speed), weight (less drag,
  keeps speed after bumps), launcher (+2.2 m/s and +3 m of ramp per level), magnet (+1.1 m pickup radius). Prices
  10 → 550 coins per level (×1.2 wings, ×1.1 weight, ×0.8 magnet); 9,497 coins to max everything.
- Parallax: four layers baked once into textures and drawn as TileSprites; world objects come from a pool;
  particles (trail, puffs, sparkles) live in world coordinates.
- Performance (`paper-glide/rendimiento.json`, 800×360 touch, DPR 2, CPU ×4, 45 s autopilot): see that file.
