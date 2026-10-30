# Lane Dash · store listings for the three portals

Packages: `paquetes/lane-dash/lane-dash-crazygames.zip`, `lane-dash-poki.zip`, `lane-dash-itch.zip` (index.html at the
zip root, 0.71 MB each; also `lane-dash-gamedistribution.zip` and `lane-dash-gamemonetize.zip`). Covers: `portadas/`.
Screenshots 1920×1080: `capturas/`.

## Common data
- **Name:** Lane Dash
- **Studio / developer name (all portals):** Nuvolet Games · tagline "Tiny games, big smiles."
  · website https://juegos-casuales.vercel.app (planned domain nuvolet.games)
  · **contact / support email (every form):** hola@numimates.com · studio icon: `fichas/estudio-icono-512.png`
  · game icon: `portadas/lane-dash-icono-512.png`
- **Genre / category:** Runner · Action · Casual (CrazyGames: *Casual* → subcategory *Running* or *Action*; Poki: *Running games* / *Skill games*)
- **Tags:** runner, endless runner, 3 lanes, swipe, shopping cart, supermarket, coins, casual, kids, mobile
- **Controls:** swipe left / right to change lane, swipe up to jump, swipe down to duck (or drop fast from a jump).
  Mouse: click and drag in the same directions. Keyboard: arrow keys or WASD (Space also jumps).
- **Platforms:** desktop and mobile, landscape and portrait
- **Orientation:** both (portrait plays well; the camera rises in tall screens to show more of the aisle)
- **Language:** no text in the game (numbers and icons only; "LANE DASH" is the brand name); listing in English
- **Audience:** all ages. No violence (a crash is a cartoon bump with dizzy eyes), no chat, no purchases, no personal data
- **Save:** yes (best distance and total coins; on CrazyGames, in the player's account)
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.

## Texts (English)

**Short description (≤ 140 characters)**
> Swipe to dodge! Race your shopping cart down endless supermarket aisles, grab coins and deals, and don't crash!

**Description**
> Lane Dash is a three-lane runner set in the busiest supermarket in town. You are a cheerful little shopping cart
> on a mission: roll as far as you can down the endless aisles.
>
> Swipe left and right to switch lanes around parked carts and wet-floor signs. Swipe up to hop over stacks of boxes.
> Swipe down to duck under hanging sale signs. The aisles get faster and busier the further you go, and one bump ends
> the run.
>
> Grab the deal tags for a quick boost: the red tag gives a turbo that smashes through everything in your way, and the
> green tag turns on a coin magnet.
>
> • Swipe, jump and duck: learn it in 10 seconds, no text needed
> • Endless aisles that speed up the longer you survive
> • Turbo and magnet deals, coins to collect, beat your best distance
> • Short runs of 1 to 3 minutes, instant restart
> • Plays great in portrait and landscape, on phone, tablet, Chromebook and desktop
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Swipe (or drag with the mouse, or use the arrow keys / WASD) left and right to change lane, up to jump over boxes and
> down to duck under hanging signs. Steer around parked carts and wet-floor signs. Grab coins and deal tags: red =
> turbo, green = coin magnet.

**Short instructions (itch.io "Instructions" field)**
> ← → change lane · ↑ jump · ↓ duck · Red tag = turbo, green tag = magnet

## Per portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `lane-dash-crazygames.zip`. Type: HTML5. Base resolution 1280×720 (adapts to any size and aspect ratio).
- Covers: `lane-dash-1920x1080.jpg` (landscape), `lane-dash-800x1200.jpg` (portrait), `lane-dash-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `gameplayStart`/`gameplayStop`; ads only through the SDK (midgame on
  restart, never before the first run of the session; optional rewarded ad to revive once per run);
  `loadingStart/Stop`; save through `SDK.data`; English; under 50 MB; no external links; audio muted during ads;
  `happytime` on a new best. Tested with `scripts/sdk-test.mjs crazygames` (no errors).
- Form options: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and first asks for **a playable link**. Send the Vercel URL
(`https://juegos-casuales.vercel.app/lane-dash/`) and, once accepted, upload `lane-dash-poki.zip` in Poki for Developers.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  before every run except the first; optional `rewardedBreak`; no purchases or external links; any aspect ratio;
  1.6 MB initial download (limit 8 MB); works with an ad blocker. Tested with `scripts/sdk-test.mjs poki` (no errors).
- Text for the form ("Why is your game a good fit for Poki?"):
  > Endless runners are one of the most played genres on the web, but most are city chases. Lane Dash puts the
  > three-lane formula in a bright supermarket: a cute cart with a face, boxes to jump, sale signs to duck under and
  > deal tags that give a turbo or a coin magnet. No text, 1–3 minute runs, 1.6 MB download, portrait and landscape.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `lane-dash-itch.zip` and tick *This file will be played in the browser*.
- Viewport: 1280×720, tick *Mobile friendly*, *Fullscreen button* and leave *Automatically start on page load* off.
- Cover image: `lane-dash-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `08-final.jpg`.
- Classification: Games · Genre: Action / Running · Tags: runner, endless-runner, casual, swipe, supermarket, 2d, cute.
- Pricing: *No payments*. AI disclosure: *Yes* (graphics and music).
- Contact on the page: hola@numimates.com.
- Visibility: **Draft** until Moisés presses "Public".

## Technical notes
- Pseudo-3D by hand on Phaser 2D (no 3D library): the aisle is a perspective projection
  (`screen = centre + x·S/z`, `horizon + (camH − y)·S/z`). Static lines (floor, shelf boards) are baked into one
  texture per screen size; moving parts (floor tiles, products, posts, ceiling lights) are triangles in one Graphics
  with off-screen culling; obstacles, coins and tags are pooled images scaled by distance.
- In tall screens the camera rises (up to 2.4 lane widths) so portrait players see far enough ahead.
- Performance (`lane-dash/rendimiento.json`, 800×360 touch, DPR 2, CPU ×4, 45 s autopilot): see that file.
