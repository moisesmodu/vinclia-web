# Rope Cut · portal listings

Packages: `paquetes/rope-cut/rope-cut-crazygames.zip`, `rope-cut-poki.zip`, `rope-cut-itch.zip` (index.html at the
root, 0.67 MB; the shared scripts also build `-gamedistribution` and `-gamemonetize`). Covers: `portadas/`.
Screenshots 1920×1080: `capturas/01` to `10`; portrait phone (390×844): `capturas/11` and `12`.

## Common data
- **Name:** Rope Cut
- **Developer name (all portals):** Nuvolet Games · "Tiny games, big smiles." · web https://juegos-casuales.vercel.app
  (planned domain nuvolet.games) · studio icon: `fichas/estudio-icono-512.png`
- **Contact / support email (every form):** hola@numimates.com
- **Genre / category:** Puzzle · Physics puzzle · Casual (CrazyGames: *Puzzle*; Poki: *Puzzle games* / *Physics*)
- **Tags:** puzzle, physics, rope, cut, candy, monster, cute, levels, stars, swipe, mobile, kids, brain
- **Controls:** mouse or touch. Swipe across a rope to cut it; tap a bubble to pop it; tap an air puffer to blow.
- **Platforms:** desktop and mobile, landscape and portrait
- **Orientation:** both (portrait works especially well)
- **Language:** no text in the game (only numbers, icons and the title); listing in English
- **Audience:** all ages. No violence (the candy just crumbles and the level restarts), no chat, no purchases, no personal data
- **Save:** yes (unlocked levels, best stars per level, coins, cosmetics, daily streak; on CrazyGames, in the player's account)
- **AI-generated content:** covers and menu background (Higgsfield), music (ElevenLabs). Declare it if the form asks.
- **Ads:** interstitial only between levels, at most once every 3 finished levels and never on the first level of a
  session, never on fails or restarts; rewarded ads (always optional): skip a level (offered after 3 lost candies) and
  ×2 coins on the level-complete panel.

## Texts

**Short description (≤ 140 characters)**
> Swipe to cut the ropes and swing the candy into the jelly monster's mouth. Grab 3 stars in 40 bite-sized physics puzzles!

**Description**
> Rope Cut is a bright physics puzzle about one very hungry jelly monster. A candy hangs from one to four ropes. Swipe
> across a rope to cut it, let the candy swing, and cut again at just the right moment so it lands in the monster's mouth.
>
> Every level hides three stars along the way. Getting the candy eaten is easy; getting it eaten after collecting all
> three stars takes timing and a little planning.
>
> New tricks arrive one at a time: spike bars that crumble the candy, soap bubbles that float it upwards (tap to pop),
> air puffers that blow it sideways, pegs that grab it with a fresh rope when it flies close, moving anchors and wind.
>
> • 40 short handmade levels in four colourful candy boxes
> • Real rope physics: every swing and throw is simulated, nothing is canned
> • Up to three stars per level, instant retry when the candy is lost
> • Coins for every level fed, a shop with candy skins and hats for the monster, and a daily gift
> • Plays with one finger or the mouse, landscape or portrait
> • No text: everyone can play
>
> Made by Nuvolet Games. Tiny games, big smiles.

**How to play / Controls**
> Swipe across a rope to cut it. Tap a bubble that carries the candy to pop it, and tap an air puffer to make it blow.
> Feed the candy to the monster, and collect the three stars on the way.

**Short instructions (itch.io "Instructions" field)**
> Swipe = cut a rope · Tap the bubble = pop · Tap the puffer = blow · Feed the monster, grab 3 stars!

## Per portal

### CrazyGames (developer.crazygames.com → Upload game)
- File: `rope-cut-crazygames.zip`. Type: HTML5. Base resolution 1280×720 (adapts to any size and to portrait).
- Covers: `rope-cut-1920x1080.jpg` (landscape), `rope-cut-800x1200.jpg` (portrait), `rope-cut-800x800.jpg` (square).
- Requirements met: SDK v3 initialised; `loadingStart/Stop`; `gameplayStart` when a level starts and `gameplayStop`
  when the monster eats, in menus and around ads; ads only through the SDK (`midgame` between levels, at most every 3
  levels, never on the first; optional `rewarded` to skip a level or double the coins); save with `SDK.data`;
  `happytime` on three stars; English; under 50 MB; no external links; audio muted during ads.
- Form options: *Mobile friendly: yes* · *Orientation: both* · *Multiplayer: no* · *In-game purchases: no*.

### Poki (developers.poki.com → Submit a game)
Poki reviews by hand and first asks for a playable link: send the Vercel URL
(`https://juegos-casuales.vercel.app/rope-cut/`) and, once accepted, upload `rope-cut-poki.zip` to Poki for Developers.
- Requirements met: Poki SDK as the only ad system; `gameLoadingFinished`; `gameplayStart/Stop`; `commercialBreak`
  only at the natural break between levels (never on the first level, never on fails or restarts); optional
  `rewardedBreak` to skip a level or double the coins; no purchases or external links; adapts to any aspect ratio;
  1.6 MB download (limit 8 MB); works with an ad blocker.
- Form text ("Why is your game a good fit for Poki?"):
  > Rope-cutting physics puzzles are one of the most loved casual genres on phones, but there are few fresh ones on the
  > web. Rope Cut has a cute original jelly monster, 40 short levels that add one new trick at a time, three stars per
  > level, instant retry, no text, one-finger controls in portrait or landscape, and a 1.6 MB download.

### itch.io (itch.io/game/new)
- Kind of project: **HTML**. Upload `rope-cut-itch.zip` and tick *This file will be played in the browser*.
- Viewport: 1280×720, tick *Mobile friendly*, *Fullscreen button*; *Automatically start on page load: no*.
- Cover image: `rope-cut-itch-630x500.jpg`. Screenshots: `capturas/01-menu.jpg` to `10-diario.jpg`.
- Classification: Games · Genre: Puzzle · Tags: puzzle, physics, rope, candy, cute, short, 2d, touch, mouse, casual.
- Pricing: **Donate / pay what you want**, minimum $0, **suggested $2** (see `MONETIZACION.md`). AI disclosure: *Yes* (graphics and music).
- Contact on the page: hola@numimates.com.
- Visibility: **Draft** until Moisés clicks "Public".

## Screenshots
| File | Shows |
|---|---|
| `01-menu.jpg` | Title screen (menu art, play, level select, stars, coins and shop) |
| `02-niveles.jpg` | Level select: 4 candy boxes of 10, stars and padlocks |
| `03-tutorial.jpg` | Level 1 with the 10 s swipe tutorial |
| `04-columpio.jpg` | Level 7: the candy swings after the first cut, spike bar on the right |
| `05-burbuja.jpg` | Level 13: a bubble floats the candy on a long rope |
| `06-soplador.jpg` | Level 16: two air puffers keep the candy swinging |
| `07-ganchos-viento.jpg` | Level 36: a peg grabs the candy above a wind band |
| `08-nivel-superado.jpg` | Level complete: three stars and the coins earned |
| `09-tienda.jpg` | Shop: candy skins and hats for the monster |
| `10-diario.jpg` | Daily gift with the 7-day streak |
| `11-movil-menu.jpg`, `12-movil-juego.jpg` | Portrait phone 390×844, a rope cut with a real swipe |
